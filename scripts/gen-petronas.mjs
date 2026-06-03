// One-off: generate Petronas Towers blueprint + final frames via kie.ai Nano Banana.
// Saves into public/generated/. Usage: node scripts/gen-petronas.mjs
import { generateImage } from "./kie.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "generated");
mkdirSync(OUT, { recursive: true });

const MODEL = "google/nano-banana";

const JOBS = [
  {
    name: "petronas-blueprint",
    prompt:
      "Architectural blueprint elevation of the Petronas Twin Towers in Kuala Lumpur. " +
      "Thin, crisp white and pale-cyan technical line-art / wireframe drawing on a solid pure black (#000000) background. " +
      "Straight-on front elevation: both identical tapered towers centered side by side, with the double-decker sky bridge connecting them at mid-height. " +
      "Full structure visible from base to spire tip with a small even margin around it. Faint dimension lines and small annotation callouts. " +
      "No shading, no fill, no photographic detail, no color other than white and pale-cyan lines. Perfectly symmetrical, centered, square composition.",
  },
  {
    name: "petronas-final",
    prompt:
      "Photorealistic but dark, moody night render of the fully built Petronas Twin Towers, Kuala Lumpur, " +
      "isolated on a solid pure black (#000000) background — building only, no sky, no city skyline, no ground, floating on black. " +
      "Straight-on front elevation matching a blueprint: both tapered stainless-steel-and-glass towers centered side by side, " +
      "double-decker sky bridge at mid-height, full structure from base to illuminated spire with a small even margin. " +
      "Facade catching subtle warm golden light and cool reflections, intricate Islamic eight-pointed-star geometry detailing, cinematic dramatic lighting. " +
      "Same framing and scale as the blueprint. Perfectly symmetrical, centered, square composition.",
  },
];

for (const job of JOBS) {
  console.log(`\n[${job.name}] requesting...`);
  const urls = await generateImage(MODEL, {
    prompt: job.prompt,
    aspect_ratio: "1:1",
    output_format: "png",
  });
  if (!urls.length) {
    console.error(`[${job.name}] no image returned`);
    continue;
  }
  const url = urls[0];
  const ext = (new URL(url).pathname.match(/\.(png|jpe?g|webp)$/i)?.[1] || "png").toLowerCase();
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = path.join(OUT, `${job.name}.${ext}`);
  writeFileSync(file, buf);
  console.log(`[${job.name}] saved -> public/generated/${job.name}.${ext}  (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log("\nDone.");
