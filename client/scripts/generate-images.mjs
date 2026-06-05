// scripts/generate-images.mjs
// Build-time image generation. Pulls images from either Gemini (direct, "Nano Banana")
// or kie.ai (aggregator), and downloads them into public/generated/ as static assets.
//
//   1. Add keys to .env.local:  GEMINI_API_KEY=...   and/or   KIE_API_KEY=...
//   2. npm run generate:images
//   3. Reference e.g. <img src="/generated/tester-watch-s9.png" /> in TesterTech.html
//
// Per job, set `provider`:
//   "gemini" → uses scripts/gemini.mjs  (direct, free tier, returns PNG bytes)
//   "kie"    → uses scripts/kie.mjs     (aggregator: also does video/other models)

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Buffer } from "node:buffer";
import { generateImage as geminiGenerate } from "./gemini.mjs";
import { generateImage as kieGenerate } from "./kie.mjs";

const OUT_DIR = new URL("../public/generated/", import.meta.url);

const JOBS = [
  {
    provider: "kie",
    file: "tester-watch-s9.png",
    model: "google/nano-banana", // Nano Banana, via kie.ai
    input: {
      prompt:
        "Premium studio product photograph of a sleek titanium smartwatch with a black always-on display, " +
        "floating on a soft warm-grey paper backdrop, dramatic soft shadow, editorial lighting, ultra sharp, 4k.",
      aspect_ratio: "4:3",
      output_format: "png",
    },
  },
  {
    provider: "kie",
    file: "tester-vision-glasses.png",
    model: "google/nano-banana",
    input: {
      prompt:
        "Minimalist studio product shot of modern smart glasses with thin matte-black frames, " +
        "on a warm off-white surface, soft directional light, premium consumer-tech aesthetic, 4k.",
      aspect_ratio: "4:3",
      output_format: "png",
    },
  },
  {
    provider: "kie",
    file: "tester-watch-active.png",
    model: "google/nano-banana",
    input: {
      prompt:
        "Studio product photograph of a lightweight sporty smartwatch with a vibrant rectangular display and a " +
        "coral silicone sport band, on a warm off-white paper backdrop, soft shadow, editorial lighting, 4k.",
      aspect_ratio: "4:3",
      output_format: "png",
    },
  },
  {
    provider: "kie",
    file: "tester-watch-se.png",
    model: "google/nano-banana",
    input: {
      prompt:
        "Studio product photograph of a minimalist everyday smartwatch with a clean round display and a woven " +
        "fabric band, on a warm off-white paper backdrop, soft shadow, premium consumer-tech look, 4k.",
      aspect_ratio: "4:3",
      output_format: "png",
    },
  },
  {
    provider: "kie",
    file: "tester-voice.png",
    model: "google/nano-banana",
    input: {
      prompt:
        "Studio product photo of a compact cylindrical smart speaker voice assistant with a soft fabric mesh body " +
        "and a glowing warm-orange light ring on top, dark charcoal backdrop with a subtle warm glow, premium, 4k.",
      aspect_ratio: "1:1",
      output_format: "png",
    },
  },
  {
    provider: "kie",
    file: "tester-buds.png",
    model: "google/nano-banana",
    input: {
      prompt:
        "Studio product photo of premium wireless earbuds resting in an open matte-white charging case, " +
        "on a warm off-white paper backdrop, soft shadow, editorial lighting, 4k.",
      aspect_ratio: "4:3",
      output_format: "png",
    },
  },
  {
    provider: "kie",
    file: "tester-sound.png",
    model: "google/nano-banana",
    input: {
      prompt:
        "Studio product photo of a modern cylindrical fabric-wrapped streaming speaker in warm grey, " +
        "on a warm off-white paper backdrop, soft shadow, premium consumer-tech aesthetic, 4k.",
      aspect_ratio: "4:3",
      output_format: "png",
    },
  },
  {
    provider: "kie",
    file: "tester-cam.png",
    model: "google/nano-banana",
    input: {
      prompt:
        "Studio product photo of a small sleek smart home security camera with a matte white body and black lens, " +
        "on a warm off-white paper backdrop, soft shadow, premium, 4k.",
      aspect_ratio: "4:3",
      output_format: "png",
    },
  },
  {
    provider: "kie",
    file: "tester-hub.png",
    model: "google/nano-banana",
    input: {
      prompt:
        "Studio product photo of a minimalist smart-home hub puck device with a matte finish and a single soft " +
        "status light, on a warm off-white paper backdrop, soft shadow, premium consumer-tech look, 4k.",
      aspect_ratio: "4:3",
      output_format: "png",
    },
  },
  // To use the direct Gemini path instead (needs billing enabled on the key):
  //   { provider: "gemini", file: "x.png", model: "gemini-2.5-flash-image", prompt: "…", aspectRatio: "4:3" }
];

await mkdir(OUT_DIR, { recursive: true });

for (const job of JOBS) {
  if (existsSync(new URL(job.file, OUT_DIR)) && !process.argv.includes("--force")) {
    console.log(`Skipping ${job.file} (already exists — pass --force to regenerate)`);
    continue;
  }
  process.stdout.write(`Generating ${job.file} via ${job.provider} … `);
  try {
    let bytes;
    if (job.provider === "gemini") {
      const { buffer } = await geminiGenerate(job.prompt, { model: job.model, aspectRatio: job.aspectRatio });
      bytes = buffer;
    } else {
      const [url] = await kieGenerate(job.model, job.input);
      if (!url) throw new Error("no result URL returned");
      bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
    }
    await writeFile(new URL(job.file, OUT_DIR), bytes);
    console.log(`✓ saved public/generated/${job.file}`);
  } catch (err) {
    console.log(`✗ ${err.message}`);
  }
}

console.log("Done.");
