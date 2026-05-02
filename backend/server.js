require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { runDigger } = require('./agents/digger');
const { runHistorian } = require('./agents/historian');
const { runLandscape } = require('./agents/landscape');
const { runPattern } = require('./agents/pattern');
const { runSynthesis } = require('./agents/synthesis');
const { storeIdeaResult } = require('./lib/backboard');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

app.post('/api/search', async (req, res) => {
  const { idea } = req.body;

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return res.status(400).json({ error: 'idea is required' });
  }

  const overallTimeout = setTimeout(() => {
    // Safety net — handled by Promise.race below
  }, 120000);

  try {
    const result = await Promise.race([
      (async () => {
        // Step 1: Digger first
        const diggerResult = await withTimeout(
          runDigger(idea.trim()),
          30000,
          { devpost_results: [], github_results: [], live_products: [], web_signals: [] }
        );

        // Step 2: Historian + Landscape in parallel
        const [historianResult, landscapeResult] = await Promise.all([
          withTimeout(
            runHistorian(idea.trim(), diggerResult),
            30000,
            { timeline: [], data_quality_note: 'timeout' }
          ),
          withTimeout(
            runLandscape(idea.trim(), diggerResult.live_products),
            30000,
            { competitors: [] }
          ),
        ]);

        // Step 3: Pattern
        const patternResult = await withTimeout(
          runPattern(idea.trim(), historianResult),
          30000,
          {
            turn_sentence: 'Not enough data to identify a pattern.',
            recurring_failure: '',
            cross_idea_insight: '',
            graph_size: 0,
            pattern_confidence: 'insufficient_data',
          }
        );

        // Step 4: Synthesis
        const synthesisResult = await withTimeout(
          runSynthesis(idea.trim(), historianResult, landscapeResult, patternResult),
          30000,
          { gap: 'Analysis timed out.', clock: 'Timing unavailable.' }
        );

        // Store in Backboard (fire and forget)
        storeIdeaResult(idea.trim(), {
          timeline: historianResult.timeline,
          turn_sentence: patternResult.turn_sentence,
          gap: synthesisResult.gap,
        }).catch(() => {});

        return {
          idea: idea.trim(),
          timeline: historianResult.timeline,
          turn_sentence: patternResult.turn_sentence,
          competitors: landscapeResult.competitors,
          gap: synthesisResult.gap,
          clock: synthesisResult.clock,
          pattern_confidence: patternResult.pattern_confidence,
          graph_size: patternResult.graph_size,
        };
      })(),
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              idea: idea.trim(),
              timeline: [],
              turn_sentence: 'Search timed out before patterns could be identified.',
              competitors: [],
              gap: 'The search timed out. Try again with a more specific idea.',
              clock: 'Timing unavailable.',
              pattern_confidence: 'insufficient_data',
              graph_size: 0,
            }),
          120000
        )
      ),
    ]);

    clearTimeout(overallTimeout);
    res.json(result);
  } catch (err) {
    clearTimeout(overallTimeout);
    console.error('Search error:', err);
    res.status(500).json({
      error: 'Internal server error',
      idea: idea.trim(),
      timeline: [],
      turn_sentence: 'An error occurred during research.',
      competitors: [],
      gap: 'Unable to complete the analysis.',
      clock: 'Timing unavailable.',
      pattern_confidence: 'insufficient_data',
      graph_size: 0,
    });
  }
});

app.get('/api/graph/stats', async (req, res) => {
  try {
    const { queryAdjacentIdeas } = require('./lib/backboard');
    const data = await queryAdjacentIdeas('');
    res.json({
      total_ideas_searched: data.graph_size || 0,
      unique_failure_patterns: 0,
    });
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
    pattern_confidence: 'insufficient_data',
    graph_size: 0,
  });
});

app.listen(PORT, () => {
  console.log(`HEADSTONE backend running on port ${PORT}`);
});
