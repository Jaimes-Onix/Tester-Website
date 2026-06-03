// Capture the Sights.html sticky scroll runway at specific progress points
// to verify frame progression + phase callouts. Usage: node scripts/shot-sights-scroll.mjs
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "temporary screenshots");

const URL = "http://localhost:3000/Sights.html";
const W = 1100, H = 720;

const browser = await puppeteer.launch({ headless: "shell" });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: "networkidle0" });

// wait for loader to finish (frames preloaded)
await page.waitForFunction(() => {
  const l = document.getElementById("loader");
  return l && l.classList.contains("done");
}, { timeout: 30000 });

// total scrollable height
const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
const heroH = await page.evaluate(() => window.innerHeight);
const stageTop = await page.evaluate(() => document.getElementById("stage").offsetTop);
const stageH = await page.evaluate(() => document.getElementById("stage").offsetHeight);

// progress p within the stage -> absolute scrollY
const at = (p) => stageTop + p * (stageH - heroH);

const shots = [
  { name: "p015-blueprint", y: at(0.15) },
  { name: "p38-rising", y: at(0.38) },
  { name: "p58-stats", y: at(0.58) },
  { name: "p85-realized", y: at(0.85) },
];

let n = 30;
for (const s of shots) {
  await page.evaluate((y) => window.scrollTo(0, y), s.y);
  await new Promise(r => setTimeout(r, 700)); // let phase transitions + counters settle
  const file = path.join(OUT, `screenshot-${n}-sights-${s.name}.png`);
  await page.screenshot({ path: file });
  console.log("Saved", file);
  n++;
}

await browser.close();
