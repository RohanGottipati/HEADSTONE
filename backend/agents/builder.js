const { reasonOnly, safeParseJSON } = require('../lib/gemini');
const { BUILDER_PROMPT } = require('../lib/prompts');

const EMPTY_PLAN = {
  headline: '',
  positioning: '',
  borrow_from_winners: [],
  avoid_from_losers: [],
  mvp: {
    summary: '',
    must_have_features: [],
    explicitly_not_in_mvp: [],
    first_user_test: '',
  },
  v1_features: [],
  moat: '',
  risks: [],
  next_three_steps: [],
};

function cleanList(value, max = 6) {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).slice(0, max);
}

function cleanText(value, max = 420) {
  if (typeof value !== 'string') return '';
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trimEnd()}...`;
}

function cleanEvolutionTimeline(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const event = cleanText(item.event, 140);
      if (!event) return null;
      return {
        year: Number(item.year) || 0,
        event,
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function cleanBulletObjects(value, schema, max = 6) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const cleaned = {};
      for (const key of schema) cleaned[key] = typeof item[key] === 'string' ? item[key] : '';
      return cleaned;
    })
    .filter((item) => item && Object.values(item).some(Boolean))
    .slice(0, max);
}

function normalizePlan(parsed) {
  if (!parsed || typeof parsed !== 'object') return EMPTY_PLAN;

  const mvp = parsed.mvp && typeof parsed.mvp === 'object' ? parsed.mvp : {};

  return {
    headline: typeof parsed.headline === 'string' ? parsed.headline : '',
    positioning: typeof parsed.positioning === 'string' ? parsed.positioning : '',
    borrow_from_winners: cleanBulletObjects(parsed.borrow_from_winners, ['feature', 'why', 'source'], 6),
    avoid_from_losers: cleanBulletObjects(parsed.avoid_from_losers, ['mistake', 'why', 'source'], 6),
    mvp: {
      summary: typeof mvp.summary === 'string' ? mvp.summary : '',
      must_have_features: cleanList(mvp.must_have_features, 6),
      explicitly_not_in_mvp: cleanList(mvp.explicitly_not_in_mvp, 6),
      first_user_test: typeof mvp.first_user_test === 'string' ? mvp.first_user_test : '',
    },
    v1_features: cleanBulletObjects(parsed.v1_features, ['feature', 'why', 'inspired_by'], 8),
    moat: typeof parsed.moat === 'string' ? parsed.moat : '',
    risks: cleanBulletObjects(parsed.risks, ['risk', 'mitigation'], 6),
    next_three_steps: cleanList(parsed.next_three_steps, 3),
  };
}

async function runBuilder(idea, context = {}) {
  const {
    timeline = [],
    competitors = [],
    gap = '',
    clock = '',
    turn_sentence = '',
    research_quality = {},
  } = context;

  const trimmedTimeline = (timeline || []).map((entry) => ({
    year: entry.year,
    title: entry.title,
    what_was_built: entry.what_was_built,
    what_made_it_different: entry.what_made_it_different,
    did_right: entry.did_right,
    did_wrong: entry.did_wrong,
    lesson: entry.lesson,
    evolution_timeline: cleanEvolutionTimeline(entry.evolution_timeline),
    did_well: cleanText(entry.did_well),
    did_poorly: cleanText(entry.did_poorly),
    project_lacks: cleanText(entry.project_lacks),
    avoid_mistakes: cleanText(entry.avoid_mistakes),
    improvement_suggestions: cleanText(entry.improvement_suggestions),
    cause_of_death: entry.cause_of_death,
    is_alive: entry.is_alive,
  }));

  const trimmedCompetitors = (competitors || []).map((competitor) => ({
    name: competitor.name,
    weakness: competitor.weakness,
  }));

  const prompt = `The idea is: "${idea}"

Recurring failure pattern: ${turn_sentence || 'unknown'}

Open gap: ${gap || 'unknown'}

Timing: ${clock || 'unknown'}

Research quality:
${JSON.stringify(research_quality || {}, null, 2)}

Timeline of past attempts (with what each did right, wrong, lacked, and left for the next builder):
${JSON.stringify(trimmedTimeline, null, 2)}

Live competitors:
${JSON.stringify(trimmedCompetitors, null, 2)}

Now produce the build plan. Cherry-pick the strongest features from past attempts and competitors. Explicitly avoid the mistakes that killed prior attempts. Be specific.`;

  try {
    const raw = await reasonOnly(prompt, BUILDER_PROMPT);
    const parsed = safeParseJSON(raw);
    return normalizePlan(parsed);
  } catch {
    return EMPTY_PLAN;
  }
}

module.exports = { runBuilder, EMPTY_PLAN };
