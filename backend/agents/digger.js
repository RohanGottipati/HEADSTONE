const { searchAndReason, safeParseJSON } = require('../lib/gemini');
const { RESEARCHER_PROMPT } = require('../lib/prompts');
const { buildResearchQuality, needsMoreEvidence, normalizeEvidence } = require('../lib/evidence');

function listTerms(terms = [], fallback = '') {
  const unique = [...new Set([fallback, ...terms].map((term) => String(term || '').trim()).filter(Boolean))];
  return unique.slice(0, 4);
}

function quotedAny(terms) {
  return terms.map((term) => `"${term}"`).join(' OR ');
}

function buildSearchSpecs(idea, expansion = {}) {
  const aliases = listTerms(expansion.aliases, idea);
  const categories = listTerms(expansion.adjacent_categories);
  const competitorTerms = listTerms(expansion.competitor_terms, idea);
  const failurePhrases = listTerms(expansion.failure_phrases, 'postmortem');
  const ideaTerms = quotedAny(aliases);
  const marketTerms = quotedAny([...competitorTerms, ...categories].slice(0, 5));
  const failureTerms = quotedAny(failurePhrases);

  return [
    {
      label: 'hackathon submissions',
      query: `site:devpost.com (${ideaTerms}) hackathon project submission winner finalist`,
    },
    {
      label: 'older hackathon variants',
      query: `site:devpost.com (${ideaTerms} OR ${marketTerms}) "built with" hackathon`,
    },
    {
      label: 'repository evidence',
      query: `site:github.com (${ideaTerms}) hackathon project repo demo abandoned archived`,
    },
    {
      label: 'live launches',
      query: `site:producthunt.com (${marketTerms || ideaTerms}) launch app platform alternative`,
    },
    {
      label: 'hacker news launches',
      query: `site:news.ycombinator.com ("Show HN" OR "Launch HN") (${ideaTerms})`,
    },
    {
      label: 'live competitors',
      query: `(${marketTerms || ideaTerms}) competitor alternative startup product pricing reviews`,
    },
    {
      label: 'failure signals',
      query: `(${ideaTerms}) startup app ${failureTerms} pivot shutdown "lessons learned"`,
    },
    {
      label: 'market pain and reviews',
      query: `(${marketTerms || ideaTerms}) reviews complaints "doesn't work" "not maintained"`,
    },
  ];
}

function buildRetrySpecs(idea, expansion = {}, quality) {
  const aliases = listTerms(expansion.aliases, idea);
  const categories = listTerms(expansion.adjacent_categories);
  const terms = quotedAny([...aliases, ...categories].slice(0, 5));
  const specs = [];

  for (const missing of quality.missing_categories || []) {
    if (missing === 'hackathon') {
      specs.push({
        label: 'retry hackathon evidence',
        query: `site:devpost.com OR site:hackathon.io (${terms}) hackathon demo project`,
      });
    }
    if (missing === 'repository') {
      specs.push({
        label: 'retry repository evidence',
        query: `site:github.com (${terms}) README demo "last commit" archived`,
      });
    }
    if (missing === 'live_product') {
      specs.push({
        label: 'retry live product evidence',
        query: `(${terms}) product app platform competitor alternative "Product Hunt"`,
      });
    }
    if (missing === 'failure_signal') {
      specs.push({
        label: 'retry failure evidence',
        query: `(${terms}) abandoned shutdown pivot failed postmortem "lessons learned" "why we stopped"`,
      });
    }
  }

  if (quality.distinct_domains < 4) {
    specs.push({
      label: 'retry domain diversity',
      query: `(${terms}) site:medium.com OR site:reddit.com OR site:news.ycombinator.com OR site:indiehackers.com`,
    });
  }

  return specs.slice(0, 5);
}

function collectEvidencePayload(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed.evidence)) return parsed.evidence;
  return normalizeEvidence(parsed, { limit: 50 });
}

async function runSearchSpec(idea, expansion, spec) {
  const raw = await searchAndReason(
    `Idea: "${idea}"

Expanded search angles:
${JSON.stringify(expansion, null, 2)}

Search query to investigate:
${spec.query}

Target evidence category: ${spec.label}

Find 4-8 real public sources. Prioritize primary sources and diverse domains. Return only the JSON shape from the system prompt.`,
    RESEARCHER_PROMPT,
    { timeoutMs: 70000 }
  );
  const parsed = safeParseJSON(raw);
  return collectEvidencePayload(parsed);
}

function toLegacyBuckets(sources) {
  return {
    devpost_results: sources
      .filter((source) => source.source_type === 'devpost' || source.evidence_kind === 'hackathon')
      .map((source) => ({ title: source.title, url: source.url, description: source.snippet })),
    github_results: sources
      .filter((source) => source.source_type === 'github' || source.evidence_kind === 'repository')
      .map((source) => ({ title: source.title, url: source.url, description: source.snippet })),
    live_products: sources
      .filter((source) => source.evidence_kind === 'live_product' || source.source_type === 'producthunt')
      .map((source) => ({ title: source.title, name: source.title, url: source.url, description: source.snippet })),
    web_signals: sources
      .filter((source) => !['devpost', 'github', 'producthunt'].includes(source.source_type))
      .map((source) => ({ title: source.title, url: source.url, description: source.snippet })),
  };
}

async function runDigger(idea, expansion = {}) {
  const specs = buildSearchSpecs(idea, expansion);
  const results = await Promise.allSettled(specs.map((spec) => runSearchSpec(idea, expansion, spec)));
  const rawEvidence = results
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value);

  let sources = normalizeEvidence({ evidence: rawEvidence }, { limit: 36 });
  let researchQuality = buildResearchQuality(sources);
  let searchQueries = specs.map((spec) => spec.query);

  if (needsMoreEvidence(sources)) {
    const retrySpecs = buildRetrySpecs(idea, expansion, researchQuality);
    const retryResults = await Promise.allSettled(retrySpecs.map((spec) => runSearchSpec(idea, expansion, spec)));
    rawEvidence.push(
      ...retryResults
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)
    );
    sources = normalizeEvidence({ evidence: rawEvidence }, { limit: 36 });
    researchQuality = buildResearchQuality(sources);
    searchQueries = [...searchQueries, ...retrySpecs.map((spec) => spec.query)];
  }

  return {
    ...toLegacyBuckets(sources),
    sources,
    research_quality: researchQuality,
    search_queries: searchQueries,
  };
}

module.exports = { buildRetrySpecs, buildSearchSpecs, runDigger };
