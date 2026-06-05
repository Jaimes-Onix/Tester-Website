# Tester.io — Website

A modern Web3 / crypto landing page for **Tester.io** (gold-on-dark brand), built as a **monorepo with
two independently-deployed apps**:

- **`client/`** — the React 18 + TypeScript + Vite + Tailwind frontend (GSAP scroll animations, Three.js
  hero, standalone pages, admin dashboard).
- **`server/`** — the Express API backend (contact welcome emails via Resend, admin dashboard API,
  newsletter CRUD on Supabase, optional Google Sheets writes).

## Develop (run both, in two terminals)

```bash
# Terminal 1 — backend API on :5000
cd server
npm install
npm start

# Terminal 2 — frontend on :3000 (proxies /api → :5000)
cd client
npm install
npm run dev        # http://localhost:3000
```

Copy `client/.env.example` → `client/.env.local` and `server/.env.example` → `server/.env.local`, then
fill in the values.

## Build & preview (frontend)

```bash
cd client
npm run build      # outputs static site to client/dist/
npm run preview    # serve the production build at http://localhost:3000
```

## Deploy — two Vercel projects (one repo)

Create **two** Vercel projects from this repo, each pointed at a different Root Directory:

| Project   | Root Directory | Type            | Key env vars |
|-----------|----------------|-----------------|--------------|
| Backend   | `server/`      | Node serverless | `DASHBOARD_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_*`, `GOOGLE_*` (optional), `CORS_ORIGIN` (optional) |
| Frontend  | `client/`      | Vite static     | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_SHEETS_URL`, `VITE_API_BASE_URL` (= the backend URL) |

**Deploy order matters** (each side needs the other's URL):
1. Deploy **backend** first → note its URL (e.g. `https://tester-api.vercel.app`).
2. Set the frontend's `VITE_API_BASE_URL` to that URL, and replace `<BACKEND_URL>` in
   `client/public/dashboard.html`.
3. Deploy **frontend**.
4. (Optional) Set the backend's `CORS_ORIGIN` to the frontend URL and redeploy to lock down CORS.

## Structure

```
client/
  index.html              Vite entry (fonts + before-paint anim/zoom scripts)
  src/main.tsx            React entry
  src/App.tsx             Full page (nav, hero, sections, footer)
  src/index.css           Tailwind + custom styles
  src/components/         UI components (ContactForm, ExpandingCards, …)
  src/lib/effects.ts      Motion engine: GSAP + Three.js + intro + countdown
  src/lib/supabase.ts     Browser Supabase client (anon key)
  public/                 Static pages (dashboard.html, TesterTech.html, …) + assets
  tailwind.config.js      Brand theme (night / gold palette, Montserrat)
  vercel.json             Vite static build config
server/
  server.js               Express API (contact, send-welcome, admin/*, newsletters)
  api/index.js            Vercel serverless entry (re-exports the Express app)
  scripts/                Backend utilities (send-followups, seed, mark-replied)
  docs/                   Google Sheets setup guide
  vercel.json             Node serverless config
brand_assets/             Tester.io brand guidelines + logo (shared)
```

## Tooling (frontend, run from `client/`)

- `screenshot.mjs` — Puppeteer screenshots → `client/temporary screenshots/`. `SHOT_STATIC=1` captures a
  motion-disabled (deterministic) shot for visual diffs.
- `CLAUDE.md` (repo root) — workflow / asset / screenshot rules.
