const { searchAndReason, safeParseJSON } = require('../lib/gemini');
const { LANDSCAPE_PROMPT } = require('../lib/prompts');
const { resolveSources, sourceIdsFromIndexes } = require('../lib/evidence');

function formatEvidenceList(sources = []) {
  if (!sources.length) return 'No normalized evidence was collected.';
  return sources
    .map((source, index) => {
      const snippet = source.snippet ? ` - ${source.snippet}` : '';
      return `${index + 1}. ${source.id} [${source.source_type}/${source.evidence_kind}] ${source.title} ${source.url}${snippet}`;
    })
    .join('\n');
}

function getSources(input) {
  if (Array.isArray(input)) {
    return input.map((item, index) => ({
      id: item.id || `src_${index + 1}`,
      title: item.title || item.name || 'Unknown product',
      url: item.url || '',
      domain: item.domain || '',
      source_type: item.source_type || 'web',
      evidence_kind: item.evidence_kind || 'live_product',
      snippet: item.snippet || item.description || '',
    }));
  }
  return Array.isArray(input?.sources) ? input.sources : [];
}

function enrichCompetitor(competitor, sources) {
  const ids = sourceIdsFromIndexes(competitor.source_ids || [], sources);
  const resolved = resolveSources(ids, sources);
  return {
    name: competitor.name || 'Unknown competitor',
    url: competitor.url || resolved[0]?.url || '',
    weakness: competitor.weakness || '',
    signal: competitor.signal || '',
    source_ids: ids,
    sources: resolved,
  };
}

async function runLandscape(idea, diggerResult) {
  const sources = getSources(diggerResult);
  const likelyLiveSources = sources.filter((source) =>
    ['live_product', 'launch', 'review', 'general'].includes(source.evidence_kind)
  );

  const prompt = `The idea is: "${idea}"

Here is the normalized evidence that may contain live competitors, launches, reviews, or market signals:
${formatEvidenceList(likelyLiveSources.length ? likelyLiveSources : sources)}

Identify the top competitors that are currently alive and active. For each, find their biggest weakness. Cite source_ids for every competitor. Return at most 4.`;

  try {
    const raw = await searchAndReason(prompt, LANDSCAPE_PROMPT);
    const parsed = safeParseJSON(raw);

    if (!parsed || !Array.isArray(parsed.competitors)) {
      return { competitors: [] };
    }

    return { competitors: parsed.competitors.slice(0, 4).map((competitor) => enrichCompetitor(competitor, sources)) };
  } catch {
    return { competitors: [] };
  }
}

module.exports = { runLandscape };
