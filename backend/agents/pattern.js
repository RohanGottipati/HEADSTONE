const { reasonOnly, safeParseJSON } = require('../lib/gemini');
const { queryAdjacentIdeas } = require('../lib/backboard');
const { PATTERN_PROMPT } = require('../lib/prompts');

async function runPattern(idea, historianResult) {
  let graphData;
  try {
    graphData = await queryAdjacentIdeas(idea);
  } catch {
    graphData = { adjacent_ideas: [], recurring_failure: null, graph_size: 0 };
  }

  const timeline = historianResult?.timeline || [];
  let turn_sentence = '';
  let recurring_failure = '';
  let cross_idea_insight = '';
  let pattern_confidence = 'insufficient_data';

  if (graphData.graph_size >= 5 && graphData.recurring_failure) {
    // Use Backboard graph data
    recurring_failure = graphData.recurring_failure;
    cross_idea_insight = `Based on ${graphData.graph_size} related ideas in the knowledge graph.`;

    const prompt = `The idea is: "${idea}"

The most common failure pattern across ${graphData.graph_size} similar ideas in our database is: "${graphData.recurring_failure}"

Adjacent ideas and their failure signals:
${JSON.stringify(graphData.adjacent_ideas.slice(0, 5), null, 2)}

Timeline of attempts at this specific idea:
${JSON.stringify(timeline, null, 2)}

Construct a turn_sentence — a single dramatic sentence naming the specific failure mode.`;

    try {
      const raw = await reasonOnly(prompt, PATTERN_PROMPT);
      const parsed = safeParseJSON(raw);
      if (parsed?.turn_sentence) {
        turn_sentence = parsed.turn_sentence;
        pattern_confidence = parsed.pattern_confidence || 'medium';
      }
    } catch {
      // Fall through to timeline-based approach
    }
  }

  if (!turn_sentence && timeline.length > 0) {
    // Derive from most common cause_of_death in timeline
    const causes = timeline
      .filter((t) => !t.is_alive && t.cause_of_death)
      .map((t) => t.cause_of_death);

    if (causes.length > 0) {
      const prompt = `The idea is: "${idea}"

Here are the causes of death for previous attempts:
${causes.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Timeline:
${JSON.stringify(timeline, null, 2)}

Construct a turn_sentence — a single dramatic sentence naming the specific failure mode that killed most of these attempts. It should feel like a revelation.`;

      try {
        const raw = await reasonOnly(prompt, PATTERN_PROMPT);
        const parsed = safeParseJSON(raw);
        if (parsed?.turn_sentence) {
          turn_sentence = parsed.turn_sentence;
          pattern_confidence = parsed.pattern_confidence || 'low';
        }
      } catch {
        // Use fallback
      }
    }

    if (!turn_sentence) {
      const mostCommon = causes[0] || 'no clear pattern detected';
      turn_sentence = `They all stumbled at the same point: ${mostCommon}`;
      pattern_confidence = 'low';
    }
  }

  if (!turn_sentence) {
    turn_sentence = 'Not enough data to identify a pattern — this idea may be uncharted territory.';
    pattern_confidence = 'insufficient_data';
  }

  return {
    turn_sentence,
    recurring_failure: recurring_failure || '',
    cross_idea_insight: cross_idea_insight || '',
    graph_size: graphData.graph_size,
    pattern_confidence,
  };
}

module.exports = { runPattern };
