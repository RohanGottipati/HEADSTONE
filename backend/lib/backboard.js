const fs = require('fs');
const path = require('path');

const BACKBOARD_URL = (process.env.BACKBOARD_URL || 'https://app.backboard.io/api').replace(/\/$/, '');
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY || '';
const ASSISTANT_ID_FILE = path.join(__dirname, '..', 'cache', 'assistant_id.txt');
const ASSISTANT_NAME = 'HEADSTONE Idea Graveyard';
const ASSISTANT_INSTRUCTIONS =
  'You are the AI research and persistent memory layer for HEADSTONE - a system that researches the history of hackathon ideas. ' +
  'When asked for research, use current web evidence, be skeptical, cite real public sources in structured fields, and never fabricate facts. ' +
  'When memories are recalled, surface failure signals from semantically adjacent ideas.';

let cachedAssistantId = null;
let bootstrapPromise = null;

function bbHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': BACKBOARD_API_KEY,
  };
}

async function bbFetch(pathSuffix, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BACKBOARD_URL}${pathSuffix}`, {
      ...options,
      headers: { ...bbHeaders(), ...(options.headers || {}) },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

function readPersistedAssistantId() {
  try {
    if (fs.existsSync(ASSISTANT_ID_FILE)) {
      const id = fs.readFileSync(ASSISTANT_ID_FILE, 'utf-8').trim();
      if (id) return id;
    }
  } catch {
    // ignore
  }
  return null;
}

function persistAssistantId(id) {
  try {
    fs.mkdirSync(path.dirname(ASSISTANT_ID_FILE), { recursive: true });
    fs.writeFileSync(ASSISTANT_ID_FILE, id, 'utf-8');
  } catch {
    // ignore
  }
}

async function createAssistant() {
  const res = await bbFetch('/assistants', {
    method: 'POST',
    body: JSON.stringify({
      name: ASSISTANT_NAME,
      system_prompt: ASSISTANT_INSTRUCTIONS,
    }),
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json().catch(() => null);
  return data?.assistant_id || data?.id || null;
}

async function ensureAssistantId() {
  if (cachedAssistantId) return cachedAssistantId;
  if (process.env.BACKBOARD_ASSISTANT_ID) {
    cachedAssistantId = process.env.BACKBOARD_ASSISTANT_ID;
    return cachedAssistantId;
  }
  const persisted = readPersistedAssistantId();
  if (persisted) {
    cachedAssistantId = persisted;
    return cachedAssistantId;
  }
  if (!BACKBOARD_API_KEY) return null;

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const id = await createAssistant().catch(() => null);
      if (id) {
        cachedAssistantId = id;
        persistAssistantId(id);
      }
      return id;
    })();
  }
  return bootstrapPromise;
}

async function createThread() {
  const assistantId = await ensureAssistantId();
  if (!assistantId) {
    throw new Error('Backboard assistant is not configured');
  }

  const res = await bbFetch(`/assistants/${assistantId}/threads`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Backboard thread creation failed: ${res.status} ${detail}`);
  }

  const data = await res.json().catch(() => null);
  if (!data?.thread_id) {
    throw new Error('Backboard thread creation returned no thread_id');
  }
  return data.thread_id;
}

async function sendBackboardMessage(content, options = {}) {
  if (!BACKBOARD_API_KEY) {
    throw new Error('BACKBOARD_API_KEY is not configured');
  }

  const threadId = options.threadId || await createThread();
  const body = {
    content,
    stream: false,
    memory: options.memory || 'off',
    web_search: options.webSearch ? 'Auto' : 'off',
    llm_provider: process.env.BACKBOARD_LLM_PROVIDER || 'openai',
    model_name: process.env.BACKBOARD_MODEL_NAME || 'gpt-4o',
  };

  if (!options.webSearch) {
    body.json_output = Boolean(options.jsonOutput);
  }

  const res = await bbFetch(`/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, options.timeoutMs || 60000);

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Backboard message failed: ${res.status} ${detail}`);
  }

  const data = await res.json().catch(() => null);
  if (!data?.content) {
    throw new Error('Backboard message returned no content');
  }

  return data.content;
}

function buildMemoryContent(idea, result) {
  const failureSignals = (result.timeline || [])
    .map((t) => t && t.cause_of_death)
    .filter((c) => c && c !== 'no public record of continuation');
  const sourceDomains = [...new Set((result.sources || []).map((source) => source.domain).filter(Boolean))];
  const competitorNames = (result.competitors || []).map((competitor) => competitor.name).filter(Boolean);
  const evidenceCount = result.research_quality?.evidence_count || (result.sources || []).length;

  const lines = [
    `Idea: ${idea}`,
    `Turn sentence: ${result.turn_sentence || ''}`,
    failureSignals.length ? `Failure signals: ${failureSignals.join(' | ')}` : 'Failure signals: none recorded',
    `Evidence count: ${evidenceCount}`,
    sourceDomains.length ? `Source domains: ${sourceDomains.join(' | ')}` : null,
    competitorNames.length ? `Competitors: ${competitorNames.join(' | ')}` : null,
    result.gap ? `Gap: ${result.gap}` : null,
  ].filter(Boolean);

  return lines.join('\n');
}

async function storeIdeaResult(idea, result) {
  if (!BACKBOARD_API_KEY) return null;
  try {
    const assistantId = await ensureAssistantId();
    if (!assistantId) return null;

    const content = buildMemoryContent(idea, result);
    const failureSignals = (result.timeline || [])
      .map((t) => t && t.cause_of_death)
      .filter((c) => c && c !== 'no public record of continuation');
    const sourceDomains = [...new Set((result.sources || []).map((source) => source.domain).filter(Boolean))];
    const competitorNames = (result.competitors || []).map((competitor) => competitor.name).filter(Boolean);

    const res = await bbFetch(`/assistants/${assistantId}/memories`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        metadata: {
          type: 'hackathon_idea',
          idea_text: idea,
          failure_signals: failureSignals,
          turn_sentence: result.turn_sentence || '',
          gap: result.gap || '',
          evidence_count: result.research_quality?.evidence_count || (result.sources || []).length,
          source_domains: sourceDomains,
          competitor_names: competitorNames,
          research_quality: result.research_quality || null,
          timestamp: new Date().toISOString(),
        },
      }),
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

function extractFailureSignals(memory) {
  if (memory?.metadata?.failure_signals && Array.isArray(memory.metadata.failure_signals)) {
    return memory.metadata.failure_signals;
  }
  const content = memory?.content || '';
  const match = content.match(/Failure signals:\s*(.+)/i);
  if (!match) return [];
  if (/^none recorded/i.test(match[1])) return [];
  return match[1].split('|').map((s) => s.trim()).filter(Boolean);
}

function extractIdeaText(memory) {
  if (memory?.metadata?.idea_text) return memory.metadata.idea_text;
  const content = memory?.content || '';
  const match = content.match(/Idea:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

function extractTurnSentence(memory) {
  if (memory?.metadata?.turn_sentence) return memory.metadata.turn_sentence;
  const content = memory?.content || '';
  const match = content.match(/Turn sentence:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

async function listMemoryTotal(assistantId) {
  try {
    const res = await bbFetch(`/assistants/${assistantId}/memories?page=1&page_size=1`, {
      method: 'GET',
    });
    if (!res.ok) return 0;
    const data = await res.json().catch(() => null);
    return data?.total_count || (Array.isArray(data?.memories) ? data.memories.length : 0);
  } catch {
    return 0;
  }
}

async function listIdeaMemories() {
  const assistantId = await ensureAssistantId();
  if (!assistantId) return [];

  const memories = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await bbFetch(`/assistants/${assistantId}/memories?page=${page}&page_size=100`, {
      method: 'GET',
    });
    if (!res.ok) break;

    const data = await res.json().catch(() => null);
    const pageMemories = Array.isArray(data?.memories) ? data.memories : [];
    memories.push(...pageMemories);

    totalPages = data?.total_pages || (pageMemories.length === 100 ? page + 1 : page);
    page += 1;
  } while (page <= totalPages);

  return memories.filter((memory) => {
    if (memory?.metadata?.type === 'hackathon_idea') return true;
    return /^Idea:/i.test(memory?.content || '');
  });
}

async function queryAdjacentIdeas(idea) {
  const empty = { adjacent_ideas: [], recurring_failure: null, graph_size: 0 };
  if (!BACKBOARD_API_KEY) return empty;
  try {
    const assistantId = await ensureAssistantId();
    if (!assistantId) return empty;

    const totalCount = await listMemoryTotal(assistantId);

    if (!idea) {
      return { adjacent_ideas: [], recurring_failure: null, graph_size: totalCount };
    }

    const res = await bbFetch(`/assistants/${assistantId}/memories/search`, {
      method: 'POST',
      body: JSON.stringify({ query: idea, limit: 10 }),
    });
    if (!res.ok) {
      return { adjacent_ideas: [], recurring_failure: null, graph_size: totalCount };
    }
    const data = await res.json().catch(() => ({}));
    const memories = Array.isArray(data?.memories) ? data.memories : [];

    const allFailures = memories.flatMap(extractFailureSignals);
    const freq = {};
    for (const f of allFailures) {
      freq[f] = (freq[f] || 0) + 1;
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

    const adjacent = memories
      .map((m) => ({
        idea: extractIdeaText(m),
        turn_sentence: extractTurnSentence(m),
        failure_signals: extractFailureSignals(m),
      }))
      .filter((m) => m.idea);

    return {
      adjacent_ideas: adjacent,
      recurring_failure: sorted.length > 0 ? sorted[0][0] : null,
      graph_size: totalCount,
    };
  } catch {
    return empty;
  }
}

async function getGraphStats() {
  if (!BACKBOARD_API_KEY) {
    return { total_ideas_searched: 0, unique_failure_patterns: 0 };
  }

  try {
    const memories = await listIdeaMemories();
    const uniqueFailures = new Set();

    for (const memory of memories) {
      for (const signal of extractFailureSignals(memory)) {
        uniqueFailures.add(signal);
      }
    }

    return {
      total_ideas_searched: memories.length,
      unique_failure_patterns: uniqueFailures.size,
    };
  } catch {
    return { total_ideas_searched: 0, unique_failure_patterns: 0 };
  }
}

module.exports = {
  storeIdeaResult,
  queryAdjacentIdeas,
  getGraphStats,
  ensureAssistantId,
  sendBackboardMessage,
};
