import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "temporary screenshots");
const b = await puppeteer.launch({ headless: "shell" });
const p = await b.newPage();
await p.setViewport({ width: 1100, height: 760, deviceScaleFactor: 1 });
await p.goto("http://localhost:3000", { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 5500)); // wait out intro
await p.evaluate(() => document.getElementById("sights")?.scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 900));
const f = path.join(OUT, "screenshot-34-home-sights-section.png");
await p.screenshot({ path: f });
console.log("Saved", f);
await b.close();
