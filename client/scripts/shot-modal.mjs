// One-off: open a product card and capture the detail modal.
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const SHOT_DIR = join(fileURLToPath(new URL("../", import.meta.url)), "temporary screenshots");
const browser = await puppeteer.launch({
  headless: "shell",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 820, deviceScaleFactor: 2 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto("http://localhost:3000/TesterTech.html", { waitUntil: "networkidle2" });
await sleep(800); // let the arrival overlay dismiss
await page.evaluate(() => document.querySelector('[data-product="s9"]')?.click());
await sleep(700); // modal animate in
await page.screenshot({ path: join(SHOT_DIR, "screenshot-22-modal.png") });

await browser.close();
console.log("Saved screenshot-22-modal.png");
