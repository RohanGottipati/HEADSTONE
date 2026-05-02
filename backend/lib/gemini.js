const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function safeParseJSON(text) {
  if (!text) return null;
  try {
    let cleaned = text.trim();
    // Strip markdown code fences
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function callWithRetry(fn, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.toLowerCase()?.includes('rate limit') ||
        err?.message?.toLowerCase()?.includes('resource exhausted');
      if (isRateLimit && attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

async function searchAndReason(prompt, systemPrompt) {
  return callWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    });

    const response = result.response;
    return response.text();
  });
}

async function reasonOnly(prompt, systemPrompt) {
  return callWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    });

    const response = result.response;
    return response.text();
  });
}

module.exports = { searchAndReason, reasonOnly, safeParseJSON };
