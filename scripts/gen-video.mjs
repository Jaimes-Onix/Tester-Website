// One-off: generate the Petronas blueprint->build transition video via kie.ai (Kling).
// Uploads the user's two frames, runs image-to-video (start + end frame), downloads result.
// Usage: node scripts/gen-video.mjs
import { generateImage, uploadBase64 } from "./kie.mjs";
import { readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");

const FIRST = path.join(PUBLIC, "First Frame Petronas Tower.png");  // blueprint
const LAST  = path.join(PUBLIC, "Second Frame Petronas Towers.png"); // finished
const OUT   = path.join(PUBLIC, "Petronas.mp4");

const PROMPT =
  "A smooth 5-second architectural build-up of the Petronas Twin Towers. The technical blueprint of the towers " +
  "gradually materializes and fills in — facade panels, windows, and the connecting sky bridge forming in place — " +
  "until it becomes the fully constructed, illuminated towers at night. Seamless morph from line drawing to finished building. " +
  "Locked-off static camera, centered, no camera movement, no zoom, no pan, no rotation. No text, no people, no captions, no audio.";

const dataUrl = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");

console.log("Uploading first frame (blueprint)...");
const firstUrl = await uploadBase64(dataUrl(FIRST), { uploadPath: "images/tester", fileName: "petronas-first.png" });
console.log("  ->", firstUrl);

console.log("Uploading last frame (finished)...");
const lastUrl = await uploadBase64(dataUrl(LAST), { uploadPath: "images/tester", fileName: "petronas-last.png" });
console.log("  ->", lastUrl);

console.log("\nCreating Kling video task (start+end frame, 5s, no audio, std mode)...");
const urls = await generateImage(
  "kling-3.0/video",
  {
    prompt: PROMPT,
    image_urls: [firstUrl, lastUrl],
    sound: false,
    duration: "5",
    mode: "std",
    multi_shots: false,
  },
  { pollMs: 5000, timeoutMs: 540000 }
);

if (!urls.length) {
  console.error("No video URL returned.");
  process.exit(1);
}
console.log("Video ready:", urls[0]);

console.log("Downloading ->", OUT);
const res = await fetch(urls[0]);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(OUT, buf);
console.log(`Saved public/Petronas.mp4 (${(statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`);
