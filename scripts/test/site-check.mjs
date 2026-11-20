// Smoke test for the built site (run `npm run build` first).
//   - serves dist/ with the production headers from public/_headers (so the CSP is enforced)
//   - visits every page at desktop and phone width
//   - fails on: missing pages, broken internal links, console errors, CSP violations,
//     horizontal overflow, missing <h1>/title/description/canonical, images without alt
// Usage: npm run test:site     (needs Microsoft Edge or Chrome; CAPTURE_BROWSER=chrome to switch)

import http from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const DIST = path.resolve("dist");
const PORT = 4410;
const base = `http://localhost:${PORT}`;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".avif": "image/avif", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml" };

// Parse public/_headers: only the "/*" block applies to every response.
const headerText = (await readFile("public/_headers", "utf8")).replace(/\r\n/g, "\n");
const globalBlock = headerText.split(/\n\n/).find((b) => b.split("\n").includes("/*")) ?? "";
const globalHeaders = Object.fromEntries(
  globalBlock.split("\n").slice(globalBlock.split("\n").indexOf("/*") + 1).map((l) => l.trim()).filter(Boolean).map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1).trim()]),
);
delete globalHeaders["Strict-Transport-Security"]; // http://localhost
globalHeaders["Content-Security-Policy"] = globalHeaders["Content-Security-Policy"].replace("; upgrade-insecure-requests", "");

const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(DIST, p);
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", ...globalHeaders });
    res.end(body);
  } catch {
    const notFound = await readFile(path.join(DIST, "404.html")).catch(() => Buffer.from("Not found"));
    res.writeHead(404, { "content-type": "text/html", ...globalHeaders });
    res.end(notFound);
  }
}).listen(PORT);

async function pagesIn(dir, prefix = "") {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["_astro", "demos", "js", "og", "brand"].includes(entry.name) && !prefix) continue;
      out.push(...(await pagesIn(path.join(dir, entry.name), `${prefix}/${entry.name}`)));
    } else if (entry.name === "index.html") out.push(prefix || "/");
  }
  return out;
}

const routes = (await pagesIn(DIST)).map((r) => (r === "/" ? "/" : `${r}/`)).sort();
const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);
const internalLinks = new Map();

const browser = await chromium.launch({ channel: process.env.CAPTURE_BROWSER ?? "msedge" });
for (const [label, viewport, mobile] of [["desktop", { width: 1440, height: 900 }, false], ["phone", { width: 390, height: 844 }, true]]) {
  const page = await browser.newPage({ viewport, isMobile: mobile });
  const problems = [];
  page.on("console", (m) => { if (m.type() === "error" || /Content Security Policy|violat/i.test(m.text())) problems.push(m.text()); });
  page.on("pageerror", (e) => problems.push(String(e)));
  for (const route of routes) {
    problems.length = 0;
    const response = await page.goto(base + route, { waitUntil: "load" });
    await page.waitForTimeout(250);
    const where = `${label} ${route}`;
    if (route !== "/404/" && response.status() !== 200) fail(where, `HTTP ${response.status()}`);
    for (const p of problems) fail(where, `console: ${p.slice(0, 160)}`);
    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll("h1").length,
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content ?? "",
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      noAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).length,
      links: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => h.startsWith("/") && !h.startsWith("//")),
    }));
    if (info.h1 !== 1) fail(where, `${info.h1} <h1> elements`);
    if (!info.title) fail(where, "missing title");
    if (route !== "/404/" && route !== "/styleguide/" && info.desc.length < 50) fail(where, "missing or short meta description");
    if (!info.canonical) fail(where, "missing canonical");
    if (info.overflow) fail(where, "horizontal overflow");
    if (info.noAlt) fail(where, `${info.noAlt} images without alt`);
    for (const href of info.links) internalLinks.set(href, route);
  }
  await page.close();
}

// Internal links must resolve to a built page, a hash on the homepage, or an asset.
for (const [href, from] of internalLinks) {
  const clean = href.split("#")[0].split("?")[0] || "/";
  const target = clean.endsWith("/") ? clean : clean;
  const ok = routes.includes(target) || routes.includes(target + "/") || (await stat(path.join(DIST, clean)).then(() => true, () => false));
  if (!ok) fail(from, `broken link ${href}`);
}

// Demo embedded in its iframe under the production CSP: play one slide.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()); });
  await page.goto(`${base}/showcase/handling-a-delayed-order/`);
  const frame = page.frameLocator("iframe");
  await frame.getByRole("button", { name: /^Start$/ }).click({ timeout: 8000 }).catch((e) => fail("demo", `could not start: ${e.message.split("\n")[0]}`));
  await frame.getByRole("button", { name: /Apologise/ }).click({ timeout: 8000 }).catch((e) => fail("demo", `choice not clickable: ${e.message.split("\n")[0]}`));
  const text = await frame.locator("body").innerText().catch(() => "");
  if (!/customer feels informed/i.test(text)) fail("demo", "branching outcome did not appear inside the iframe");
  for (const p of problems) fail("demo", `console: ${p.slice(0, 160)}`);
  await page.close();
}

// Pricing page behaviour: billing toggle, FAQ, comparison table, no dead account links.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/pricing/`);
  const visible = (sel) => page.locator(sel).evaluateAll((els) => els.filter((e) => e.offsetParent !== null).length);
  if ((await visible('[data-plan] [data-when="monthly"]')) !== 4) fail("pricing", "monthly prices should show by default for all 4 plans");
  if ((await visible('[data-plan] [data-when="annual"]')) !== 0) fail("pricing", "annual prices should be hidden by default");
  await page.getByRole("button", { name: "Annual", exact: true }).click();
  if ((await visible('[data-plan] [data-when="annual"]')) !== 4) fail("pricing", "annual prices did not show after toggling");
  if ((await visible('[data-plan] [data-when="monthly"]')) !== 0) fail("pricing", "monthly prices still visible after toggling");
  if ((await page.getByRole("button", { name: "Annual", exact: true }).getAttribute("aria-pressed")) !== "true") fail("pricing", "aria-pressed not updated");
  const plans = await page.locator("[data-plan]").count();
  if (plans !== 4) fail("pricing", `expected 4 plan cards, found ${plans}`);
  const headers = await page.locator("table thead th[scope=col]").count();
  if (headers !== 5) fail("pricing", `comparison table should have 5 column headers, found ${headers}`);
  const faq = page.locator("details").first();
  await faq.locator("summary").click();
  if (!(await faq.evaluate((d) => d.open))) fail("pricing", "FAQ item did not open");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  if (!jsonLd.some((t) => t.includes('"FAQPage"'))) fail("pricing", "FAQPage structured data missing");
  if (jsonLd.some((t) => /"offers"|"price"/i.test(t))) fail("pricing", "structured data must not contain prices");
  await page.close();

  // No sign-in / account links anywhere while accounts are disabled.
  const check = await browser.newPage();
  for (const route of ["/", "/pricing/", "/contact/"]) {
    await check.goto(base + route);
    const accountLinks = await check.locator('a[href*="sign-in"], a[href*="sign-up"], a[href*="/account"], a[href*="signin"]').count();
    if (accountLinks) fail(route, "account link rendered while accounts are disabled");
  }
  await check.close();
}

await browser.close();
server.close();
console.log(`Checked ${routes.length} pages × 2 viewports, ${internalLinks.size} internal links.`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  for (const f of [...new Set(failures)]) console.log(" ✗", f);
  process.exit(1);
}
console.log("All checks passed.");
