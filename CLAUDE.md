# CLAUDE.md — Frontend Website Rules

## Repo Layout (monorepo, two deployments)
- **`client/`** — the React/Vite frontend (all UI, static pages, screenshot + image-gen tooling). Run frontend commands from here.
- **`server/`** — the Express API backend (`server.js`, `api/`, backend scripts). Deployed separately.
- Each folder has its own `package.json` and `.env.local`. All paths below are relative to `client/` unless noted.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Project Skills
- **`/tester-tech-page`** — recreates the Tester Tech smart-gadgets showcase at `client/public/TesterTech.html`, generating product images via Nano Banana/kie.ai (`client/scripts/generate-images.mjs`). Triggers: "recreate/rebuild/refresh the Tester Tech page". Won't auto-run (has side effects + API cost). Optional argument: a design tweak. Output: `client/public/TesterTech.html` + `client/public/generated/tester-*.png`.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.
- **Do NOT compare dynamic animation regions** (the 5s shader intro, the Three.js hero object, marquees, particle/count-up effects). They change every frame and will never match pixel-for-pixel — judge them by description, not diff. For deterministic comparison, capture in static mode (`SHOT_STATIC=1`, see below), which disables all motion.

## Local Server (React + Vite)
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Run from `client/`. Dev server: `npm run dev` (Vite, `http://localhost:3000`). Production check: `npm run build` then `npm run preview` (also `:3000`).
- The frontend's `/api/*` calls are proxied to the backend at `localhost:5000` in dev — start the backend too: `cd server && npm start`.
- Start it in the background before screenshots. If a server is already on `:3000`, reuse it — do not start a second instance (stop the stale one first if it's the old static `serve.mjs`).
- `serve.mjs` is legacy (static file server) and is NOT used for the React app — Vite handles dev/preview.

## Screenshot Workflow
- Puppeteer + Chrome headless-shell are installed locally in the `client/` project (`client/node_modules`, `~/.cache/puppeteer`). `client/screenshot.mjs` lives there — run it from `client/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000 [label] [width] [height]`
- Screenshots save to `client/temporary screenshots/screenshot-N[-label].png` (auto-incremented, never overwritten).
- **Live mode (default):** the script waits for the 5s intro overlay to finish, then auto-scrolls to trigger scroll-reveals, then captures full-page. Use this to see the real, animated site.
- **Static mode (`SHOT_STATIC=1 node screenshot.mjs ...`):** emulates `prefers-reduced-motion`, disabling the intro, 3D hero, marquee, and reveals — a deterministic capture **for reference comparison / visual diffs.**
- After screenshotting, read the PNG with the Read tool. Keep capture width ≤ 1000px (deviceScaleFactor doubles it) when you need to read fine detail; mobile (390) and narrow widths are easiest to inspect.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px". Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing. **Skip dynamic-animation regions (see Reference Images).**

## Output Defaults (current stack)
- **React 18 + TypeScript + Vite + Tailwind CSS (PostCSS).** Entry: `client/index.html` → `client/src/main.tsx` → `client/src/App.tsx`. Global/custom CSS in `client/src/index.css`; Tailwind theme in `client/tailwind.config.js`.
- Components live in `client/src/components/`; imperative motion (GSAP + Three.js) lives in the `useSiteEffects()` hook in `client/src/lib/effects.ts`. GSAP/Three are npm deps (not CDN).
- Build to static `client/dist/` via `npm run build` (from `client/`) — deploy `client/dist/` to any static host (Vercel/Netlify auto-detect Vite).
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`; real photos via Unsplash with an onerror fallback. Mobile-first responsive.

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
