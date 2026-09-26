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
| Backend (`backend`, FastAPI) | Render (not deployed yet) | `render.yaml` |

The frontend reads the backend URL from `VITE_API_URL` at build time. Until a backend is deployed and
`VITE_API_URL` is set in the Vercel project, the UI loads but the features that call the API
(simplify, learning and practice sessions) do not work.

To bring the backend up:

1. Render: New > Blueprint, pick this repo, apply `render.yaml`. Optionally set `GROQ_API_KEY`
   (without it, simplification uses the rule-based fallback).
2. Check `https://<service>.onrender.com/health` returns `{"status":"ok","version":"2.0"}`.
3. Vercel project `neuroread-final-main-everyhting`: Settings > Environment Variables, add
   `VITE_API_URL=https://<service>.onrender.com` (no trailing slash) for Production, then redeploy.

Notes: the backend uses SQLite (`./neuroadapt.db`) and writes TTS files to `backend/static/audio/`;
both are lost when a free Render instance restarts. The free instance also sleeps when idle, so the
first request after a pause can take ~1 minute.
