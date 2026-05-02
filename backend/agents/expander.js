const { reasonOnly, safeParseJSON } = require('../lib/gemini');
const { EXPANDER_PROMPT } = require('../lib/prompts');

function fallbackExpansion(idea) {
  const cleanIdea = String(idea || '').trim();
  return {
    aliases: [cleanIdea].filter(Boolean),
    adjacent_categories: [],
    competitor_terms: [cleanIdea, `${cleanIdea} app`, `${cleanIdea} platform`].filter(Boolean),
    failure_phrases: ['shutdown', 'postmortem', 'pivot', 'abandoned', 'lessons learned'],
    excluded_meanings: [],
  };
}

function normalizeExpansion(parsed, idea) {
  const fallback = fallbackExpansion(idea);
  if (!parsed || typeof parsed !== 'object') return fallback;

  return {
    aliases: Array.isArray(parsed.aliases) ? parsed.aliases.filter(Boolean).slice(0, 6) : fallback.aliases,
    adjacent_categories: Array.isArray(parsed.adjacent_categories)
      ? parsed.adjacent_categories.filter(Boolean).slice(0, 6)
      : [],
    competitor_terms: Array.isArray(parsed.competitor_terms)
      ? parsed.competitor_terms.filter(Boolean).slice(0, 6)
      : fallback.competitor_terms,
    failure_phrases: Array.isArray(parsed.failure_phrases)
      ? parsed.failure_phrases.filter(Boolean).slice(0, 6)
      : fallback.failure_phrases,
    excluded_meanings: Array.isArray(parsed.excluded_meanings)
      ? parsed.excluded_meanings.filter(Boolean).slice(0, 6)
      : [],
  };
}

async function runExpander(idea) {
  const prompt = `Idea: "${idea}"

Generate search angles that will uncover previous attempts, live competitors, repository evidence, and failure signals.`;

  try {
    const raw = await reasonOnly(prompt, EXPANDER_PROMPT, { timeoutMs: 30000 });
    return normalizeExpansion(safeParseJSON(raw), idea);
  } catch {
    return fallbackExpansion(idea);
  }
}

module.exports = { fallbackExpansion, runExpander };
