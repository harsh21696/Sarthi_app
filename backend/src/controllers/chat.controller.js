const prisma = require('../config/prisma');
const geminiService = require('../services/gemini.service');
const { z } = require('zod');

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().uuid().optional().nullable().or(z.literal('')).transform(v => v || undefined),
  language: z.string().default('en'),
});

// ─── Send Message ─────────────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const data = sendMessageSchema.parse(req.body);
    let sessionId = data.sessionId;

    // Create a new session if not provided
    if (!sessionId) {
      const session = await prisma.chatSession.create({
        data: {
          userId: req.user.id,
          title: data.message.slice(0, 60),
        },
      });
      sessionId = session.id;
    }

    // Fetch existing messages for context
    const history = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Build Gemini conversation history
    const conversationHistory = history.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    // ── Server-side language detection from message content ──────────────────
    const detectLanguage = (text) => {
      if (/[\u0900-\u097F]/.test(text)) return 'Hindi';        // Devanagari
      if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';        // Tamil script
      if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';       // Telugu script
      if (/[\u0980-\u09FF]/.test(text)) return 'Bengali';      // Bengali script
      if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';     // Gujarati script
      if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada';      // Kannada script
      if (/[\u0D00-\u0D7F]/.test(text)) return 'Malayalam';    // Malayalam script
      if (/[\u0A00-\u0A7F]/.test(text)) return 'Punjabi';      // Gurmukhi script
      return 'English';                                          // Default
    };

    const detectedLang = detectLanguage(data.message);

    const systemPrompt = `You are GramSaathi AI, a helpful assistant for rural citizens of India.
You assist farmers, students, and villagers with agriculture, government schemes, education, and daily life.

IMPORTANT: The user's message is in ${detectedLang}. Always respond in ${detectedLang}.

User profile: Role = ${req.user.role}, State = ${req.user.state || 'India'}.
Be concise, friendly, and practical. Use simple language suitable for rural citizens.`;

    // Use plain message — language is enforced via system prompt + Groq primer
    const aiResponse = await geminiService.chat(systemPrompt, conversationHistory, data.message, detectedLang);

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: data.message, language: data.language },
    });

    // Save assistant message
    const assistantMsg = await prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiResponse, language: data.language },
    });

    // Update session timestamp
    await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

    return res.json({ sessionId, message: assistantMsg });
  } catch (err) {
    if (err.name === 'ZodError') {
      console.error('[CHAT] Validation error:', JSON.stringify(err.errors));
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[CHAT] sendMessage error:', err.message || err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

// ─── Get All Sessions ─────────────────────────────────────────────────────────
const getSessions = async (req, res) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, createdAt: true, updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    return res.json({ sessions });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// ─── Get Session Messages ─────────────────────────────────────────────────────
const getSessionMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.chatSession.findFirst({
      where: { id, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json({ session });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// ─── Delete Session ───────────────────────────────────────────────────────────
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.chatSession.findFirst({ where: { id, userId: req.user.id } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await prisma.chatSession.delete({ where: { id } });
    return res.json({ message: 'Session deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete session' });
  }
};

module.exports = { sendMessage, getSessions, getSessionMessages, deleteSession };
