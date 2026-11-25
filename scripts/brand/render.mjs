// Renders brand PNGs (favicons, app-icon size mark, Open Graph image) from the SVG
// mark and the site font, so raster assets never drift from the vector source.
// Usage: npm run brand   (needs Microsoft Edge or Chrome installed)

import { chromium } from "playwright-core";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const pub = (p) => path.join(root, "public", p);
const mark = await readFile(pub("favicon.svg"), "utf8"); // tile favicon from the brand package
// Master lockup, dark variant (snow symbol and wordmark, mint node), from the brand package v0.1.0.
const lockup = (await readFile(path.join(root, "src/assets/brand/nari-logo-dark.svg"), "utf8")).replace(/<title>.*?<\/title>/, "");
const fontFile = path.join(root, "node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2");
const fontData = (await readFile(fontFile)).toString("base64");
const fontFace = `@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${fontData}) format("woff2");font-weight:200 800}`;
const screenshot = (await readFile(path.join(root, "src/assets/screenshots/editor-overview.png"))).toString("base64");

const browser = await chromium.launch({ channel: process.env.CAPTURE_BROWSER ?? "msedge" });
const page = await browser.newPage();

async function renderSvg(file, size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${mark}`);
  await page.screenshot({ path: pub(file), omitBackground: true });
  console.log(`  ✓ ${file}`);
}

await mkdir(pub("brand"), { recursive: true });
await mkdir(pub("og"), { recursive: true });
await renderSvg("favicon-32.png", 32);
await renderSvg("apple-touch-icon.png", 180);
await renderSvg("brand/nari-mark-512.png", 512);

// Open Graph image 1200×630: master lockup on dark paper, tagline and a real editor screenshot.
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<style>${fontFace}
  html,body{margin:0}
  .og{width:1200px;height:630px;box-sizing:border-box;background:#0B1019;font-family:Manrope;color:#EEF1F5;position:relative;overflow:hidden;padding:72px 80px}
  .wm svg{display:block;height:64px;width:auto}
  h1{font-size:58px;line-height:1.04;letter-spacing:-0.035em;font-weight:700;color:#EEF1F5;margin:56px 0 0;max-width:560px}
  p{font-size:22px;color:#B7C0CC;margin:22px 0 0;max-width:520px;line-height:1.45}
  img{position:absolute;left:690px;top:110px;width:760px;border-radius:14px;border:1px solid #2F3A4C;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}
</style>
<div class="og"><div class="wm">${lockup}</div>
<h1>Build interactive courses. Publish to your LMS.</h1>
<p>Desktop e-learning authoring with quizzes, branching and SCORM export.</p>
<img src="data:image/png;base64,${screenshot}" alt=""></div>`);
await page.waitForTimeout(300);
await page.screenshot({ path: pub("og/default.png") });
console.log("  ✓ og/default.png");

await browser.close();
