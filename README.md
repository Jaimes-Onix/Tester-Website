# Tester.io — Website

A modern Web3 / crypto landing page for **Tester.io**. Built with **React 18 + TypeScript + Vite + Tailwind CSS**, with GSAP scroll animations and a Three.js hero (gold-on-dark brand).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build & preview

```bash
npm run build      # outputs static site to dist/
npm run preview    # serve the production build at http://localhost:3000
```

## Deploy

This is a static Vite build — deploy the `dist/` folder to any static host.

- **Vercel / Netlify / Cloudflare Pages:** connect this repo. Build command `npm run build`, output directory `dist`. (Vite is auto-detected.)
- **GitHub Pages / S3 / any CDN:** upload the contents of `dist/`.

## Structure

```
index.html              Vite entry (fonts + before-paint anim/zoom scripts)
src/main.tsx            React entry
src/App.tsx             Full page (nav, hero, sections, footer)
src/index.css           Tailwind + custom styles
src/components/         UI components (ExpandingCards, …)
src/lib/effects.ts      Motion engine: GSAP + Three.js + intro + countdown
tailwind.config.js      Brand theme (night / gold palette, Montserrat)
brand_assets/           Tester.io brand guidelines + logo
```

## Tooling

- `screenshot.mjs` — Puppeteer screenshots → `temporary screenshots/`. `SHOT_STATIC=1` captures a motion-disabled (deterministic) shot for visual diffs.
- `CLAUDE.md` — workflow / asset / screenshot rules.
