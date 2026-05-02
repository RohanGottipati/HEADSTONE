const { reasonOnly, safeParseJSON } = require('../lib/gemini');
const { SYNTHESIS_PROMPT } = require('../lib/prompts');

async function runSynthesis(idea, historianResult, landscapeResult, patternResult, diggerResult = {}) {
  const prompt = `The idea is: "${idea}"

Research quality:
${JSON.stringify(diggerResult?.research_quality || {}, null, 2)}

Top supporting sources:
${JSON.stringify((diggerResult?.sources || []).slice(0, 12), null, 2)}

Timeline of attempts:
${JSON.stringify(historianResult?.timeline || [], null, 2)}

Current competitors:
${JSON.stringify(landscapeResult?.competitors || [], null, 2)}

Failure pattern: ${patternResult?.turn_sentence || 'unknown'}
Recurring failure: ${patternResult?.recurring_failure || 'none identified'}
Cross-idea insight: ${patternResult?.cross_idea_insight || 'none'}

Based on all of this, write:
1. A "gap" paragraph — what opportunity still exists, written for someone about to spend their weekend on this
2. A "clock" sentence — why now is or isn't the right moment`;

  try {
    const raw = await reasonOnly(prompt, SYNTHESIS_PROMPT);
    const parsed = safeParseJSON(raw);

    if (!parsed) {
      return {
        gap: 'Unable to synthesize a gap analysis from the available data.',
        clock: 'Timing analysis unavailable.',
      };
    }

    return {
      gap: parsed.gap || 'Unable to synthesize a gap analysis from the available data.',
      clock: parsed.clock || 'Timing analysis unavailable.',
    };
  } catch {
    return {
      gap: 'Unable to synthesize a gap analysis from the available data.',
      clock: 'Timing analysis unavailable.',
    };
  }
}

module.exports = { runSynthesis };
