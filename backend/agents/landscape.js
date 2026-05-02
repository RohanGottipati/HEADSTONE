const { searchAndReason, safeParseJSON } = require('../lib/gemini');
const { LANDSCAPE_PROMPT } = require('../lib/prompts');

async function runLandscape(idea, liveProducts) {
  const context = JSON.stringify(liveProducts || [], null, 2);

  const prompt = `The idea is: "${idea}"

Here are known live products in this space:
${context}

Identify the top competitors that are currently alive and active. For each, find their biggest weakness. Return at most 4.`;

  try {
    const raw = await searchAndReason(prompt, LANDSCAPE_PROMPT);
    const parsed = safeParseJSON(raw);

    if (!parsed || !Array.isArray(parsed.competitors)) {
      return { competitors: [] };
    }

    return { competitors: parsed.competitors.slice(0, 4) };
  } catch {
    return { competitors: [] };
  }
}

module.exports = { runLandscape };
