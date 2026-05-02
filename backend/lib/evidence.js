const REQUIRED_EVIDENCE_KINDS = ['hackathon', 'repository', 'live_product', 'failure_signal'];

function compactText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeUrl(rawUrl) {
  const url = compactText(rawUrl);
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    parsed.hostname = parsed.hostname.replace(/^www\./i, '');
    parsed.hash = '';
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function getDomain(rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function toSnake(value) {
  return compactText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function inferSourceType(item = {}, category = '') {
  const explicit = toSnake(item.source_type || item.type);
  if (explicit) return explicit;

  const domain = getDomain(item.url || item.source_url || item.website);
  if (domain.includes('devpost.com')) return 'devpost';
  if (domain.includes('github.com')) return 'github';
  if (domain.includes('producthunt.com')) return 'producthunt';
  if (domain.includes('news.ycombinator.com')) return 'hacker_news';
  if (domain.includes('linkedin.com')) return 'linkedin';
  if (domain.includes('crunchbase.com')) return 'company_database';

  const cat = toSnake(category);
  if (cat.includes('devpost')) return 'devpost';
  if (cat.includes('github')) return 'github';
  if (cat.includes('product')) return 'product';
  if (cat.includes('web')) return 'web';

  return 'web';
}

function inferEvidenceKind(item = {}, sourceType = '', category = '') {
  const explicit = toSnake(item.evidence_kind || item.signal_type || item.kind);
  if (explicit) {
    if (['shutdown', 'postmortem', 'pivot', 'lessons_learned', 'abandoned'].includes(explicit)) {
      return 'failure_signal';
    }
    if (['launch', 'review', 'competitor'].includes(explicit)) return 'live_product';
    return explicit;
  }

  const cat = toSnake(category);
  if (sourceType === 'devpost' || cat.includes('devpost')) return 'hackathon';
  if (sourceType === 'github' || cat.includes('github')) return 'repository';
  if (sourceType === 'producthunt' || cat.includes('live_product')) return 'live_product';
  if (cat.includes('web_signal')) return 'failure_signal';
  return 'general';
}

function parseYear(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const text = compactText(value);
  if (!text) return null;
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function clampRelevance(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  if (number > 1) return Math.max(0, Math.min(1, number / 100));
  return Math.max(0, Math.min(1, number));
}

function collectRawItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((item) => ({ item, category: '' }));

  const entries = [];
  for (const [category, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      entries.push(...value.map((item) => ({ item, category })));
    }
  }
  return entries;
}

function normalizeEvidenceItem(item = {}, category = '') {
  const url = normalizeUrl(item.url || item.source_url || item.website || item.link);
  const title = compactText(item.title || item.name || item.repo_name || item.product_name);
  const snippet = compactText(
    item.snippet ||
      item.description ||
      item.summary ||
      item.signal ||
      item.what_was_built ||
      item.weakness
  );

  if (!title && !url && !snippet) return null;

  const sourceType = inferSourceType(item, category);
  const evidenceKind = inferEvidenceKind(item, sourceType, category);

  return {
    id: '',
    title: title || url || 'Untitled source',
    url,
    domain: getDomain(url),
    source_type: sourceType,
    evidence_kind: evidenceKind,
    year: parseYear(item.year || item.launch_date || item.date || item.last_commit_signal || snippet),
    snippet,
    relevance: clampRelevance(item.relevance),
  };
}

function sourceQualityScore(item) {
  if (!item.url) return 0;
  if (['devpost', 'github', 'producthunt', 'hacker_news'].includes(item.source_type)) return 3;
  if (item.domain) return 2;
  return 1;
}

function chooseBetterEvidence(a, b) {
  const aScore = a.relevance + sourceQualityScore(a) + (a.snippet ? 0.2 : 0) + (a.year ? 0.1 : 0);
  const bScore = b.relevance + sourceQualityScore(b) + (b.snippet ? 0.2 : 0) + (b.year ? 0.1 : 0);
  const winner = bScore > aScore ? b : a;
  const other = winner === a ? b : a;

  return {
    ...winner,
    snippet: winner.snippet || other.snippet,
    year: winner.year || other.year,
    domain: winner.domain || other.domain,
    source_type: winner.source_type || other.source_type,
    evidence_kind: winner.evidence_kind === 'general' ? other.evidence_kind : winner.evidence_kind,
    relevance: Math.max(winner.relevance, other.relevance),
  };
}

function evidenceKey(item) {
  if (item.url) return `url:${item.url.toLowerCase()}`;
  return `title:${toSnake(item.title)}:${item.domain || item.source_type}`;
}

function rankEvidence(items) {
  return [...items].sort((a, b) => {
    const bScore = b.relevance * 10 + sourceQualityScore(b) + (b.snippet ? 0.5 : 0);
    const aScore = a.relevance * 10 + sourceQualityScore(a) + (a.snippet ? 0.5 : 0);
    return bScore - aScore || a.title.localeCompare(b.title);
  });
}

function normalizeEvidence(raw, options = {}) {
  const seen = new Map();

  for (const { item, category } of collectRawItems(raw)) {
    const normalized = normalizeEvidenceItem(item, category);
    if (!normalized) continue;
    const key = evidenceKey(normalized);
    const existing = seen.get(key);
    seen.set(key, existing ? chooseBetterEvidence(existing, normalized) : normalized);
  }

  const ranked = rankEvidence([...seen.values()]);
  const limit = options.limit || 30;
  return ranked.slice(0, limit).map((item, index) => ({
    ...item,
    id: `src_${index + 1}`,
  }));
}

function compactSource(item) {
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    domain: item.domain,
    source_type: item.source_type,
  };
}

function sourceMapById(sources = []) {
  return new Map(sources.map((source) => [source.id, source]));
}

function resolveSources(sourceIds = [], sources = []) {
  const byId = sourceMapById(sources);
  return (Array.isArray(sourceIds) ? sourceIds : [])
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map(compactSource);
}

function buildResearchQuality(sources = []) {
  const domains = new Set(sources.map((source) => source.domain).filter(Boolean));
  const sourceTypes = new Set(sources.map((source) => source.source_type).filter(Boolean));
  const evidenceKinds = new Set(sources.map((source) => source.evidence_kind).filter(Boolean));
  const missingCategories = REQUIRED_EVIDENCE_KINDS.filter((kind) => !evidenceKinds.has(kind));

  let coverageNote = 'Strong source coverage across the idea landscape.';
  if (sources.length === 0) {
    coverageNote = 'No reliable public evidence was found for this idea.';
  } else if (sources.length < 5 || domains.size < 2) {
    coverageNote = 'Sparse public evidence; treat conclusions as directional.';
  } else if (sources.length < 10 || domains.size < 4 || sourceTypes.size < 3) {
    coverageNote = 'Moderate public evidence; some categories may still be undercovered.';
  }

  return {
    evidence_count: sources.length,
    distinct_domains: domains.size,
    source_types: [...sourceTypes],
    coverage_note: coverageNote,
    missing_categories: missingCategories,
  };
}

function needsMoreEvidence(sources = []) {
  const quality = buildResearchQuality(sources);
  return (
    quality.evidence_count < 10 ||
    quality.distinct_domains < 4 ||
    quality.source_types.length < 3 ||
    quality.missing_categories.length > 1
  );
}

function sourceIdsFromIndexes(indexes = [], sources = []) {
  if (!Array.isArray(indexes)) return [];
  const validIds = new Set(sources.map((source) => source.id));
  const ids = [];
  for (const value of indexes) {
    if (typeof value === 'string' && value.startsWith('src_')) {
      if (validIds.has(value)) ids.push(value);
      continue;
    }
    const number = Number(value);
    if (Number.isInteger(number) && number > 0 && sources[number - 1]) {
      ids.push(sources[number - 1].id);
    }
  }
  return [...new Set(ids)];
}

module.exports = {
  buildResearchQuality,
  compactSource,
  needsMoreEvidence,
  normalizeEvidence,
  resolveSources,
  sourceIdsFromIndexes,
};
