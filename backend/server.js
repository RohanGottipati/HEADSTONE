require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { runExpander } = require('./agents/expander');
const { runDigger } = require('./agents/digger');
const { runHistorian } = require('./agents/historian');
const { runLandscape } = require('./agents/landscape');
const { runPattern } = require('./agents/pattern');
const { runSynthesis } = require('./agents/synthesis');
const { runBuilder, EMPTY_PLAN } = require('./agents/builder');
const { storeIdeaResult, getGraphStats } = require('./lib/backboard');

const app = express();
const PORT = process.env.PORT || 3001;
const EMPTY_RESEARCH_QUALITY = {
  evidence_count: 0,
  distinct_domains: 0,
  source_types: [],
  coverage_note: 'No reliable public evidence was found for this idea.',
  missing_categories: ['hackathon', 'repository', 'live_product', 'failure_signal'],
};

app.use(cors());
app.use(express.json());

function withTimeout(promise, ms, fallback, label = 'task') {
  let timeoutId;
  let timedOut = false;
  return Promise.race([
    Promise.resolve(promise).catch((err) => {
      console.error(`[${label}] failed:`, err && err.message ? err.message : err);
      return fallback;
    }),
    new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        console.error(`[${label}] timed out after ${ms}ms`);
        resolve(fallback);
      }, ms);
    }),
  ]).finally(() => {
    clearTimeout(timeoutId);
    if (!timedOut) {
      // success path — nothing to log
    }
  });
}

function buildSearchResult(idea, overrides = {}) {
  return {
    idea,
    timeline: [],
    turn_sentence: 'Not enough data to identify a pattern.',
    competitors: [],
    gap: 'No gap analysis is available yet.',
    clock: 'Timing unavailable.',
    sources: [],
    research_quality: EMPTY_RESEARCH_QUALITY,
    data_quality_note: '',
    pattern_confidence: 'insufficient_data',
    graph_size: 0,
    ...overrides,
  };
}

app.post('/api/search', async (req, res) => {
  const { idea } = req.body;

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return res.status(400).json({ error: 'idea is required' });
  }

  const ideaText = idea.trim();
  let partialResult = buildSearchResult(ideaText);

  console.log(`[search] start "${ideaText}"`);
  const searchStart = Date.now();

  try {
    const result = await Promise.race([
      (async () => {
        const expansion = await withTimeout(runExpander(ideaText), 30000, null, 'expander');
        const diggerResult = await withTimeout(
          runDigger(ideaText, expansion || {}),
          105000,
          {
            devpost_results: [],
            github_results: [],
            live_products: [],
            web_signals: [],
            sources: [],
            research_quality: EMPTY_RESEARCH_QUALITY,
            search_queries: [],
          },
          'digger'
        );
        console.log(`[search] digger collected ${diggerResult.sources?.length || 0} sources`);

        const [historianResult, landscapeResult] = await Promise.all([
          withTimeout(
            runHistorian(ideaText, diggerResult),
            60000,
            { timeline: [], data_quality_note: 'timeout' },
            'historian'
          ),
          withTimeout(
            runLandscape(ideaText, diggerResult),
            60000,
            { competitors: [] },
            'landscape'
          ),
        ]);
        const timeline = Array.isArray(historianResult?.timeline) ? historianResult.timeline : [];
        const competitors = Array.isArray(landscapeResult?.competitors) ? landscapeResult.competitors : [];

        partialResult = buildSearchResult(ideaText, {
          timeline,
          competitors,
          sources: diggerResult.sources,
          research_quality: diggerResult.research_quality,
          data_quality_note: historianResult.data_quality_note || '',
        });

        const patternResult = await withTimeout(
          runPattern(ideaText, historianResult),
          45000,
          {
            turn_sentence: 'Not enough data to identify a pattern.',
            recurring_failure: '',
            cross_idea_insight: '',
            graph_size: 0,
            pattern_confidence: 'insufficient_data',
          },
          'pattern'
        );

        partialResult = buildSearchResult(ideaText, {
          timeline,
          turn_sentence: patternResult.turn_sentence,
          competitors,
          sources: diggerResult.sources,
          research_quality: diggerResult.research_quality,
          data_quality_note: historianResult.data_quality_note || '',
          pattern_confidence: patternResult.pattern_confidence,
          graph_size: patternResult.graph_size,
        });

        const synthesisResult = await withTimeout(
          runSynthesis(ideaText, historianResult, landscapeResult, patternResult, diggerResult),
          45000,
          { gap: 'Analysis timed out.', clock: 'Timing unavailable.' },
          'synthesis'
        );

        partialResult = buildSearchResult(ideaText, {
          timeline,
          turn_sentence: patternResult.turn_sentence,
          competitors,
          gap: synthesisResult.gap,
          clock: synthesisResult.clock,
          sources: diggerResult.sources,
          research_quality: diggerResult.research_quality,
          data_quality_note: historianResult.data_quality_note || '',
          pattern_confidence: patternResult.pattern_confidence,
          graph_size: patternResult.graph_size,
        });

        await withTimeout(storeIdeaResult(ideaText, {
          timeline,
          turn_sentence: patternResult.turn_sentence,
          gap: synthesisResult.gap,
          competitors,
          sources: diggerResult.sources,
          research_quality: diggerResult.research_quality,
        }), 5000, null, 'memory_store');

        console.log(`[search] done in ${Date.now() - searchStart}ms — ${timeline.length} timeline / ${competitors.length} competitors`);
        return partialResult;
      })(),
      new Promise((resolve) => setTimeout(() => {
        console.error(`[search] hard timeout after 180000ms`);
        resolve(partialResult);
      }, 180000)),
    ]);

    res.json(result);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      error: 'Internal server error',
      idea: ideaText,
      timeline: [],
      turn_sentence: 'An error occurred during research.',
      competitors: [],
      gap: 'Unable to complete the analysis.',
      clock: 'Timing unavailable.',
      sources: [],
      research_quality: EMPTY_RESEARCH_QUALITY,
      data_quality_note: 'pipeline error',
      pattern_confidence: 'insufficient_data',
      graph_size: 0,
    });
  }
});

app.post('/api/build', async (req, res) => {
  const { idea, timeline, competitors, gap, clock, turn_sentence, research_quality } = req.body || {};

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return res.status(400).json({ error: 'idea is required' });
  }

  try {
    const plan = await withTimeout(
      runBuilder(idea.trim(), {
        timeline: Array.isArray(timeline) ? timeline : [],
        competitors: Array.isArray(competitors) ? competitors : [],
        gap: typeof gap === 'string' ? gap : '',
        clock: typeof clock === 'string' ? clock : '',
        turn_sentence: typeof turn_sentence === 'string' ? turn_sentence : '',
        research_quality: research_quality || {},
      }),
      45000,
      EMPTY_PLAN,
      'builder'
    );
    res.json({ idea: idea.trim(), plan });
  } catch (err) {
    console.error('Build error:', err);
    res.status(500).json({ idea: idea.trim(), plan: EMPTY_PLAN, error: 'build_failed' });
  }
});

app.get('/api/graph/stats', async (req, res) => {
  try {
    res.json(await getGraphStats());
  } catch {
    res.json({ total_ideas_searched: 0, unique_failure_patterns: 0 });
  }
});

app.get('/api/demo', (req, res) => {
  // This endpoint returns a cached JSON result for "mental health journaling app"
  // Populate backend/cache/demo.json by running the search once and saving the result
  const demoPath = path.join(__dirname, 'cache', 'demo.json');
  try {
    if (fs.existsSync(demoPath)) {
      const data = fs.readFileSync(demoPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Object.keys(parsed).length > 0) {
        return res.json(parsed);
      }
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback if demo.json is empty or missing
  res.json({
    idea: 'mental health journaling app',
    timeline: [],
    turn_sentence: 'Demo data not yet populated. Run a search for "mental health journaling app" and save the result to backend/cache/demo.json.',
    competitors: [],
    gap: 'Run the search once to populate this demo cache.',
    clock: 'Demo mode.',
    sources: [],
    research_quality: EMPTY_RESEARCH_QUALITY,
    data_quality_note: 'demo cache empty',
    pattern_confidence: 'insufficient_data',
    graph_size: 0,
  });
});

app.listen(PORT, () => {
  console.log(`HEADSTONE backend running on port ${PORT}`);
});
