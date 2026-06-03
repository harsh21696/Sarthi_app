const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Verify connection on startup ─────────────────────────────────────────────
transporter.verify((err) => {
  if (err) console.error('[EMAIL] Transporter error:', err.message);
  else console.log('[EMAIL] ✅ Gmail transporter ready');
});

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ─── Send OTP Verification Email ──────────────────────────────────────────────
const sendOtpEmail = async (toEmail, name, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: '🌿 GramSaathi AI — Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">🌿 GramSaathi AI</h1>
            <p style="color:#bbf7d0;margin:8px 0 0;">Your Agricultural Intelligence Partner</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#f1f5f9;margin:0 0 8px;">Namaste, ${name}! 🙏</h2>
            <p style="color:#94a3b8;margin:0 0 24px;">Please verify your email address to start using GramSaathi AI.</p>
            <div style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
              <p style="color:#64748b;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
              <p style="color:#4ade80;font-size:42px;font-weight:700;margin:0;letter-spacing:12px;">${otp}</p>
              <p style="color:#64748b;margin:8px 0 0;font-size:12px;">⏰ Expires in 15 minutes</p>
            </div>
            <p style="color:#64748b;font-size:13px;margin:0;">If you did not create a GramSaathi account, you can safely ignore this email.</p>
          </div>
          <div style="padding:16px 32px;border-top:1px solid #334155;text-align:center;">
            <p style="color:#475569;font-size:12px;margin:0;">© 2024 GramSaathi AI — Empowering Rural India</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

// ─── Send Crop Disaster Alert Email ───────────────────────────────────────────
const sendDisasterAlertEmail = async (toEmail, name, alerts, city) => {
  const alertRows = alerts.map(a => `
    <div style="background:#0f172a;border-left:4px solid ${a.color};border-radius:8px;padding:16px;margin:0 0 12px;">
      <p style="color:${a.color};font-weight:700;margin:0 0 4px;">${a.icon} ${a.title}</p>
      <p style="color:#94a3b8;margin:0 0 8px;font-size:14px;">${a.description}</p>
      <p style="color:#4ade80;font-size:13px;margin:0;"><strong>Action:</strong> ${a.action}</p>
    </div>
  `).join('');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `🚨 GramSaathi Alert — Crop Risk Warning for ${city}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:22px;">🚨 Crop Risk Alert</h1>
            <p style="color:#fecaca;margin:8px 0 0;">GramSaathi AI Weather Warning — ${city}</p>
          </div>
          <div style="padding:32px;">
            <p style="color:#f1f5f9;margin:0 0 20px;">Namaste <strong>${name}</strong>, our AI has detected weather conditions that may harm your crops:</p>
            ${alertRows}
            <div style="background:#052e16;border:1px solid #166534;border-radius:8px;padding:16px;margin-top:20px;">
              <p style="color:#4ade80;margin:0;font-size:13px;">🌿 Visit <strong>GramSaathi AI</strong> for personalized crop protection advice from our AI assistant.</p>
            </div>
          </div>
          <div style="padding:16px 32px;border-top:1px solid #334155;text-align:center;">
            <p style="color:#475569;font-size:12px;margin:0;">© 2024 GramSaathi AI — Stay Safe, Grow Strong</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

// ─── Send Welcome Email ────────────────────────────────────────────────────────
const sendWelcomeEmail = async (toEmail, name) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: '🌿 Welcome to GramSaathi AI!',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">🌿 GramSaathi AI</h1>
            <p style="color:#bbf7d0;margin:8px 0 0;">Your Agricultural Intelligence Partner</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#f1f5f9;margin:0 0 12px;">Welcome, ${name}! 🎉</h2>
            <p style="color:#94a3b8;margin:0 0 20px;">Your email is verified. You now have access to:</p>
            <ul style="color:#94a3b8;padding-left:20px;">
              <li style="margin-bottom:8px;">🤖 <strong style="color:#4ade80;">AI Chat</strong> — Ask anything about farming</li>
              <li style="margin-bottom:8px;">🌿 <strong style="color:#4ade80;">Crop Doctor</strong> — Diagnose plant diseases</li>
              <li style="margin-bottom:8px;">🌦️ <strong style="color:#4ade80;">Weather Alerts</strong> — Protect your crops</li>
              <li style="margin-bottom:8px;">🏛️ <strong style="color:#4ade80;">Gov Schemes</strong> — Find benefits you qualify for</li>
            </ul>
          </div>
          <div style="padding:16px 32px;border-top:1px solid #334155;text-align:center;">
            <p style="color:#475569;font-size:12px;margin:0;">© 2024 GramSaathi AI — Empowering Rural India</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

module.exports = { generateOtp, sendOtpEmail, sendWelcomeEmail, sendDisasterAlertEmail };
