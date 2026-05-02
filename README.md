# Scout

> Every idea has a history. Most of it is buried.

Scout researches the history of your hackathon idea and presents it as a three-act narrative experience. Type an idea, wait, and walk through the graveyard of everyone who tried it before you.

## How It Works

1. You type a hackathon idea
2. Five AI agents research its history silently
3. A timed narrative reveals the graveyard — names, causes of death, patterns, and your place at the end

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React 18 + Vite + Tailwind CSS
- **AI:** Google Gemini 2.0 Flash with Google Search grounding
- **Memory:** Backboard.io graph API

## Setup

### 1. Environment Variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
GEMINI_API_KEY=your_gemini_api_key
BACKBOARD_URL=https://api.backboard.io
BACKBOARD_TOKEN=your_backboard_token
```

**Backboard promo code:** `HUSKYHACKS26`

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Start the App

**Backend** (from `backend/` directory):

```bash
node server.js
```

Runs on `http://localhost:3001`.

**Frontend** (from `frontend/` directory):

```bash
npm run dev
```

Runs on `http://localhost:5173`.

### 4. Demo Mode

The backend has a `GET /api/demo` endpoint that returns cached results for "mental health journaling app". To populate it:

1. Run a search for "mental health journaling app" via the app
2. Save the result to `backend/cache/demo.json`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Run full agent pipeline for an idea |
| GET | `/api/graph/stats` | Get Backboard graph statistics |
| GET | `/api/demo` | Get cached demo result |

## Architecture

```
User Input → POST /api/search
  → Digger (4 parallel searches)
  → Historian + Landscape (parallel)
  → Pattern (Backboard memory)
  → Synthesis
  → Single JSON response
  → Timed narrative reveal on frontend
```

## Project Structure

```
headstone/
  backend/
    server.js          # Express server
    agents/            # Five research agents
    lib/               # Gemini, Backboard, prompts
    cache/             # Demo data cache
  frontend/
    src/
      App.jsx          # Root component
      components/      # Narrative UI components
      hooks/           # useHeadstone, useNarrativeReveal
      styles/          # CSS variables and globals
```
