import { mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Usage: node screenshot.mjs <url> [label] [width] [height]
//   SHOT_STATIC=1  -> emulate prefers-reduced-motion: capture the STATIC page
//                     (no 5s intro, no 3D, no marquee) for deterministic visual diffs.
//   default        -> live capture; waits for the intro overlay to finish first.
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const width = parseInt(process.argv[4] || '1440', 10);
const height = parseInt(process.argv[5] || '900', 10);
const STATIC = process.env.SHOT_STATIC === '1';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SHOT_DIR = join(ROOT, 'temporary screenshots');

let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  console.error('Puppeteer not installed. Run: npm install puppeteer');
  process.exit(1);
}

await mkdir(SHOT_DIR, { recursive: true });

// Auto-increment: screenshot-N.png (never overwrite)
let maxN = 0;
try {
  for (const f of await readdir(SHOT_DIR)) {
    const m = f.match(/^screenshot-(\d+)/);
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
  }
} catch {}
const n = maxN + 1;
const fileName = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath = join(SHOT_DIR, fileName);

const browser = await puppeteer.launch({
  headless: 'shell', // chrome-headless-shell avoids the Network.enable CDP flake
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 2 });

// Optionally disable all dynamic animation (intro shader, 3D hero, marquee, reveals)
// so screenshots are deterministic and safe to diff against a reference.
if (STATIC) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

// Live mode: wait for the 5s intro overlay to finish before capturing.
if (!STATIC) {
  await page
    .waitForFunction(
      () => { const l = document.getElementById('loader'); return !l || l.classList.contains('done') || getComputedStyle(l).display === 'none'; },
      { timeout: 9000 }
    )
    .catch(() => {});
}

// Scroll through the page to trigger scroll-reveal (IntersectionObserver) content,
// then return to top so the full-page capture shows everything revealed.
await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await sleep(120);
  }
  window.scrollTo(0, document.body.scrollHeight);
  await sleep(300);
  window.scrollTo(0, 0);
  await sleep(300);
});

// Let fonts/animations settle
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved ${outPath}`);
