const { searchAndReason, safeParseJSON } = require('../lib/gemini');
const { HISTORIAN_PROMPT } = require('../lib/prompts');

async function runHistorian(idea, diggerResult) {
  const context = JSON.stringify(diggerResult, null, 2);

  const prompt = `The idea is: "${idea}"

Here is the raw research data collected about this idea:
${context}

Build a chronological timeline of every attempt at this idea. For each entry, determine what was built, how far it got, and specifically why it died. Be as specific as possible about causes of death.`;

  try {
    const raw = await searchAndReason(prompt, HISTORIAN_PROMPT);
    const parsed = safeParseJSON(raw);

    if (!parsed || !Array.isArray(parsed.timeline)) {
      return { timeline: [], data_quality_note: 'parse error' };
    }

    return {
      timeline: parsed.timeline,
      data_quality_note: parsed.data_quality_note || 'ok',
    };
  } catch {
    return { timeline: [], data_quality_note: 'agent error' };
  }
}

module.exports = { runHistorian };
