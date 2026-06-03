const prisma = require('../config/prisma');
const geminiService = require('../services/gemini.service');
const { z } = require('zod');

const recommendSchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters'),
  language: z.string().default('en'),
});

// ─── Recommend Schemes ────────────────────────────────────────────────────────
const recommendSchemes = async (req, res) => {
  try {
    const data = recommendSchema.parse(req.body);
    const { role, state, name } = req.user;

    const prompt = `You are a government scheme expert for India. The user is a ${role} from ${state || 'India'}.
Based on their query: "${data.query}"

List relevant Indian government schemes (Central + State if applicable) including:
1. **Scheme Name** (Official name)
2. **Ministry/Department**
3. **Eligibility**: Who can apply
4. **Benefits**: What they get (amount, services, etc.)
5. **How to Apply**: Steps, portal link (e.g., pmkisan.gov.in)
6. **Documents Required**
7. **Deadline** (if any)

Focus on schemes relevant to ${role}s. If query is in a regional language, respond in that language.
List at least 3-5 schemes. Be specific and accurate.`;

    const response = await geminiService.generateText(prompt);

    // Count approximate number of schemes mentioned
    const schemesFound = (response.match(/\*\*Scheme Name\*\*/gi) || []).length || 3;

    const record = await prisma.schemeQuery.create({
      data: {
        userId: req.user.id,
        query: data.query,
        response,
        schemesFound,
      },
    });

    return res.status(201).json({ record });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: err.errors });
    console.error('[SCHEMES] recommend error:', err);
    return res.status(500).json({ error: 'Scheme recommendation failed' });
  }
};

// ─── Get History ──────────────────────────────────────────────────────────────
const getSchemeHistory = async (req, res) => {
  try {
    const queries = await prisma.schemeQuery.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ queries });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = { recommendSchemes, getSchemeHistory };
