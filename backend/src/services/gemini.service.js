const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Client Setup ─────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = 'gemini-2.0-flash';

// ─── Groq model config ────────────────────────────────────────────────────────
// llama-3.3-70b-versatile: fast (~350ms), multilingual with language priming
// llama-3.1-8b-instant:    ultra-fast (~200ms), lighter responses
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_TIMEOUT_MS = 15000; // 15 second hard timeout

// ─── Groq API call with timeout ───────────────────────────────────────────────
const callGroq = async (messages, maxTokens = 1024) => {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('GROQ_API_KEY not set');

  // Race the fetch against a timeout so we never hang forever
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq ${res.status}: ${errText.substring(0, 150)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    // Strip any <think>...</think> blocks just in case
    return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } finally {
    clearTimeout(timer);
  }
};

// ─── Language primers — primes Llama to respond in target language ─────────────
const PRIMERS = {
  Hindi:     'समझ गया, मैं हिंदी में जवाब दूंगा।',
  Tamil:     'புரிந்தது, நான் தமிழில் பதிலளிப்பேன்।',
  Telugu:    'అర్థమైంది, నేను తెలుగులో సమాధానం ఇస్తాను.',
  Bengali:   'বুঝেছি, আমি বাংলায় উত্তর দেব।',
  Marathi:   'समजले, मी मराठीत उत्तर देईन.',
  Gujarati:  'સમજ્યો, હું ગુજરાતીમાં જવાબ આપીશ.',
  Kannada:   'ಅರ್ಥವಾಯಿತು, ನಾನು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇನೆ.',
  Malayalam: 'മനസ്സിലായി, ഞാൻ മലയാളത്തിൽ മറുപടി നൽകാം.',
  Punjabi:   'ਸਮਝ ਗਿਆ, ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦੇਵਾਂਗਾ।',
};

// ─── Text Generation ──────────────────────────────────────────────────────────
const generateText = async (prompt) => {
  if (process.env.GROQ_API_KEY) {
    try {
      const start = Date.now();
      const result = await callGroq([{ role: 'user', content: prompt }]);
      console.log(`[GROQ] generateText OK in ${Date.now() - start}ms`);
      return result;
    } catch (groqErr) {
      console.warn('[GROQ] generateText failed:', groqErr.message?.substring(0, 80));
    }
  }
  // Gemini fallback (only if Groq completely unavailable)
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ─── Chat with History ────────────────────────────────────────────────────────
// history items: { role: 'user'|'assistant', parts: [{ text: string }] }
const chat = async (systemPrompt, history, userMessage, detectedLang = 'English') => {
  if (process.env.GROQ_API_KEY) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: Array.isArray(m.parts)
            ? (m.parts[0]?.text || '')
            : (m.content || ''),
        })),
        { role: 'user', content: userMessage },
      ];

      // Inject language primer — most reliable way to get Llama to respond in target language
      if (detectedLang !== 'English' && PRIMERS[detectedLang]) {
        messages.push({ role: 'assistant', content: PRIMERS[detectedLang] });
      }

      const start = Date.now();
      const result = await callGroq(messages);
      console.log(`[GROQ] chat OK in ${Date.now() - start}ms (lang: ${detectedLang})`);
      return result;
    } catch (groqErr) {
      console.warn('[GROQ] chat failed:', groqErr.message?.substring(0, 80));
    }
  }
  // Gemini fallback
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: systemPrompt });
  const chatSession = model.startChat({
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: Array.isArray(m.parts) ? (m.parts[0]?.text || '') : (m.content || '') }],
    })),
    generationConfig: { maxOutputTokens: 1024 },
  });
  const result = await chatSession.sendMessage(userMessage);
  return result.response.text();
};

// ─── Image Analysis (Gemini Vision only) ─────────────────────────────────────
// Groq has no vision — crop controller handles the text fallback separately
const analyzeImage = async (base64Image, mimeType, prompt) => {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64Image } },
  ]);
  return result.response.text();
};

module.exports = { generateText, chat, analyzeImage };
