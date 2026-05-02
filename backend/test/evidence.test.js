const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildResearchQuality,
  needsMoreEvidence,
  normalizeEvidence,
  sourceIdsFromIndexes,
} = require('../lib/evidence');
const { buildRetrySpecs, buildSearchSpecs } = require('../agents/digger');
const { safeParseJSON } = require('../lib/gemini');

test('normalizeEvidence dedupes URLs and infers source metadata', () => {
  const sources = normalizeEvidence({
    devpost_results: [
      {
        title: 'Mood Journal',
        url: 'https://www.devpost.com/software/mood-journal/',
        description: 'A mental health journaling hackathon project.',
        year: 2024,
      },
    ],
    evidence: [
      {
        title: 'Mood Journal Duplicate',
        url: 'https://devpost.com/software/mood-journal',
        snippet: 'Duplicate with a cleaner domain.',
        relevance: 0.9,
      },
      {
        title: 'Mood Journal Repo',
        url: 'https://github.com/example/mood-journal',
        snippet: 'Repository was archived after the demo.',
        evidence_kind: 'repository',
      },
    ],
  });

  assert.equal(sources.length, 2);
  assert.equal(sources[0].id, 'src_1');
  assert.equal(sources.some((source) => source.domain === 'devpost.com'), true);
  assert.equal(sources.some((source) => source.source_type === 'github'), true);
  assert.equal(sources.some((source) => source.evidence_kind === 'repository'), true);
});

test('buildResearchQuality reports sparse coverage and missing categories', () => {
  const sources = normalizeEvidence({
    evidence: [
      {
        title: 'Only Source',
        url: 'https://github.com/example/project',
        evidence_kind: 'repository',
        snippet: 'A single repository.',
      },
    ],
  });
  const quality = buildResearchQuality(sources);

  assert.equal(quality.evidence_count, 1);
  assert.equal(quality.distinct_domains, 1);
  assert.equal(quality.missing_categories.includes('hackathon'), true);
  assert.equal(needsMoreEvidence(sources), true);
});

test('sourceIdsFromIndexes accepts explicit ids and numeric indexes', () => {
  const sources = normalizeEvidence({
    evidence: [
      { title: 'First', url: 'https://devpost.com/software/first' },
      { title: 'Second', url: 'https://github.com/example/second' },
    ],
  });

  assert.deepEqual(sourceIdsFromIndexes([1, 'src_2', 'bad'], sources), ['src_1', 'src_2']);
});

test('buildSearchSpecs and retry specs target deep research categories', () => {
  const expansion = {
    aliases: ['AI journal'],
    adjacent_categories: ['mental health tracking'],
    competitor_terms: ['mood tracker'],
    failure_phrases: ['abandoned', 'postmortem'],
  };
  const specs = buildSearchSpecs('mental health journaling app', expansion);
  const retrySpecs = buildRetrySpecs('mental health journaling app', expansion, {
    distinct_domains: 1,
    missing_categories: ['hackathon', 'failure_signal'],
  });

  assert.equal(specs.length >= 8, true);
  assert.equal(specs.some((spec) => spec.query.includes('devpost.com')), true);
  assert.equal(specs.some((spec) => spec.query.includes('github.com')), true);
  assert.equal(retrySpecs.some((spec) => spec.label.includes('hackathon')), true);
  assert.equal(retrySpecs.some((spec) => spec.label.includes('failure')), true);
});

test('safeParseJSON extracts JSON from model text', () => {
  assert.deepEqual(safeParseJSON('```json\n{"ok":true}\n```'), { ok: true });
  assert.deepEqual(safeParseJSON('Here is the result:\n{"ok":true}\nThanks'), { ok: true });
});
