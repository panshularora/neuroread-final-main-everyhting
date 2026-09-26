# NeuroRead (deploy dump)

This folder is the frontend/backend snapshot that was pushed to Vercel.

**Canonical repo with the real README and architecture:** [panshularora/NEUROREAD](https://github.com/panshularora/NEUROREAD)

Live frontend: [neuroread-final-main-everyhting.vercel.app](https://neuroread-final-main-everyhting.vercel.app)

Adaptive reading assistant: simplify text, word-level TTS, BKT / IRT practice loop. FastAPI + React.

Please open NEUROREAD first. This repo exists so the Vercel deploy keeps building.

## Deployment

| Part | Where | Config |
|---|---|---|
| Frontend (`frontend/frontend`, Vite + React) | Vercel, auto-deploys on push to `main` | `vercel.json` (builds with `vite build`, serves `dist/` with SPA fallback) |
| Backend (FastAPI) | Render (not deployed yet) | deploy it from NEUROREAD's `render.yaml` (see below) |

`frontend/frontend` is kept in sync with the frontend in NEUROREAD. The `backend/` folder here is an
older snapshot and is missing endpoints the current frontend uses (practice games, session
analytics), so deploy the backend from NEUROREAD instead.

The frontend reads the backend URL from `VITE_API_URL` at build time. Until it is set, the site
loads and shows a "server isn't connected" notice; reading settings still work, but simplifying,
lessons, games and progress need the backend.

To bring the backend up:

1. Render: New > Blueprint, pick `panshularora/NEUROREAD`, apply its root `render.yaml`
   (service root `ai-accessibility-assistant-main/backend`). Set `CORS_ORIGINS` to
   `https://neuroread-final-main-everyhting.vercel.app`. `GROQ_API_KEY` is optional; without it,
   simplification uses the rule-based fallback.
2. Check `https://<service>.onrender.com/health` returns `{"status":"ok",...}`.
3. Vercel project `neuroread-final-main-everyhting`: Settings > Environment Variables, add
   `VITE_API_URL=https://<service>.onrender.com` (no trailing slash) for Production, then redeploy.

Notes: the backend uses SQLite by default (set `DATABASE_URL` for a persistent database) and writes
TTS files to `static/audio/`; both are lost when a free Render instance restarts. The free instance
also sleeps when idle, so the first request after a pause can take about a minute.
