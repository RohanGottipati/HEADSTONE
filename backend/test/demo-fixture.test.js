const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEMO_BUILD_DELAY_MS,
  DEMO_IDEA,
  DEMO_SEARCH_DELAY_MS,
  getDemoBuildPlan,
  getDemoSearchResult,
  isDemoIdea,
} = require('../lib/demo-fixture');

test('isDemoIdea matches the curated demo prompt with forgiving spacing and casing', () => {
  assert.equal(isDemoIdea('mental health journaling app'), true);
  assert.equal(isDemoIdea('  Mental   Health Journaling App  '), true);
  assert.equal(isDemoIdea('Build me a MENTAL HEALTH JOURNALING APP for students'), true);
  assert.equal(isDemoIdea('mental health journaling app!!!'), true);
  assert.equal(isDemoIdea('mental health app'), false);
});

test('demo search result is fully populated and returned as a fresh clone', () => {
  const first = getDemoSearchResult();
  const second = getDemoSearchResult();

  assert.equal(first.idea, DEMO_IDEA);
  assert.equal(first.timeline.length >= 5, true);
  assert.equal(first.competitors.length >= 4, true);
  assert.equal(first.sources.length >= 10, true);
  assert.equal(first.research_quality.evidence_count > 0, true);
  assert.equal(typeof first.turn_sentence, 'string');
  assert.equal(typeof first.gap, 'string');
  assert.equal(typeof first.clock, 'string');

  first.timeline[0].title = 'changed';
  assert.notEqual(second.timeline[0].title, 'changed');
});

test('demo build plan is populated for every major section', () => {
  const plan = getDemoBuildPlan();

  assert.equal(typeof plan.headline, 'string');
  assert.equal(plan.borrow_from_winners.length >= 3, true);
  assert.equal(plan.avoid_from_losers.length >= 3, true);
  assert.equal(plan.mvp.must_have_features.length >= 4, true);
  assert.equal(plan.v1_features.length >= 3, true);
  assert.equal(plan.risks.length >= 3, true);
  assert.equal(plan.next_three_steps.length, 3);
});

test('demo delays stay intentional but non-zero for the loading experience', () => {
  assert.equal(DEMO_SEARCH_DELAY_MS >= 5000, true);
  assert.equal(DEMO_BUILD_DELAY_MS >= 500, true);
  assert.equal(DEMO_SEARCH_DELAY_MS > DEMO_BUILD_DELAY_MS, true);
});
