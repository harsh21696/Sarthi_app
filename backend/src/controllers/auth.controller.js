const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');
const { generateOtp, sendOtpEmail, sendWelcomeEmail } = require('../services/email.service');
const { z } = require('zod');

// ─── Validation Schemas ───────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['farmer', 'student', 'villager']).default('villager'),
  state: z.string().optional(),
  preferredLanguage: z.string().default('en'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: data.role,
        state: data.state,
        preferredLanguage: data.preferredLanguage,
        otp,
        otpExpiry,
        emailVerified: false,
      },
      select: { id: true, name: true, email: true, role: true, preferredLanguage: true, state: true, phone: true, emailVerified: true },
    });

    // Send OTP email (non-blocking — don't fail registration if email fails)
    sendOtpEmail(user.email, user.name, otp).catch(e =>
      console.error('[AUTH] OTP email send failed:', e.message)
    );

    return res.status(201).json({
      user,
      message: 'Registration successful! Please check your email for the OTP to verify your account.',
      requiresVerification: true,
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[AUTH] register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

    if (!user.otp || user.otp !== String(otp)) {
      return res.status(400).json({ error: 'Invalid OTP. Please check your email.' });
    }
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Mark verified, clear OTP, issue tokens
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, otp: null, otpExpiry: null },
    });

    const accessToken  = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(e =>
      console.error('[AUTH] Welcome email failed:', e.message)
    );

    const { passwordHash: _ph, refreshToken: _rt, otp: _o, otpExpiry: _oe, ...safeUser } = user;
    return res.json({
      user: { ...safeUser, emailVerified: true },
      accessToken,
      refreshToken,
      message: 'Email verified! Welcome to GramSaathi AI 🌿',
    });
  } catch (err) {
    console.error('[AUTH] verifyOtp error:', err);
    return res.status(500).json({ error: 'OTP verification failed' });
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ error: 'Email already verified' });

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpiry } });

    await sendOtpEmail(email, user.name, otp);
    return res.json({ message: 'New OTP sent to your email!' });
  } catch (err) {
    console.error('[AUTH] resendOtp error:', err);
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Block login if email not verified
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email,
      });
    }

    const accessToken  = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    const { passwordHash, refreshToken: _rt, otp, otpExpiry, ...safeUser } = user;
    return res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[AUTH] login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken  = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
};

// ─── Me (current user) ───────────────────────────────────────────────────────
const me = async (req, res) => res.json({ user: req.user });

module.exports = { register, login, refresh, logout, me, verifyOtp, resendOtp };
