const { searchAndReason, safeParseJSON } = require('../lib/gemini');
const { HISTORIAN_PROMPT } = require('../lib/prompts');
const { resolveSources, sourceIdsFromIndexes } = require('../lib/evidence');

function formatEvidenceList(sources = []) {
  if (!sources.length) return 'No normalized evidence was collected.';
  return sources
    .map((source, index) => {
      const year = source.year ? ` (${source.year})` : '';
      const snippet = source.snippet ? ` - ${source.snippet}` : '';
      return `${index + 1}. ${source.id} [${source.source_type}/${source.evidence_kind}] ${source.title}${year} ${source.url}${snippet}`;
    })
    .join('\n');
}

function enrichTimelineEntry(entry, sources) {
  const explicitIds = Array.isArray(entry.source_ids) ? entry.source_ids : [];
  const ids = sourceIdsFromIndexes(explicitIds, sources);
  const resolved = resolveSources(ids, sources);
  const sourceUrl = entry.source_url || resolved[0]?.url || '';

  return {
    year: Number(entry.year) || 0,
    title: entry.title || 'Unknown attempt',
    what_was_built: entry.what_was_built || '',
    how_far: entry.how_far || 'unknown',
    cause_of_death: entry.cause_of_death || 'no public record of continuation',
    source_url: sourceUrl,
    source_ids: ids,
    sources: resolved,
    is_alive: Boolean(entry.is_alive),
    confidence: ['high', 'medium', 'low'].includes(entry.confidence) ? entry.confidence : 'low',
  };
}

async function runHistorian(idea, diggerResult) {
  const sources = Array.isArray(diggerResult?.sources) ? diggerResult.sources : [];
  const evidenceList = formatEvidenceList(sources);
  const quality = JSON.stringify(diggerResult?.research_quality || {}, null, 2);

  const prompt = `The idea is: "${idea}"

Research quality:
${quality}

Here is the normalized evidence collected about this idea:
${evidenceList}

Build a chronological timeline of every real attempt at this idea. For each entry, determine what was built, how far it got, and specifically why it died. Prefer directly supported facts over guesses. Cite source_ids for every entry.`;

  try {
    const raw = await searchAndReason(prompt, HISTORIAN_PROMPT);
    const parsed = safeParseJSON(raw);

    if (!parsed || !Array.isArray(parsed.timeline)) {
      return { timeline: [], data_quality_note: 'parse error' };
    }

    return {
      timeline: parsed.timeline.map((entry) => enrichTimelineEntry(entry, sources)),
      data_quality_note: parsed.data_quality_note || 'ok',
    };
  } catch {
    return { timeline: [], data_quality_note: 'agent error' };
  }
}

module.exports = { runHistorian };
