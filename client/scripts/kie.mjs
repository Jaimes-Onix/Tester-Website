// scripts/kie.mjs
// Reusable server-side client for kie.ai (Nano Banana + any other jobs-API model).
// SECURITY: this runs in Node only. KIE_API_KEY must NEVER be imported into client
// code (src/**, public/**) or exposed via a VITE_ env var — that would ship it to the browser.

import { readFileSync, existsSync } from "node:fs";

/** Read KIE_API_KEY from the process env, or fall back to parsing .env.local (gitignored). */
function loadKey() {
  if (process.env.KIE_API_KEY) return process.env.KIE_API_KEY;
  const envPath = new URL("../.env.local", import.meta.url);
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*KIE_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  }
  throw new Error("KIE_API_KEY not found in environment or .env.local");
}

const API_KEY = loadKey();
const BASE = "https://api.kie.ai";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Upload a base64 data URL to kie.ai temp storage (auto-deleted after 3 days).
 * @param {string} dataUrl  e.g. "data:image/png;base64,...."
 * @param {object} [opts] { uploadPath, fileName }
 * @returns {Promise<string>} hosted downloadUrl
 */
export async function uploadBase64(dataUrl, { uploadPath = "images/tester", fileName } = {}) {
  const res = await fetch(`https://kieai.redpandaai.co/api/file-base64-upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ base64Data: dataUrl, uploadPath, fileName }),
  });
  const json = await res.json();
  if (!json?.success || !json?.data?.downloadUrl) {
    throw new Error(`upload failed: ${json?.msg || JSON.stringify(json)}`);
  }
  return json.data.downloadUrl;
}

/**
 * Create a generation task and poll until it finishes.
 * @param {string} model  e.g. "google/nano-banana", "google/nano-banana-edit", "google/nano-banana-pro"
 * @param {object} input  model input, e.g. { prompt, aspect_ratio, output_format, image_urls }
 * @param {object} [opts] { pollMs, timeoutMs }
 * @returns {Promise<string[]>} array of generated image URLs (hosted by kie.ai)
 */
export async function generateImage(model, input, { pollMs = 3000, timeoutMs = 180000 } = {}) {
  // 1) create the task
  const createRes = await fetch(`${BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input }),
  });
  const created = await createRes.json();
  if (created.code !== 200 || !created.data?.taskId) {
    throw new Error(`createTask failed: ${created.msg || JSON.stringify(created)}`);
  }
  const taskId = created.data.taskId;

  // 2) poll recordInfo until success/fail (states: waiting | queuing | generating | success | fail)
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(pollMs);
    const infoRes = await fetch(`${BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const info = await infoRes.json();
    const state = info?.data?.state;
    if (state === "success") {
      const { resultUrls = [] } = JSON.parse(info.data.resultJson || "{}");
      return resultUrls;
    }
    if (state === "fail") {
      throw new Error(`Generation failed: ${info.data.failMsg || info.data.failCode || "unknown error"}`);
    }
    // otherwise keep polling
  }
  throw new Error(`Generation timed out after ${timeoutMs}ms (taskId=${taskId})`);
}
