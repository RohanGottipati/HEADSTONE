# HEADSTONE — Full Technical Implementation

> **Every idea has a history. Most of it is buried.**

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [The Three-Act Narrative Structure](#the-three-act-narrative-structure)
3. [Architecture Overview](#architecture-overview)
4. [Tech Stack](#tech-stack)
5. [Repository Structure](#repository-structure)
6. [The Five Agents](#the-five-agents)
7. [API Reference](#api-reference)
8. [Backboard Integration](#backboard-integration)
9. [Gemini Integration](#gemini-integration)
10. [Frontend Specification](#frontend-specification)
11. [Rendering Sequence — Critical](#rendering-sequence--critical)
12. [Team Task Breakdown](#team-task-breakdown)
13. [Environment Variables](#environment-variables)
14. [Hour-by-Hour Timeline](#hour-by-hour-timeline)
15. [Demo Preparation](#demo-preparation)
16. [Devin Prompt](#devin-prompt)

---

## Product Overview

HEADSTONE takes a hackathon idea as input and returns the complete biography of that idea — structured not as a dashboard but as a **three-act narrative** that the user experiences in time.

The app collects all data silently in the background, then reveals it in a controlled sequence:

1. The graves — names and years only, the shape of the graveyard
2. The inscriptions — cause of death, one by one, with pauses between
3. The pattern — a single sentence, after silence
4. The living — brief, almost dismissive
5. The gap — one paragraph
6. The clock — one sentence
7. The final entry — the user's name, alone, after everything else has settled

The user doesn't read results. They walk through a graveyard that ends with their name on the last stone.

**What makes it not a chatbot:** Backboard's persistent knowledge graph stores every search. The Pattern agent queries accumulated memory across sessions to surface cross-idea insights that don't exist anywhere on the internet. The graph compounds across every team that uses it tonight.

---

## The Three-Act Narrative Structure

This is the most important section in this document. Every frontend decision flows from this.

### Act 1 — The Dead

The page is empty except for the input. User types their idea and submits.

A single ambient loading line appears — not a progress bar, not agent dots. Just:

```
searching the graveyard...
```

This persists until ALL five agents have completed. The user waits. The system works silently. **Do not show partial results. Do not stream sections as agents complete. Collect everything first.**

When all data is ready, the reveal begins.

The timeline renders — but only names and years. No causes of death yet. Just the shape of how many people tried this.

```
2018  ·  MindLog
2019  ·  ReflectAI
2020  ·  ThoughtSpace
2022  ·  JournalBot
2023  ·  Reflectly  [alive]
2024  ·  Jour  [alive]
```

The user sees the graveyard before they know what's in it. They count the attempts. They register the weight of it.

Pause: 1200ms after the last name appears.

### Act 2 — The Inscriptions

Then — one by one, with 800ms between each — the cause of death fades in under each name:

```
2018  ·  MindLog
        Built for HackMIT. 200 users week one.
        Died: nobody came back after day 3.

[800ms pause]

2019  ·  ReflectAI
        2nd place HackHarvard. Better design, same problem.
        Died: day 4 retention 12%. Team graduated.
```

Each inscription appears fully before the next begins. The user is being walked through the graveyard, not handed a list.

After the last inscription: **2000ms of silence.** Longer than comfortable.

### The Turn

Then a single line appears, centered, larger than everything else on the page:

```
They all died on the same day.
```

Not literally — but the same moment in the product lifecycle. This is the turn. The story shifts from history to meaning. The user has just watched every attempt hit the same wall in sequence. Now they understand it wasn't bad luck.

Pause: 1200ms after the turn line appears.

### Act 3 — The Present and The Invitation

Competitors appear — compressed, almost dismissive. Two or three lines each. Here's who's alive. Here's their weakness. No equal billing with the dead.

Then the gap paragraph. One full paragraph, left-bordered in accent color.

Then the clock. One sentence. Appears alone.

Then nothing for 1500ms.

Then the final stone. Slower than all the others.

```
2026

YOU
```

No death date. No cause of death. The cursor blinks next to the name.

The page does not say anything after this. No button. No call to action. Just the entry, and silence.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   HEADSTONE Frontend                     │
│         (React, single page, narrative reveal UI)        │
└──────────────────────┬──────────────────────────────────┘
                       │ POST /api/search
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Backend                        │
│    (Node.js — runs all agents, returns complete JSON)    │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Agent 1  │ │ Agent 2  │ │ Agent 3  │
    │  Digger  │ │Historian │ │Landscape │
    │ (Gemini) │ │ (Gemini) │ │ (Gemini) │
    └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │
         └────────────┼────────────┘
                      ▼
               ┌──────────┐
               │ Agent 4  │
               │ Pattern  │
               │(Backboard│
               │ Memory)  │
               └────┬─────┘
                    ▼
               ┌──────────┐
               │ Agent 5  │
               │Synthesis │
               │ (Gemini) │
               └────┬─────┘
                    ▼
          ┌──────────────────┐
          │  Single JSON     │
          │  response to     │
          │  frontend        │
          └──────────────────┘
```

**Critical architectural decision:** The backend runs all five agents and returns a **single complete JSON response** when finished. No SSE streaming of partial results. The frontend waits, shows the ambient loading state, then orchestrates the narrative reveal entirely on the client side using timed sequences.

This is the opposite of the typical "stream results as they arrive" approach. The narrative requires complete data before the story can begin. A loading state that builds suspense is better than partial results that break the pacing.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Timed reveal sequences, clean state management |
| Styling | Tailwind CSS + custom CSS vars | Utility + bespoke aesthetic |
| Backend | Node.js + Express | Simple, returns complete JSON |
| AI Reasoning | Google Gemini 2.0 Flash | Search grounding, multimodal understanding |
| Memory / Orchestration | Backboard.io | Persistent graph, multi-agent orchestration |
| Search | Gemini with Google Search grounding | No scraping, no rate limits |
| Deployment | Localhost for hackathon | No deploy needed |

---

## Repository Structure

```
headstone/
├── backend/
│   ├── server.js               # Express server, single JSON endpoint
│   ├── agents/
│   │   ├── digger.js           # Agent 1: raw data collection
│   │   ├── historian.js        # Agent 2: timeline extraction
│   │   ├── landscape.js        # Agent 3: live competitor analysis
│   │   ├── pattern.js          # Agent 4: Backboard memory query
│   │   └── synthesis.js        # Agent 5: narrative generation
│   ├── lib/
│   │   ├── gemini.js           # Gemini API client + search grounding
│   │   ├── backboard.js        # Backboard graph client
│   │   └── prompts.js          # All agent system prompts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component + reveal orchestrator
│   │   ├── components/
│   │   │   ├── SearchInput.jsx     # Initial input state
│   │   │   ├── LoadingState.jsx    # "searching the graveyard..."
│   │   │   ├── GraveyardScene.jsx  # The full narrative reveal
│   │   │   ├── GraveNames.jsx      # Act 1: names and years only
│   │   │   ├── GraveEntry.jsx      # Single grave with inscription
│   │   │   ├── TurnLine.jsx        # "They all died on the same day."
│   │   │   ├── LivingSection.jsx   # Compressed competitor list
│   │   │   ├── GapSection.jsx      # The gap paragraph
│   │   │   ├── ClockLine.jsx       # Single sentence clock
│   │   │   └── FinalStone.jsx      # "2026 — YOU"
│   │   ├── hooks/
│   │   │   ├── useHeadstone.js     # API call + state management
│   │   │   └── useNarrativeReveal.js # Timed sequence orchestrator
│   │   └── styles/
│   │       └── globals.css
│   ├── index.html
│   └── package.json
├── .env
└── README.md
```

---

## The Five Agents

### Agent 1 — Digger

**Purpose:** Collect raw data across all four sources in parallel.

**Model:** `gemini-2.0-flash` with Google Search grounding

**Input:** Raw idea string from user

**Searches fired (in parallel):**
1. `site:devpost.com [idea keywords]`
2. `site:devpost.com [idea keywords] winner`
3. `site:github.com [idea keywords] hackathon`
4. `site:producthunt.com [idea keywords]`
5. `[idea keywords] startup shutdown "lessons learned" OR postmortem`
6. `[idea keywords] site:news.ycombinator.com "Show HN"`

**Output schema:**
```json
{
  "devpost_results": [
    {
      "title": "string",
      "url": "string",
      "description": "string",
      "hackathon": "string",
      "year": "number",
      "tech_stack": ["string"]
    }
  ],
  "github_results": [
    {
      "repo_name": "string",
      "url": "string",
      "description": "string",
      "last_commit_signal": "string",
      "stars": "number"
    }
  ],
  "live_products": [
    {
      "name": "string",
      "url": "string",
      "description": "string",
      "launch_date": "string"
    }
  ],
  "web_signals": [
    {
      "title": "string",
      "url": "string",
      "snippet": "string",
      "signal_type": "shutdown | pivot | postmortem | launch | review"
    }
  ]
}
```

---

### Agent 2 — Historian

**Purpose:** Build the timeline — extract what was built, how far it got, and why it stopped.

**Model:** `gemini-2.0-flash` with search grounding

**Critical instruction:** For each result, extract the cause of death — inferred from descriptions, comments, GitHub activity, or any available signal. Never fabricate. If unknown, use "no public record of continuation." Return entries chronologically.

**Output schema:**
```json
{
  "timeline": [
    {
      "year": 2019,
      "title": "string",
      "what_was_built": "string",
      "how_far": "won | placed | abandoned | unknown",
      "cause_of_death": "string",
      "source_url": "string",
      "is_alive": false,
      "confidence": "high | medium | low"
    }
  ],
  "data_quality_note": "string"
}
```

---

### Agent 3 — Landscape

**Purpose:** Understand what's alive right now.

**Model:** `gemini-2.0-flash` with search grounding

**Output schema:**
```json
{
  "competitors": [
    {
      "name": "string",
      "url": "string",
      "what_they_do": "string",
      "weakness": "string",
      "signal": "string"
    }
  ]
}
```

---

### Agent 4 — Pattern

**Purpose:** Query Backboard for cross-session insights.

**Model:** Backboard semantic recall

**Output schema:**
```json
{
  "turn_sentence": "string",
  "recurring_failure": "string | null",
  "cross_idea_insight": "string | null",
  "graph_size": "number",
  "pattern_confidence": "high | medium | low | insufficient_data"
}
```

**Note on `turn_sentence`:** This is the single most important string in the entire output. It should complete the sentence "They all died on the same day." — meaning, what was that day? What was the wall? If pattern_confidence is insufficient_data, turn_sentence falls back to the most common cause_of_death extracted from the Historian timeline.

---

### Agent 5 — Synthesis

**Purpose:** Generate the gap paragraph and clock sentence.

**Model:** `gemini-2.0-flash` (no search grounding needed)

**System prompt key instruction:**
> Write for a person who is about to spend their weekend on this idea. The gap is one paragraph — what exists, what doesn't, why it's still open, what changed in the last 12-18 months that makes now different. The clock is one sentence — how long before the gap closes. Do not write lists. Do not use headers. Write like someone who has read every attempt and finally understands what was being attempted.

**Output schema:**
```json
{
  "gap": "string",
  "clock": "string"
}
```

---

## API Reference

### `POST /api/search`

Runs all five agents sequentially/in parallel and returns complete result when finished.

**Request:**
```json
{ "idea": "app that helps people remember what they read" }
```

**Response** (returned when ALL agents complete, ~45-90 seconds):
```json
{
  "idea": "string",
  "timeline": [
    {
      "year": 2019,
      "title": "string",
      "what_was_built": "string",
      "cause_of_death": "string",
      "source_url": "string",
      "is_alive": false,
      "confidence": "high | medium | low"
    }
  ],
  "turn_sentence": "string",
  "competitors": [
    {
      "name": "string",
      "url": "string",
      "weakness": "string",
      "signal": "string"
    }
  ],
  "gap": "string",
  "clock": "string",
  "pattern_confidence": "string",
  "graph_size": "number"
}
```

**Timeout:** 120 seconds. Return whatever has completed if timeout is hit.

### `GET /api/graph/stats`
```json
{
  "total_ideas_searched": 14,
  "unique_failure_patterns": 6
}
```

---

## Backboard Integration

```javascript
// backend/lib/backboard.js

async function storeIdeaResult(idea, result) {
  const node = {
    type: 'idea_search',
    idea_text: idea,
    failure_signals: result.timeline
      .filter(e => e.cause_of_death && e.cause_of_death !== 'no public record of continuation')
      .map(e => e.cause_of_death),
    turn_sentence: result.turn_sentence,
    gap: result.gap,
    timestamp: new Date().toISOString()
  };
  return await backboardClient.graph.addNode(node);
}

async function queryAdjacentIdeas(idea) {
  const similar = await backboardClient.graph.semanticSearch({
    query: idea,
    top_k: 10,
    filter: { type: 'idea_search' }
  });

  const allSignals = similar.results.flatMap(r => r.node.failure_signals || []);
  const freq = buildFrequencyMap(allSignals);
  const topSignal = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

  return {
    adjacent_ideas: similar.results.map(r => r.node.idea_text),
    recurring_failure: topSignal ? topSignal[0] : null,
    graph_size: similar.total_nodes || 0
  };
}

function buildFrequencyMap(arr) {
  return arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}
```

---

## Gemini Integration

```javascript
// backend/lib/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function searchAndReason(prompt, systemPrompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    tools: [{ googleSearch: {} }],
    systemInstruction: systemPrompt
  });
  const result = await model.generateContent(prompt);
  return { text: result.response.text() };
}

async function reasonOnly(prompt, systemPrompt) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt
  });
  const result = await model.generateContent(prompt);
  return { text: result.response.text() };
}

function safeParseJSON(text) {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON parse failed:', text.slice(0, 200));
    return null;
  }
}

module.exports = { searchAndReason, reasonOnly, safeParseJSON };
```

---

## Frontend Specification

### Aesthetic Direction

**Monolithic. Funereal. Still.**

This is not a dashboard. It is not a tool. It is a place you visit. The aesthetic should feel like standing somewhere quiet and old — not gothic, not playful, not startup-y. Still. Heavy. Respectful of the dead.

- **Fonts:**
  - `Playfair Display` — headings, the turn sentence, final stone entry. Serif. Weight of history.
  - `IBM Plex Mono` — years, labels, the loading line, cause of death. Monospace. Clinical record.
  - `IBM Plex Sans` — body text, gap paragraph, competitor lines.

- **Colors:**
```css
--bg: #080808;
--surface: #101010;
--border: #1e1e1e;
--text-primary: #e8e8e0;
--text-secondary: #666660;
--text-faint: #333330;
--accent: #c8b882;        /* aged parchment — the "you are here" color */
--alive: #4a7c59;         /* muted green — still breathing */
--dead: #444440;          /* grey — gone */
--turn: #e8e0d0;          /* slightly warmer — the sentence that matters */
--final: #c8b882;         /* same as accent — your name */
```

- **Layout:** Single centered column, max-width 640px. Generous vertical padding. Nothing competes for attention. The page breathes slowly.

- **No borders on cards.** No rounded corners. No shadows. Sections are separated by whitespace and typography alone.

- **Cursor:** Default. Nothing cute.

---

### Component Breakdown

#### `SearchInput`
The only thing on the page at load. Centered vertically and horizontally.

```
        HEADSTONE

  Every idea has a history.
  Most of it is buried.

  [ describe your idea...              ]
```

- Input: full width, IBM Plex Mono, no border (just a bottom line), no background
- On submit: input fades out, LoadingState fades in
- No button visible — submit on Enter only

#### `LoadingState`
Replaces the search input. Centered on page.

```
  searching the graveyard...
```

Single line. IBM Plex Mono. Secondary color. No animation except a slow opacity pulse (2s cycle). Nothing else on the page. The user waits. The system works.

This stays visible until ALL five agents complete and the full JSON is returned.

#### `GraveyardScene`
The main component. Receives the complete result JSON. Orchestrates the entire narrative reveal via `useNarrativeReveal`.

Renders nothing until the reveal sequence begins. Each child component is passed a `visible` prop — when false, it renders as `opacity: 0`. Transitions to `opacity: 1` only when the reveal sequence reaches that component.

Never unmounts components once revealed. The full graveyard stays on screen as the story builds.

#### `GraveNames` — Act 1
Shows only the names and years. No causes of death yet.

```
  2018  ·  MindLog
  2019  ·  ReflectAI
  2020  ·  ThoughtSpace
  2022  ·  JournalBot
  2023  ·  Reflectly                              [alive]
  2024  ·  Jour                                   [alive]
```

- Year: IBM Plex Mono, faint color
- Name: IBM Plex Sans, primary color, normal weight
- [alive] tag: small, muted green, monospace
- All names appear simultaneously as a group — not staggered
- After appearance: 1200ms pause before Act 2 begins

#### `GraveEntry` — Act 2
The inscription version of each entry. Replaces the name-only row — or rather, the name-only row is the initial state and the inscription fades in below it.

```
  2018  ·  MindLog
          Built for HackMIT. 200 users week one.
          Died: nobody came back after day 3.
          ↗ devpost.com/software/mindlog
```

- `what_was_built`: IBM Plex Mono, secondary color, small
- `cause_of_death`: prefixed with "Died: ", IBM Plex Mono, slightly lighter than secondary
- Source link: accent color, tiny, optional
- Low confidence entries: cause_of_death prefixed with `~` and rendered in faint color

Each inscription fades in individually with 800ms between each entry. The previous entry's inscription must be fully visible before the next begins.

After the last inscription: **2000ms of silence.** Nothing happens. The user sits with the full graveyard.

#### `TurnLine` — The Turn
The single most important element in the UI.

```
        They all died on the same day.
```

- Centered on the page
- Playfair Display, 1.6rem, `--turn` color
- Appears after the 2000ms silence
- Fade in over 600ms — slower than everything else
- After appearance: 1200ms pause before Act 3 begins

If `pattern_confidence === 'insufficient_data'`, the turn_sentence falls back to:
*"The pattern is still emerging."*
Rendered in secondary color instead of turn color — honest about what the system knows.

#### `LivingSection` — Act 3
Compressed. Almost dismissive. These people exist but the story is not about them.

```
  Still breathing

  Reflectly  ↗     "I always forget to open it."
  Daylio     ↗     Habit tracking, not reflection.
  Jour       ↗     Premium pivot, left SMB behind.
```

- Section label: "Still breathing" in small caps, faint color
- Each competitor: one line. Name + weakness or user complaint
- No cards. No borders. Just lines.
- Entire section fades in as one block after the TurnLine pause

#### `GapSection`
One paragraph. Left border in accent color. Nothing else.

```
  │  Nobody built the version that fits into
     something you already do. Every funded
     player went upmarket. The person using
     the Notes app on their phone and feeling
     bad about it — nobody finished that idea.
```

- Left border: 2px solid `--accent`
- Padding left: 1.5rem
- IBM Plex Sans, 1rem, primary color
- Section label above: "the gap" in small caps, faint
- Fades in after LivingSection settles (800ms after LivingSection appears)

#### `ClockLine`
One sentence. Alone.

```
  You have roughly 8 months.
```

- IBM Plex Mono, 0.9rem, secondary color
- No label
- Appears 1200ms after GapSection
- After appearance: **1500ms of silence**

#### `FinalStone`
The last thing on the page. The ending.

```
  2026

  YOU
```

- Year: IBM Plex Mono, 0.8rem, faint color
- Name: Playfair Display, 2.2rem, `--final` color (accent/parchment)
- Separated from everything above by significant whitespace (80px minimum)
- Fade in over 1000ms — the slowest reveal on the page
- After it appears: nothing. No button. No prompt. The cursor blinks in the input field if it has been refocused — but nothing is said.

The page ends here.

---

## Rendering Sequence — Critical

This is the exact timed sequence `useNarrativeReveal` must implement. Deviating from these timings breaks the narrative.

```
t=0ms       LoadingState disappears
t=0ms       GraveyardScene mounts
t=200ms     GraveNames appears (all names at once, no stagger)

t=1400ms    First GraveEntry inscription fades in (entry 0)
t=2200ms    Second GraveEntry inscription fades in (entry 1)
t=3000ms    Third GraveEntry inscription fades in (entry 2)
            ... continues at 800ms intervals for all entries ...
t=N ms      Last inscription fades in

t=N+2000ms  TurnLine fades in (the 2 second silence)

t=N+2600ms  LivingSection fades in

t=N+3400ms  GapSection fades in

t=N+4600ms  ClockLine fades in

t=N+6100ms  FinalStone fades in (1500ms after ClockLine)
```

Where N = 1400 + (number_of_timeline_entries * 800)

**All timings are from page reveal start (t=0), not from component mount.**

**Implementation:**

```javascript
// frontend/src/hooks/useNarrativeReveal.js
import { useState, useEffect } from 'react';

export function useNarrativeReveal(data) {
  const [revealed, setRevealed] = useState({
    graveNames: false,
    inscriptions: [],      // array of booleans, one per timeline entry
    turnLine: false,
    living: false,
    gap: false,
    clock: false,
    finalStone: false
  });

  useEffect(() => {
    if (!data) return;

    const entryCount = data.timeline.length;
    const timings = [];

    // t=200: names appear
    timings.push([200, () => setRevealed(r => ({ ...r, graveNames: true }))]);

    // t=1400 + (i * 800): each inscription
    data.timeline.forEach((_, i) => {
      const t = 1400 + (i * 800);
      timings.push([t, () => setRevealed(r => {
        const inscriptions = [...r.inscriptions];
        inscriptions[i] = true;
        return { ...r, inscriptions };
      })]);
    });

    const afterLastInscription = 1400 + (entryCount * 800);

    // 2000ms silence after last inscription
    timings.push([afterLastInscription + 2000, () =>
      setRevealed(r => ({ ...r, turnLine: true }))]);

    timings.push([afterLastInscription + 2600, () =>
      setRevealed(r => ({ ...r, living: true }))]);

    timings.push([afterLastInscription + 3400, () =>
      setRevealed(r => ({ ...r, gap: true }))]);

    timings.push([afterLastInscription + 4600, () =>
      setRevealed(r => ({ ...r, clock: true }))]);

    timings.push([afterLastInscription + 6100, () =>
      setRevealed(r => ({ ...r, finalStone: true }))]);

    // Schedule all timers
    const timeouts = timings.map(([delay, fn]) => setTimeout(fn, delay));

    return () => timeouts.forEach(clearTimeout);
  }, [data]);

  // Initialize inscriptions array when data arrives
  useEffect(() => {
    if (data) {
      setRevealed(r => ({
        ...r,
        inscriptions: new Array(data.timeline.length).fill(false)
      }));
    }
  }, [data]);

  return revealed;
}
```

---

### API Hook

```javascript
// frontend/src/hooks/useHeadstone.js
import { useState, useCallback } from 'react';

export function useHeadstone() {
  const [state, setState] = useState('idle'); // idle | loading | complete | error
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const search = useCallback(async (idea) => {
    setState('loading');
    setData(null);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea }),
          signal: AbortSignal.timeout(120000) // 2 minute timeout
        }
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const result = await response.json();
      setData(result);
      setState('complete');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  }, []);

  return { search, state, data, error };
}
```

---

## Team Task Breakdown

---

### Person 1 — Backend Lead
**Owns:** Entire backend, all five agents, Gemini integration, Backboard integration

**Hours 1–2: Foundation**
- [ ] Init Node.js + Express in `backend/`
- [ ] Set up `.env` — GEMINI_API_KEY, BACKBOARD_API_KEY, PORT=3001
- [ ] Build `gemini.js` — searchAndReason(), reasonOnly(), safeParseJSON()
- [ ] Build `backboard.js` — storeIdeaResult(), queryAdjacentIdeas()
- [ ] Build `server.js` skeleton — POST /api/search returns placeholder JSON
- [ ] Test: one Gemini search grounding call returns real Devpost results ✓

**Hours 3–5: Historian Agent (most critical)**
- [ ] Write HISTORIAN_PROMPT in prompts.js
- [ ] Build historian.js — takes Digger JSON, returns timeline with cause_of_death
- [ ] Test with hardcoded Digger output for "mental health journaling app"
- [ ] Iterate prompt until cause_of_death is specific and non-generic per entry
- [ ] Test with 3 different ideas — output must differ meaningfully each time

**Hours 6–8: Remaining Agents**
- [ ] Build digger.js — 4 parallel Gemini search calls, aggregated result
- [ ] Build landscape.js — competitor weakness extraction
- [ ] Build pattern.js — Backboard semantic query + turn_sentence generation
- [ ] Build synthesis.js — gap paragraph + clock sentence
- [ ] Wire all five in sequence in server.js

**Hours 9–11: Full Pipeline + Backboard Memory**
- [ ] Test end-to-end pipeline, fix JSON parse failures
- [ ] Implement graph storage after each synthesis completes
- [ ] Test cross-session: search idea A, then adjacent idea B
- [ ] Confirm idea B's pattern agent returns data enriched by idea A

**Hours 12–14: Robustness**
- [ ] Agent failure must not crash pipeline — empty fallback per agent
- [ ] 30s timeout per agent with fallback
- [ ] 120s overall timeout with partial result return
- [ ] GET /api/graph/stats endpoint
- [ ] Pre-run demo ideas 5 times each, save best results as JSON cache files

**Hours 15–18: Demo Cache**
- [ ] Build /api/demo endpoint that returns cached result for the prepared demo idea
- [ ] This is the offline fallback if WiFi dies during demo
- [ ] Confirm all three prepared demo ideas produce strong output

---

### Person 2 — Frontend Lead
**Owns:** Entire React frontend, narrative reveal, all animations, timing sequence

**Hours 1–2: Setup**
- [ ] Init Vite + React in `frontend/`
- [ ] Install Tailwind, configure custom CSS variables in globals.css
- [ ] Import fonts: Playfair Display, IBM Plex Mono, IBM Plex Sans via Google Fonts
- [ ] Build page shell — centered column, 640px max-width, dark background

**Hours 3–5: Core Components (with mock data)**
- [ ] SearchInput — centered, bottom-border only input, submit on Enter
- [ ] LoadingState — single pulsing line, nothing else
- [ ] GraveNames — names and years list, [alive] tags
- [ ] GraveEntry — name + inscription layout, confidence handling
- [ ] TurnLine — centered, Playfair Display, larger type

**Hours 6–8: Remaining Components**
- [ ] LivingSection — compressed competitor lines
- [ ] GapSection — left border, one paragraph
- [ ] ClockLine — single sentence, monospace
- [ ] FinalStone — year + name, Playfair Display, centered, large

**Hours 9–11: useNarrativeReveal Hook**
- [ ] Build the hook exactly as specced above
- [ ] Test timing sequence with mock data — walk through all timings
- [ ] Confirm 2000ms silence before TurnLine — do not shorten this
- [ ] Confirm 1500ms silence before FinalStone — do not shorten this
- [ ] Wire GraveyardScene to hook, confirm all visible props work

**Hours 12–14: API Integration**
- [ ] Build useHeadstone hook
- [ ] Connect to backend — loading state while waiting, full reveal on complete
- [ ] Test with real backend end-to-end
- [ ] Handle error state gracefully — "the search returned nothing. try a different idea."

**Hours 15–18: Polish**
- [ ] All fade transitions: CSS transition opacity 600ms ease, 1000ms for FinalStone
- [ ] Scroll behavior: page should auto-scroll gently as new elements appear
- [ ] Graph stats: tiny indicator at bottom "X ideas in the graph" — faint, monospace
- [ ] Mobile: readable on phone, no horizontal scroll
- [ ] Final visual pass — typography scale, spacing, everything breathing correctly

---

### Person 3 — Integration, Prompts & Demo
**Owns:** Prompt engineering, cross-team integration, demo preparation, QA

**Hours 1–3: Prompt Engineering**
- [ ] Write all five system prompts in prompts.js alongside Person 1
- [ ] HISTORIAN_PROMPT: must produce specific cause_of_death, not generic "team moved on"
- [ ] SYNTHESIS_PROMPT: gap must be a real paragraph, clock must be one sentence
- [ ] Pattern agent: turn_sentence must complete "they all died on the same day" — what was the day?
- [ ] Test each prompt in isolation via curl/Postman before wiring into agents

**Hours 4–6: Integration Testing**
- [ ] Test full backend pipeline as each agent is completed
- [ ] Document JSON schema mismatches — fix immediately
- [ ] Build test-pipeline.js script that runs 5 preset ideas and logs output quality
- [ ] Flag any Gemini JSON parse failures to Person 1 for prompt adjustment

**Hours 7–10: Demo Ideas**
- [ ] Run HEADSTONE against 10 different ideas
- [ ] Select 3 with the strongest output (good timeline depth, real cause_of_death, strong gap)
- [ ] Primary: "mental health journaling app"
- [ ] Confirm turn_sentence is strong for each — this is the make-or-break string
- [ ] Save cached JSON results for all 3 demo ideas

**Hours 11–14: Timing Validation**
- [ ] Walk through the full narrative reveal with Person 2
- [ ] Time the complete experience for the demo idea — how long from search to FinalStone?
- [ ] If total reveal time > 4 minutes for demo idea, reduce timeline entries to max 6
- [ ] Confirm 2000ms silence feels uncomfortable (good) not broken (bad)

**Hours 15–18: QA and Rehearsal**
- [ ] Full integration test — search input → loading → complete reveal
- [ ] Test offline fallback (disconnect WiFi, confirm /api/demo works)
- [ ] Run full demo experience 5 times end to end
- [ ] Write demo script, time it at 3 minutes
- [ ] Brief full team on demo flow

---

### Person 4 — Backboard Specialist & Pitch
**Owns:** Backboard graph depth, turn_sentence quality, pitch deck, hard judge questions

**Hours 1–3: Backboard Setup**
- [ ] Create Backboard account, apply promo code HUSKYHACKS26 in billing
- [ ] Read full Backboard API docs — understand semantic search, graph nodes, hot-swap
- [ ] Build and test backboard.js alongside Person 1
- [ ] Design node schema — what gets stored, what gets indexed for semantic recall
- [ ] Test: store 3 nodes manually, run semantic search, confirm relevant recall

**Hours 4–7: Turn Sentence Quality**
- [ ] The turn_sentence is the most important output in the system
- [ ] Work with Person 3 to test and iterate the Pattern agent prompt
- [ ] The sentence must be specific: not "retention was hard" but "every team solved acquisition and lost people in week two"
- [ ] Test turn_sentence quality across 10 different idea inputs
- [ ] Build fallback: if Backboard has < 5 nodes, derive turn_sentence from Historian's most common cause_of_death

**Hours 8–11: Pre-load the Graph**
- [ ] Manually seed the Backboard graph with 15-20 idea searches before the demo
- [ ] Use a mix of adjacent ideas: journaling apps, productivity tools, habit trackers, note-taking apps
- [ ] This ensures the Pattern agent has real data to work with during the demo
- [ ] Confirm that a new search for "mental health journaling app" returns enriched cross-idea pattern

**Hours 12–15: Pitch Deck**
5 slides maximum. Minimal. The demo is the pitch.

- Slide 1: A single Devpost screenshot. A graveyard of mental health apps. No text except "they didn't know about each other."
- Slide 2: The HEADSTONE interface. The timeline. "2026 — YOU."
- Slide 3: How it works — agent pipeline diagram, Backboard graph visual
- Slide 4: The memory is the product — graph compounds, cross-session patterns, what this becomes at 1000 searches
- Slide 5: The story HEADSTONE told about itself — we searched "hackathon idea validator" before building this. Here's what it found.

**Hours 16–18: Hard Questions Prep**
Prepare sharp answers for:

- *"Isn't this just Perplexity?"*
  Perplexity doesn't know Devpost. It doesn't understand that a repo with no commits is a failure signal. It doesn't accumulate memory across sessions. And it doesn't structure its output as a story — it gives you a list. HEADSTONE gives you a graveyard.

- *"How do we know the memory is doing real work?"*
  Show the graph stats. Show two adjacent searches. Show that the second search's turn_sentence references patterns from the first. The cross-idea insight in the second result didn't come from Google — it came from the graph.

- *"What if Gemini makes things up?"*
  Every timeline entry has a source URL and a confidence indicator. Low confidence entries are visually marked. We're honest about what we know and what we're inferring. The honest version of this is more useful than the confident wrong version.

- *"What's the actual path to a product?"*
  Every student at every hackathon everywhere is the user. Devpost has 500,000+ projects. The graph gets richer every time someone searches. At 10,000 searches, the Pattern agent is surfacing insights that no human researcher could find manually. That's the product.

---

## Environment Variables

```bash
# backend/.env
GEMINI_API_KEY=your_gemini_api_key_here
BACKBOARD_API_KEY=your_backboard_api_key_here
PORT=3001
NODE_ENV=development

# frontend/.env
VITE_API_URL=http://localhost:3001
```

---

## Hour-by-Hour Timeline

```
Hour 1–2    APIs connected, skeleton running, test search works
Hour 3–5    Historian agent nailed — cause_of_death is specific
Hour 6–8    All five agents wired, end-to-end complete JSON returned
Hour 9–11   Backboard memory working, cross-session confirmed
            Frontend: all components built against mock data
Hour 12–14  useNarrativeReveal hook complete, timing sequence working
            Full integration: real backend → frontend reveal
Hour 15–17  Demo ideas pre-loaded, graph seeded, cache built
            Visual polish, timing validation, mobile check
Hour 18–20  Full demo experience rehearsed x3
            Pitch deck done
Hour 21–22  Final QA, offline fallback tested
Hour 23–24  Rest. Nothing new after hour 22.
```

---

## Demo Preparation

### Primary Demo Input
**`"mental health journaling app"`**

This works because: dozens of Devpost submissions confirmed, clear failure pattern (day 3-4 retention drop), live competitors with known weaknesses, documented gap (habit integration), and the turn_sentence writes itself.

### Backup Inputs
- `"AI tool that helps people remember what they read"`
- `"peer-to-peer tutoring platform for university students"`

### Demo Script (3 minutes)

**[0:00]** Type "mental health journaling app" into the input. Hit enter.

*"HEADSTONE searches Devpost — 47,000 hackathon projects — GitHub, Product Hunt, and the web. It collects everything silently. You wait."*

Ambient loading line pulses.

**[0:30]** Loading disappears. Names appear.

*"Here's everyone who tried this."*

Let the names sit. Don't talk. Let the judges count them.

**[0:45]** Inscriptions begin fading in, one by one.

*"Here's what happened to each of them."*

Read one inscription aloud as it appears. Let the rest arrive in silence.

**[1:30]** The 2000ms silence. Say nothing. Let it land.

**[1:32]** The turn sentence appears.

Read it aloud. Pause after it.

**[1:40]** Living section, gap, clock appear in sequence.

*"Here's who's alive. Here's the gap they all left. Here's how long you have."*

**[1:55]** The 1500ms silence before the final stone.

Say nothing.

**[2:00]** "2026 — YOU" appears.

Two full seconds of silence.

**[2:05]** *"That's the story of this idea. It was always there. Written across a hundred Devpost pages and abandoned repos, waiting for someone to read all of it at once. HEADSTONE read it in 90 seconds."*

**[2:20]** *"The reason this isn't a chatbot: every search tonight adds to a shared graph. The next team that searches something adjacent gets a result enriched by what we found. By the end of tonight, HEADSTONE knows things about the idea landscape in this room that no search engine knows."*

*"That's Backboard. That's what makes this infrastructure, not a demo."*

**[2:40]** Open to questions.

### Offline Fallback
If WiFi fails: the frontend can hit `/api/demo` which returns the cached result JSON for the primary demo idea. The full narrative reveal plays from cached data. Practice this version once.

---

## Devin Prompt

*Copy this verbatim when initializing Devin.*

---

```
Build HEADSTONE — a full-stack web application that researches hackathon idea history
and presents it as a three-act narrative experience.

CRITICAL UPFRONT: This is NOT a dashboard. Do not build a dashboard.
The app collects all data silently, then reveals it as a timed narrative sequence.
Read the rendering sequence section carefully before writing any frontend code.

---

## What HEADSTONE does

A user types a hackathon idea. HEADSTONE runs five agents, waits for ALL of them
to complete, then returns a single JSON response. The frontend then orchestrates
a timed narrative reveal — a three-act story that ends with the user's name as
the last entry on a timeline of everyone who tried this idea before them.

---

## Tech Stack

Backend: Node.js + Express
Frontend: React 18 + Vite + Tailwind CSS
AI: Google Gemini 2.0 Flash with Google Search grounding
Memory: Backboard.io graph API
Communication: Standard HTTP — POST request, wait, single JSON response.
NO SSE. NO STREAMING. Single complete response only.

---

## Repository Structure

headstone/
  backend/
    server.js
    agents/
      digger.js
      historian.js
      landscape.js
      pattern.js
      synthesis.js
    lib/
      gemini.js
      backboard.js
      prompts.js
    package.json
  frontend/
    src/
      App.jsx
      components/
        SearchInput.jsx
        LoadingState.jsx
        GraveyardScene.jsx
        GraveNames.jsx
        GraveEntry.jsx
        TurnLine.jsx
        LivingSection.jsx
        GapSection.jsx
        ClockLine.jsx
        FinalStone.jsx
      hooks/
        useHeadstone.js
        useNarrativeReveal.js
      styles/
        globals.css
    index.html
    package.json
  .env
  README.md

---

## Backend

### server.js

Express on port 3001. CORS enabled. Two endpoints:

POST /api/search
  Body: { idea: string }
  Runs agents in this order: digger first, then historian + landscape in parallel,
  then pattern, then synthesis.
  Waits for ALL agents to complete.
  Returns single JSON object (schema below).
  Overall timeout: 120 seconds — return partial result if hit.
  Agent timeout: 30 seconds per agent — return empty fallback if hit.
  Agent failure must never crash the pipeline.

GET /api/graph/stats
  Returns: { total_ideas_searched: number, unique_failure_patterns: number }

GET /api/demo
  Returns: cached JSON result for "mental health journaling app"
  This is a hardcoded fallback for offline demo use.
  Store the cached result as a JSON file in backend/cache/demo.json
  Populate this file by running the search once and saving the result.

Complete response schema for POST /api/search:
{
  "idea": "string",
  "timeline": [
    {
      "year": number,
      "title": "string",
      "what_was_built": "string",
      "cause_of_death": "string",
      "source_url": "string",
      "is_alive": boolean,
      "confidence": "high | medium | low"
    }
  ],
  "turn_sentence": "string",
  "competitors": [
    {
      "name": "string",
      "url": "string",
      "weakness": "string"
    }
  ],
  "gap": "string",
  "clock": "string",
  "pattern_confidence": "high | medium | low | insufficient_data",
  "graph_size": number
}

### lib/gemini.js

Two functions:
searchAndReason(prompt, systemPrompt) — gemini-2.0-flash with googleSearch tool
reasonOnly(prompt, systemPrompt) — gemini-2.0-flash without search
safeParseJSON(text) — strips markdown fences, parses JSON, returns null on failure
All calls: 3 retries with exponential backoff on rate limit errors.

### lib/backboard.js

storeIdeaResult(idea, result) — stores node with type, idea_text, failure_signals array, turn_sentence, gap, timestamp
queryAdjacentIdeas(idea) — semantic search top_k=10, returns { adjacent_ideas, recurring_failure, graph_size }
Both functions return graceful fallback (null/empty) if Backboard is unavailable.

### lib/prompts.js

Export named constants: DIGGER_PROMPT, HISTORIAN_PROMPT, LANDSCAPE_PROMPT, PATTERN_PROMPT, SYNTHESIS_PROMPT

HISTORIAN_PROMPT must instruct:
- Return ONLY valid JSON, no markdown fences
- For each result extract: year, title, what_was_built, how_far, cause_of_death, source_url, is_alive, confidence
- cause_of_death must be specific — not "team moved on" but WHY they stopped
- If cause is unknown: use "no public record of continuation"
- Never fabricate specific facts
- Order chronologically

SYNTHESIS_PROMPT must instruct:
- Return ONLY valid JSON with fields: gap (string), clock (string)
- gap: one paragraph, no bullet points, no headers, written for a person about to spend their weekend on this
- clock: exactly one sentence

### agents/digger.js

4 parallel Gemini searchAndReason calls:
1. "site:devpost.com " + idea — hackathon submissions
2. "site:github.com " + idea + " hackathon" — repos
3. "site:producthunt.com " + idea — live products
4. idea + " startup shutdown OR postmortem OR \"lessons learned\"" — failure signals

Returns combined: { devpost_results, github_results, live_products, web_signals }
Each item has at minimum: title, url, description/snippet.

### agents/historian.js

Takes diggerResult + idea.
One Gemini searchAndReason call with HISTORIAN_PROMPT.
Parse response with safeParseJSON.
Returns { timeline: [...], data_quality_note: string }
On parse failure: return { timeline: [], data_quality_note: "parse error" }

### agents/landscape.js

Takes diggerResult.live_products + idea.
One Gemini searchAndReason call with LANDSCAPE_PROMPT.
Returns { competitors: [{ name, url, weakness, signal }] }
Max 4 competitors.

### agents/pattern.js

Takes idea + historianResult.
Calls backboard.queryAdjacentIdeas(idea).
If graph_size < 5: derive turn_sentence from most common cause_of_death in historian timeline.
Otherwise: use Backboard recurring_failure to construct turn_sentence.
Returns { turn_sentence, recurring_failure, cross_idea_insight, graph_size, pattern_confidence }

turn_sentence construction:
- It must be a single sentence that names the specific failure mode
- It will be displayed prominently as "They all died on the same day." equivalent
- Good example: "Every attempt reached traction and collapsed when users had no reason to return."
- Bad example: "The pattern shows retention issues were common."

### agents/synthesis.js

Takes idea + historianResult + landscapeResult + patternResult.
Calls Gemini reasonOnly with SYNTHESIS_PROMPT.
Returns { gap: string, clock: string }

---

## Frontend

### Styling — globals.css

CSS variables:
  --bg: #080808
  --surface: #101010
  --border: #1e1e1e
  --text-primary: #e8e8e0
  --text-secondary: #666660
  --text-faint: #333330
  --accent: #c8b882
  --alive: #4a7c59
  --turn: #e8e0d0
  --final: #c8b882

Google Fonts import (add to index.html):
  Playfair Display: 400, 700
  IBM Plex Mono: 400, 600
  IBM Plex Sans: 400

Body: background var(--bg), color var(--text-primary), font IBM Plex Sans.
* { box-sizing: border-box; margin: 0; padding: 0; }

### App.jsx

Three states: idle | loading | complete

idle: render SearchInput centered on page (vertically and horizontally)
loading: render LoadingState centered on page
complete: render GraveyardScene with full data

Uses useHeadstone hook.
When search(idea) called: state → loading.
When data returns: state → complete, pass data to GraveyardScene.

### SearchInput.jsx

Centered vertically and horizontally in viewport.
Layout (centered column):
  "HEADSTONE" — Playfair Display, 2.5rem, --accent color
  gap: 16px
  "Every idea has a history." — IBM Plex Sans, 0.9rem, --text-secondary
  "Most of it is buried." — IBM Plex Sans, 0.9rem, --text-secondary
  gap: 40px
  input field — IBM Plex Mono, 1rem, full width max 480px
    border: none
    border-bottom: 1px solid var(--border)
    background: transparent
    color: var(--text-primary)
    padding: 8px 0
    outline: none
    placeholder: "describe your idea..."

Submit on Enter key only. No button.
On submit: calls search(idea), clears input.

### LoadingState.jsx

Centered vertically and horizontally in viewport.
Single line: "searching the graveyard..."
IBM Plex Mono, 0.9rem, --text-secondary
CSS animation: opacity pulses between 0.4 and 1.0 over 2s ease-in-out infinite.
Nothing else on the page.

### hooks/useHeadstone.js

state: 'idle' | 'loading' | 'complete' | 'error'
data: null | complete response JSON
error: null | string

search(idea) async function:
  setState loading
  POST to VITE_API_URL + /api/search
  Body: { idea }
  Timeout: 120000ms (AbortSignal.timeout)
  On success: setData(result), setState complete
  On error: setError(message), setState error

Export: { search, state, data, error }

### hooks/useNarrativeReveal.js

Takes data (the complete JSON result).
Returns revealed object: { graveNames, inscriptions, turnLine, living, gap, clock, finalStone }
inscriptions is an array of booleans, one per timeline entry.

Timing sequence (all times from when hook receives data):
  t=200ms: graveNames = true
  t=1400ms: inscriptions[0] = true
  t=2200ms: inscriptions[1] = true
  t=3000ms: inscriptions[2] = true
  ... continues at 800ms intervals ...
  t = 1400 + (N * 800) where N = timeline.length: last inscription
  t = lastInscription + 2000ms: turnLine = true  (THE 2 SECOND SILENCE — DO NOT SHORTEN)
  t = lastInscription + 2600ms: living = true
  t = lastInscription + 3400ms: gap = true
  t = lastInscription + 4600ms: clock = true
  t = lastInscription + 6100ms: finalStone = true  (1500ms after clock — DO NOT SHORTEN)

Use setTimeout for all timings. Clean up with clearTimeout on unmount.

### GraveyardScene.jsx

Props: { data }
Uses useNarrativeReveal(data).
Renders a centered column, max-width 640px, padding 80px 24px.

Renders all components. Each has opacity 0 unless its revealed flag is true.
CSS transition: opacity 600ms ease for all except FinalStone (1000ms ease).

Layout order (top to bottom):
  GraveNames (receives timeline, revealed.graveNames, revealed.inscriptions)
  — 80px spacer —
  TurnLine (receives turn_sentence, revealed.turnLine)
  — 60px spacer —
  LivingSection (receives competitors, revealed.living)
  — 60px spacer —
  GapSection (receives gap, revealed.gap)
  — 40px spacer —
  ClockLine (receives clock, revealed.clock)
  — 120px spacer —
  FinalStone (revealed.finalStone)

Never unmount a component once it has been revealed.
Auto-scroll: when each component becomes visible, smoothly scroll to bring it into view.
Use useEffect watching each revealed flag — when it becomes true, scroll element into view
with behavior: 'smooth', block: 'center'.

### GraveNames.jsx

Props: { timeline, showNames, inscriptions }

Renders each timeline entry.
showNames controls visibility of the entire list (opacity transition).

For each entry:
  If inscriptions[i] is false: show name-only row
  If inscriptions[i] is true: show full entry with inscription

Name-only row:
  flex row, space-between
  left: year (IBM Plex Mono, 0.8rem, --text-faint) + "·" + title (IBM Plex Sans, 1rem, --text-primary)
  right: "[alive]" if is_alive (IBM Plex Mono, 0.7rem, --alive) — empty otherwise
  margin-bottom: 12px

Full entry (when inscription revealed):
  same name row as above
  below it, indented 2rem:
    what_was_built — IBM Plex Mono, 0.8rem, --text-secondary, margin-bottom 4px
    "Died: " + cause_of_death — IBM Plex Mono, 0.8rem, --text-faint
      if confidence === 'low': prefix with "~"
      if is_alive: do not show "Died:" line
    source link if available — --accent, 0.7rem, IBM Plex Mono
  margin-bottom: 24px

The inscription content appears with opacity transition when inscriptions[i] becomes true.

### TurnLine.jsx

Props: { sentence, visible }
Centered text. Playfair Display, 1.5rem, --turn color.
No label. No border. Just the sentence.
Opacity transition on visible prop.

### LivingSection.jsx

Props: { competitors, visible }
Label: "still breathing" — IBM Plex Mono, 0.7rem, --text-faint, small caps, margin-bottom 16px
Each competitor: one line
  name (IBM Plex Sans, 0.9rem, --text-primary) + "↗" link + weakness (--text-secondary, italic)
  margin-bottom 8px
Compressed. No cards. No borders.

### GapSection.jsx

Props: { gap, visible }
Label: "the gap" — IBM Plex Mono, 0.7rem, --text-faint, small caps, margin-bottom 12px
Left border: 2px solid --accent
Padding-left: 1.5rem
Gap text: IBM Plex Sans, 1rem, --text-primary, line-height 1.7

### ClockLine.jsx

Props: { clock, visible }
IBM Plex Mono, 0.85rem, --text-secondary
No label. Just the sentence.

### FinalStone.jsx

Props: { visible }
Centered.
"2026" — IBM Plex Mono, 0.8rem, --text-faint, margin-bottom 16px
"YOU" — Playfair Display, 2.5rem, --final color
Opacity transition: 1000ms ease (slower than everything else).
Nothing after this component. The page ends here.

---

## Critical Requirements

1. NO SSE. NO STREAMING. The backend returns one complete JSON response. The frontend waits.
2. The frontend MUST NOT render anything from the result until ALL data is received.
3. The 2000ms silence before TurnLine is not a bug. Do not shorten it.
4. The 1500ms silence before FinalStone is not a bug. Do not shorten it.
5. FinalStone renders "YOU" — not the user's name, not their idea. Just "YOU".
6. Agent failures must never crash the pipeline. Return empty fallback and continue.
7. Backboard unavailability must never crash the app. Graceful fallback throughout.
8. safeParseJSON must strip markdown code fences before parsing.
9. turn_sentence must be a specific named failure mode, not a generic observation.
10. The page must work on mobile — single column, readable, no horizontal scroll.
11. Include README.md with: npm install instructions for both directories, .env setup, how to start backend (node server.js) and frontend (npm run dev), note about Backboard promo code HUSKYHACKS26.
12. Create backend/cache/ directory with an empty demo.json placeholder. Comment in GET /api/demo that this file should be populated by running the search once.
```

---

*Built for HuskyHacks 2026. The graveyard of ideas, finally visible.*
