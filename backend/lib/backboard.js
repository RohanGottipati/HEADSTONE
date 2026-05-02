const BACKBOARD_URL = process.env.BACKBOARD_URL || 'https://api.backboard.io';
const BACKBOARD_TOKEN = process.env.BACKBOARD_TOKEN || '';

async function storeIdeaResult(idea, result) {
  if (!BACKBOARD_TOKEN) return null;
  try {
    const response = await fetch(`${BACKBOARD_URL}/v1/nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BACKBOARD_TOKEN}`,
      },
      body: JSON.stringify({
        type: 'hackathon_idea',
        idea_text: idea,
        failure_signals: (result.timeline || []).map((t) => t.cause_of_death).filter(Boolean),
        turn_sentence: result.turn_sentence || '',
        gap: result.gap || '',
        timestamp: new Date().toISOString(),
      }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function queryAdjacentIdeas(idea) {
  if (!BACKBOARD_TOKEN) {
    return { adjacent_ideas: [], recurring_failure: null, graph_size: 0 };
  }
  try {
    const response = await fetch(`${BACKBOARD_URL}/v1/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BACKBOARD_TOKEN}`,
      },
      body: JSON.stringify({
        query: idea,
        top_k: 10,
        type: 'hackathon_idea',
      }),
    });
    if (!response.ok) {
      return { adjacent_ideas: [], recurring_failure: null, graph_size: 0 };
    }
    const data = await response.json();
    const nodes = data.results || data.nodes || [];
    const allFailures = nodes.flatMap((n) => n.failure_signals || []);
    const failureCounts = {};
    for (const f of allFailures) {
      failureCounts[f] = (failureCounts[f] || 0) + 1;
    }
    const sorted = Object.entries(failureCounts).sort((a, b) => b[1] - a[1]);
    return {
      adjacent_ideas: nodes.map((n) => ({
        idea: n.idea_text,
        turn_sentence: n.turn_sentence,
        failure_signals: n.failure_signals,
      })),
      recurring_failure: sorted.length > 0 ? sorted[0][0] : null,
      graph_size: data.total || nodes.length,
    };
  } catch {
    return { adjacent_ideas: [], recurring_failure: null, graph_size: 0 };
  }
}

module.exports = { storeIdeaResult, queryAdjacentIdeas };
