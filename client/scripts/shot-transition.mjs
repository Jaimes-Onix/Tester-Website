// One-off: capture the click-triggered transition states (not coverable by screenshot.mjs).
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const SHOT_DIR = join(fileURLToPath(new URL("../", import.meta.url)), "temporary screenshots");
const browser = await puppeteer.launch({
  headless: "shell",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) MAIN PAGE → trigger the gold iris wipe, capture mid-animation.
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await page.evaluate(() => { const l = document.getElementById("loader"); if (l) l.remove(); }); // skip 5s intro
await sleep(400);
await page.evaluate(() => document.getElementById("tester-tech")?.scrollIntoView());
await sleep(500);
// click the Explore Tester Tech link but block the real navigation so we can capture the overlay
await page.evaluate(() => {
  const a = [...document.querySelectorAll("a")].find((x) => /Explore Tester Tech/i.test(x.textContent || ""));
  a?.addEventListener("click", (e) => e.preventDefault(), { capture: true });
  a?.click();
});
await sleep(420); // mid-wipe
await page.screenshot({ path: join(SHOT_DIR, "screenshot-20-wipe.png") });

// 2) TESTER TECH → capture the arrival intro overlay before it dismisses.
const page2 = await browser.newPage();
await page2.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
await page2.goto("http://localhost:3000/TesterTech.html", { waitUntil: "domcontentloaded" });
await sleep(180); // before the load+360ms dismiss
await page2.screenshot({ path: join(SHOT_DIR, "screenshot-21-arrival.png") });

await browser.close();
console.log("Saved screenshot-20-wipe.png and screenshot-21-arrival.png");
