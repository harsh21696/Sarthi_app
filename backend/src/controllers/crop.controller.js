const prisma = require('../config/prisma');
const geminiService = require('../services/gemini.service');
const fs = require('fs');

// ─── Groq text-based fallback for crop analysis ───────────────────────────────
const cropAnalysisViaGroq = async (cropName) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('No fallback AI available');

  const prompt = `You are an expert agricultural scientist in India. A farmer uploaded a photo of their ${cropName || 'crop'} plant but image analysis is temporarily unavailable.

Based on common diseases affecting ${cropName || 'crops'} in India, provide a general diagnostic guide:

1. **Common Diseases**: List the top 3 most common diseases for this crop in India
2. **Visual Symptoms**: What to look for on leaves, stems, and fruits
3. **Severity Assessment**: How to assess if it's Low / Medium / High severity
4. **Treatment**: Step-by-step treatment plan using available inputs
5. **Prevention**: How to prevent diseases in the future
6. **Organic Remedies**: Natural solutions available in rural India (neem, turmeric, etc.)

Note: For accurate diagnosis, please try again when image analysis is available, or consult your local Krishi Vigyan Kendra (KVK).

Respond in clear, simple language suitable for a rural Indian farmer.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.6,
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
};

// ─── Analyze Crop Image ───────────────────────────────────────────────────────
const analyzeCrop = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required. Please upload a JPEG, PNG, or WebP image.' });
    }

    const cropName = req.body.cropName || 'Unknown crop';
    const imagePath = req.file.path;
    const mimeType  = req.file.mimetype;
    const imageUrl  = `/uploads/${req.file.filename}`;

    let result;
    let analysisSource = 'gemini-vision';

    // ── Try Gemini Vision first ───────────────────────────────────────────────
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const prompt = `You are an expert agricultural scientist. Analyze this crop image and provide:
1. **Disease/Condition Detected**: Name the disease or condition (if any)
2. **Severity**: Low / Medium / High / Healthy
3. **Confidence**: Estimated confidence percentage
4. **Symptoms**: Visual symptoms observed
5. **Cause**: What causes this disease
6. **Treatment**: Step-by-step treatment plan
7. **Prevention**: How to prevent it in the future
8. **Organic Remedies**: Natural/organic solutions available in rural India

Crop name provided: ${cropName}
Respond in a structured, easy-to-understand format for a rural farmer.`;

      result = await geminiService.analyzeImage(base64Image, mimeType, prompt);
    } catch (visionErr) {
      // ── Gemini Vision failed → Groq text fallback ────────────────────────
      console.warn('[CROP] Gemini vision failed, using Groq text fallback:', visionErr.message?.substring(0, 80));
      analysisSource = 'groq-text-fallback';
      result = await cropAnalysisViaGroq(cropName);
    }

    // Parse confidence from response
    const confidenceMatch = result.match(/(\d+)%/);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : null;

    // Extract treatment section
    const treatmentMatch = result.match(/\*\*Treatment\*\*:?([\s\S]*?)(?:\*\*|$)/i);
    const treatment = treatmentMatch ? treatmentMatch[1].trim() : null;

    const analysis = await prisma.cropAnalysis.create({
      data: {
        userId: req.user.id,
        imageUrl,
        cropName,
        diagnosis: result,
        treatment,
        confidence,
      },
    });

    return res.status(201).json({
      analysis,
      source: analysisSource,
      note: analysisSource === 'groq-text-fallback'
        ? 'Image analysis unavailable — showing general disease guide for this crop.'
        : null,
    });

  } catch (err) {
    console.error('[CROP] analyzeCrop error:', err.message);
    return res.status(500).json({ error: 'Crop analysis failed. Please try again.' });
  }
};

// ─── Get History ──────────────────────────────────────────────────────────────
const getCropHistory = async (req, res) => {
  try {
    const analyses = await prisma.cropAnalysis.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ analyses });
  } catch (err) {
    console.error('[CROP] getCropHistory error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};

module.exports = { analyzeCrop, getCropHistory };
