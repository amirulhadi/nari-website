// Screenshot pipeline: captures REAL views of the NARI Studio app for the website.
//
// It drives the app in browser mock mode (no desktop shell, nothing written to disk
// in the app repo) using the app's own starter templates, so every image shows the
// product exactly as it is at the captured version.
//
// Usage:
//   1. In the app repo:  npx vite --port 1420   (or `npm run dev`)
//   2. Here:             npm run capture
//
// Env: NARI_APP_URL (default http://localhost:1420), CAPTURE_BROWSER (default msedge;
// "chrome" also works). Output: src/assets/screenshots/*.png + manifest.json.

import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const APP_URL = process.env.NARI_APP_URL ?? "http://localhost:1420";
const OUT = path.resolve(fileURLToPath(new URL("../../src/assets/screenshots/", import.meta.url)));
const VIEWPORT = { width: 1600, height: 1000 };
const SCALE = 2; // retina-quality source; Astro resizes for the page
// The slide stage inside the Preview overlay at the fixed viewport above (CSS px).
const STAGE_CLIP = { x: 420, y: 65, width: 960, height: 540 };

const browser = await chromium.launch({ channel: process.env.CAPTURE_BROWSER ?? "msedge" });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
page.on("dialog", (dialog) => dialog.accept("Demo course")); // mock-mode path prompt

const shots = [];
let appVersion = "unknown";

async function shot(name, description, clip) {
  await page.mouse.move(2, VIEWPORT.height - 2); // no hover states in the picture
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), clip });
  shots.push({ name, description });
  console.log(`  ✓ ${name}`);
}

async function openTemplate(label) {
  await page.goto(APP_URL);
  await page.getByRole("button", { name: /new project/i }).waitFor();
  await page.getByRole("button", { name: /new project/i }).click();
  await page.getByRole("button", { name: new RegExp(label, "i") }).click();
  await page.getByText(/Slide 1 of/).waitFor();
  await page.waitForTimeout(800);
}

/** Select a slide by clicking its thumbnail (clicking the name starts a rename). */
async function selectSlide(numberedName) {
  const label = page.getByText(numberedName, { exact: true }).first();
  const box = await label.boundingBox();
  if (!box) throw new Error(`Slide "${numberedName}" not found`);
  await page.mouse.click(box.x - 30, box.y + box.height / 2);
  await page.waitForTimeout(600);
}

/** Click an object on the canvas (not in a thumbnail) by its visible text. */
async function selectOnCanvas(text) {
  const candidates = page.locator("[data-element-id]", { hasText: text });
  const count = await candidates.count();
  let best = null;
  for (let i = 0; i < count; i++) {
    const box = await candidates.nth(i).boundingBox();
    if (box && (!best || box.width > best.width)) best = box;
  }
  if (!best) throw new Error(`Canvas object "${text}" not found`);
  await page.mouse.click(best.x + best.width / 2, best.y + best.height / 2);
  await page.waitForTimeout(600);
}

async function preview(mode) {
  await page.getByRole("button", { name: /^Preview/ }).click();
  await page.getByRole("button", { name: mode, exact: true }).click();
  await page.waitForTimeout(1500);
}

await mkdir(OUT, { recursive: true });
console.log(`Capturing from ${APP_URL} → ${OUT}`);

// Home screen + version
await page.goto(APP_URL);
await page.getByRole("button", { name: /new project/i }).waitFor();
appVersion = ((await page.getByText(/^v\d+\.\d+\.\d+$/).first().textContent()) ?? "").replace(/^v/, "") || appVersion;
await shot("home", "NARI Studio home screen: new project, open, PowerPoint import");

// Template picker
await page.getByRole("button", { name: /new project/i }).click();
await page.getByRole("dialog").waitFor();
await shot("template-picker", "Starting a new course from one of the five starter templates");

// Knowledge quiz: editor with a question selected
await openTemplate("Knowledge quiz");
await shot("editor-overview", "The editor: slide list, canvas, timeline and properties (Knowledge quiz template)");
await selectSlide("3. Question 2");
await selectOnCanvas("Correct answer");
await shot("editor-question", "Editing a multiple-choice question in a question pool");
await selectSlide("8. Results");
await shot("editor-results", "Results slide with score, pass mark, review answers and try again");

// Learner preview of a question
await selectSlide("2. Question 1");
await preview("From this slide");
await shot("preview-question", "Learner preview of a pooled multiple-choice question");
await shot("learner-question", "What the learner sees: a pooled multiple-choice question", STAGE_CLIP);
await page.keyboard.press("Escape");

// Branching scenario
await openTemplate("Branching scenario");
await selectSlide("2. Decision");
await selectOnCanvas("Choice A");
await shot("editor-branching", "A decision slide in the Branching scenario template; each choice leads to its own outcome");

// Drag and drop
await openTemplate("Drag and drop practice");
await selectSlide("2. Match the items");
await shot("editor-dragdrop", "Authoring a drag-and-drop exercise");
await preview("From this slide");
await shot("preview-dragdrop", "Learner view of the drag-and-drop exercise");
await shot("learner-dragdrop", "What the learner sees: a drag-and-drop exercise", STAGE_CLIP);
await page.keyboard.press("Escape");

await writeFile(
  path.join(OUT, "manifest.json"),
  JSON.stringify({ app: "NARI Studio", appVersion, capturedAt: new Date().toISOString(), viewport: VIEWPORT, scale: SCALE, shots }, null, 2) + "\n",
);
console.log(`Done: ${shots.length} screenshots of NARI Studio v${appVersion}`);
await browser.close();
