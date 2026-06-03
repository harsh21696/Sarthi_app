const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
  preferredLanguage: z.string().optional(),
  role: z.enum(['farmer', 'student', 'villager']).optional(),
  password: z.string().min(6).optional(),
});

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updateData = { ...data };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, preferredLanguage: true, state: true, phone: true },
    });

    return res.json({ user });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [chatSessions, cropAnalyses, schemeQueries, recentChats, recentCrops, recentSchemes] = await Promise.all([
      prisma.chatSession.count({ where: { userId } }),
      prisma.cropAnalysis.count({ where: { userId } }),
      prisma.schemeQuery.count({ where: { userId } }),
      prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, updatedAt: true, _count: { select: { messages: true } } },
      }),
      prisma.cropAnalysis.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, cropName: true, confidence: true, createdAt: true, imageUrl: true },
      }),
      prisma.schemeQuery.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, query: true, schemesFound: true, createdAt: true },
      }),
    ]);

    return res.json({
      stats: { chatSessions, cropAnalyses, schemeQueries },
      recentActivity: { recentChats, recentCrops, recentSchemes },
      user: req.user,
    });
  } catch (err) {
    console.error('[USER] dashboard error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

module.exports = { updateProfile, getDashboard };
