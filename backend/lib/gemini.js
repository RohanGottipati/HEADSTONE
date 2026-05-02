const { sendBackboardMessage } = require('./backboard');

function safeParseJSON(text) {
  if (!text) return null;
  try {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch {
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
    } catch {
      // fall through
    }
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetries(fn, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(500 * 2 ** attempt);
      }
    }
  }
  throw lastError;
}

async function searchAndReason(prompt, systemPrompt, options = {}) {
  return withRetries(() =>
    sendBackboardMessage(
      `${systemPrompt}\n\n${prompt}`,
      {
        webSearch: true,
        memory: 'Readonly',
        timeoutMs: options.timeoutMs || 60000,
      }
    )
  );
}

async function reasonOnly(prompt, systemPrompt, options = {}) {
  return withRetries(() =>
    sendBackboardMessage(
      `${systemPrompt}\n\n${prompt}`,
      {
        webSearch: false,
        memory: options.memory || 'off',
        jsonOutput: true,
        timeoutMs: options.timeoutMs || 60000,
      }
    )
  );
}

module.exports = { searchAndReason, reasonOnly, safeParseJSON };
