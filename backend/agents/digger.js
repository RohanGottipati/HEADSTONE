const { searchAndReason, safeParseJSON } = require('../lib/gemini');
const { DIGGER_PROMPT } = require('../lib/prompts');

async function runDigger(idea) {
  const searches = [
    `site:devpost.com ${idea}`,
    `site:github.com ${idea} hackathon`,
    `site:producthunt.com ${idea}`,
    `${idea} startup shutdown OR postmortem OR "lessons learned"`,
  ];

  const results = await Promise.allSettled(
    searches.map((query) =>
      searchAndReason(
        `Search for: ${query}\n\nFind real projects, products, and hackathon submissions related to this search. Return structured data about what you find.`,
        DIGGER_PROMPT
      )
    )
  );

  const combined = {
    devpost_results: [],
    github_results: [],
    live_products: [],
    web_signals: [],
  };

  const categories = ['devpost_results', 'github_results', 'live_products', 'web_signals'];

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') {
      const parsed = safeParseJSON(results[i].value);
      if (parsed) {
        for (const cat of categories) {
          if (Array.isArray(parsed[cat])) {
            combined[cat].push(...parsed[cat]);
          }
        }
      }
    }
  }

  return combined;
}

module.exports = { runDigger };
