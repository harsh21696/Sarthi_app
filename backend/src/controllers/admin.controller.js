const prisma = require('../config/prisma');

// ─── GET /api/admin/stats — system-wide stats ─────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [
      totalUsers, totalChats, totalMessages,
      totalCrops, totalSchemes,
      todayUsers, todayChats, todayCrops,
      roleDistribution, langDistribution,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.cropAnalysis.count(),
      prisma.schemeQuery.count(),
      // Today's activity
      prisma.user.count({ where: { createdAt: { gte: startOfDay() } } }),
      prisma.chatSession.count({ where: { createdAt: { gte: startOfDay() } } }),
      prisma.cropAnalysis.count({ where: { createdAt: { gte: startOfDay() } } }),
      // Distributions
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
      prisma.user.groupBy({ by: ['preferredLanguage'], _count: { id: true } }),
    ]);

    // Last 7 days chat activity
    const last7Days = await getLast7DaysActivity();

    return res.json({
      overview: { totalUsers, totalChats, totalMessages, totalCrops, totalSchemes },
      today:    { users: todayUsers, chats: todayChats, crops: todayCrops },
      charts: {
        roleDistribution: roleDistribution.map(r => ({ name: r.role, value: r._count.id })),
        langDistribution: langDistribution.map(l => ({ name: l.preferredLanguage, value: l._count.id })),
        last7DaysChats: last7Days,
      },
    });
  } catch (err) {
    console.error('[ADMIN] getStats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ─── GET /api/admin/users — paginated user list ───────────────────────────────
const getUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip  = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true,
          state: true, preferredLanguage: true, isAdmin: true,
          emailVerified: true, city: true, primaryCrop: true,
          createdAt: true,
          _count: { select: { chatSessions: true, cropAnalyses: true, schemeQueries: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[ADMIN] getUsers error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ─── DELETE /api/admin/users/:id — delete user ────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('[ADMIN] deleteUser error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ─── PATCH /api/admin/users/:id — toggle admin / update ──────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin, emailVerified } = req.body;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(isAdmin !== undefined && { isAdmin }),
        ...(emailVerified !== undefined && { emailVerified }),
      },
      select: { id: true, name: true, email: true, isAdmin: true, emailVerified: true },
    });
    return res.json({ user: updated });
  } catch (err) {
    console.error('[ADMIN] updateUser error:', err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

// ─── GET /api/admin/activity — recent activity feed ──────────────────────────
const getActivity = async (req, res) => {
  try {
    const [chats, crops, schemes, newUsers] = await Promise.all([
      prisma.chatSession.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.cropAnalysis.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.schemeQuery.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    // Merge + sort by date
    const activity = [
      ...chats.map(c => ({ type: 'chat', icon: '💬', text: `${c.user.name} started a chat`, time: c.createdAt, user: c.user })),
      ...crops.map(c => ({ type: 'crop', icon: '🌿', text: `${c.user.name} analyzed ${c.cropName || 'a crop'}`, time: c.createdAt, user: c.user })),
      ...schemes.map(s => ({ type: 'scheme', icon: '🏛️', text: `${s.user.name} searched government schemes`, time: s.createdAt, user: s.user })),
      ...newUsers.map(u => ({ type: 'user', icon: '👤', text: `${u.name} joined as ${u.role}`, time: u.createdAt, user: { name: u.name, email: u.email } })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);

    return res.json({ activity });
  } catch (err) {
    console.error('[ADMIN] getActivity error:', err);
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

// ─── GET /api/admin/health — system health check ─────────────────────────────
const getHealth = async (req, res) => {
  const checks = {};

  // DB check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: null };
  } catch { checks.database = { status: 'error' }; }

  // Groq check
  try {
    const start = Date.now();
    const r = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
    checks.groq = { status: r.ok ? 'ok' : 'error', latency: Date.now() - start };
  } catch { checks.groq = { status: 'error' }; }

  // Email check
  checks.email = { status: process.env.GMAIL_USER ? 'configured' : 'not configured' };

  return res.json({ status: 'running', timestamp: new Date().toISOString(), checks });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getLast7DaysActivity = async () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const [chats, crops] = await Promise.all([
      prisma.chatSession.count({ where: { createdAt: { gte: date, lt: next } } }),
      prisma.cropAnalysis.count({ where: { createdAt: { gte: date, lt: next } } }),
    ]);

    days.push({
      date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      chats,
      crops,
    });
  }
  return days;
};

module.exports = { getStats, getUsers, deleteUser, updateUser, getActivity, getHealth };
