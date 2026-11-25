// Smoke test for the built site (run `npm run build` first).
//   - serves dist/ with the production headers from public/_headers (so the CSP is enforced)
//   - visits every page at desktop and phone width
//   - fails on: missing pages, broken internal links, console errors, CSP violations,
//     horizontal overflow, missing <h1>/title/description/canonical, images without alt
// Usage: npm run test:site     (needs Microsoft Edge or Chrome; CAPTURE_BROWSER=chrome to switch)

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { DIST, launch, routes as builtRoutes, startServer } from "./lib.mjs";

const server = await startServer(4410);
const base = server.base;
const routes = await builtRoutes();
const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);
const internalLinks = new Map();

const browser = await launch();
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
      deadAnchors: [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href")).filter((h) => h.length > 1 && !document.getElementById(h.slice(1))),
    }));
    if (info.h1 !== 1) fail(where, `${info.h1} <h1> elements`);
    if (!info.title) fail(where, "missing title");
    if (route !== "/404/" && route !== "/styleguide/" && info.desc.length < 50) fail(where, "missing or short meta description");
    if (!info.canonical) fail(where, "missing canonical");
    if (info.overflow) fail(where, "horizontal overflow");
    if (info.noAlt) fail(where, `${info.noAlt} images without alt`);
    for (const href of info.links) internalLinks.set(href, route);
    for (const href of info.deadAnchors) fail(where, `broken same-page anchor ${href}`);
  }
  await page.close();
}

// Internal links must resolve to a built page, a hash on the homepage, or an asset.
for (const [href, from] of internalLinks) {
  const clean = href.split("#")[0].split("?")[0] || "/";
  const target = clean.endsWith("/") ? clean : clean;
  const ok = routes.includes(target) || routes.includes(target + "/") || (await stat(path.join(DIST, clean)).then(() => true, () => false));
  if (!ok) fail(from, `broken link ${href}`);
  const fragment = href.split("#")[1];
  if (ok && fragment && routes.includes(clean)) {
    const html = await readFile(path.join(DIST, clean, "index.html"), "utf8");
    if (!html.includes(`id="${fragment}"`)) fail(from, `link ${href} points to a missing #${fragment}`);
  }
}

// Demo embedded in its iframe under the production CSP: play one slide.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()); });
  await page.goto(`${base}/studio/showcase/handling-a-delayed-order/`);
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

// Old URLs redirect. Cloudflare Pages reads public/_redirects (301); Astro's meta-refresh stubs are the fallback.
{
  const rules = (await readFile("public/_redirects", "utf8"))
    .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    .map((l) => { const [from, to, status] = l.split(/\s+/); return { from, to, status }; });
  const apply = (url) => {
    for (const r of rules) {
      if (r.from.endsWith("/*")) {
        const prefix = r.from.slice(0, -1);
        if (url.startsWith(prefix) && url.length > prefix.length) return { to: r.to.replace(":splat", url.slice(prefix.length)), status: r.status };
      } else if (r.from === url) return { to: r.to, status: r.status };
    }
    return null;
  };
  const slugs = async (dir) => (await readdir(path.join(DIST, dir), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  const oldPaths = ["/features/", "/solutions/", "/showcase/"];
  for (const slug of await slugs("studio/solutions")) oldPaths.push(`/solutions/${slug}/`);
  for (const slug of await slugs("studio/showcase")) oldPaths.push(`/showcase/${slug}/`);
  if (oldPaths.length < 12) fail("redirects", `expected at least 12 old URLs, found ${oldPaths.length}`);

  const page = await browser.newPage();
  for (const old of oldPaths) {
    const expected = "/studio" + old;
    if (!routes.includes(expected)) fail(old, `redirect target ${expected} is not a built page`);
    for (const variant of [old, old.slice(0, -1)]) {
      const hit = apply(variant);
      // A splat rule leaves no trailing slash on the last segment; Cloudflare Pages adds it with one more hop.
      const lands = hit && (hit.to === expected || hit.to === expected.slice(0, -1));
      if (!lands || hit.status !== "301") fail(variant, `_redirects does not send it to ${expected} with 301 (got ${JSON.stringify(hit)})`);
    }
    const stub = await readFile(path.join(DIST, old, "index.html"), "utf8").catch(() => "");
    if (!stub.includes(`url=${expected}`)) fail(old, "missing meta-refresh fallback to " + expected);
    await page.goto(base + old);
    await page.waitForURL(base + expected, { timeout: 5000 }).catch(() => fail(old, `did not end up at ${expected} (at ${page.url()})`));
  }
  await page.close();
}

// Beta Edition pages never mention Captivate (the import is switched off in the beta).
{
  for (const route of routes.filter((r) => r.startsWith("/studio/beta/"))) {
    const html = await readFile(path.join(DIST, route, "index.html"), "utf8");
    if (/captivate/i.test(html)) fail(route, "mentions Captivate");
  }
  const studio = await readFile(path.join(DIST, "studio", "index.html"), "utf8");
  const section = studio.match(/<section id="beta"[\s\S]*?<\/section>/)?.[0] ?? "";
  if (!section) fail("/studio/", "Studio Beta Edition section (#beta) is missing");
  if (/captivate/i.test(section)) fail("/studio/", "Studio Beta Edition section mentions Captivate");
  if (!section.includes("/studio/beta/#known-issues") || !section.includes("/studio/beta/#tester-guide")) fail("/studio/", "beta section must link to the known issues and the tester guide");
}

// Product pages: Studio button follows studioDownload.url; Campus demo link and honest status; no "next product" slot.
{
  const siteTs = await readFile("src/config/site.ts", "utf8");
  const studioUrl = siteTs.match(/studioDownload[^=]*=\s*\{\s*url:\s*("([^"]+)"|null)/);
  const demoUrl = siteTs.match(/demoUrl:\s*"([^"]+)"/)?.[1];
  const page = await browser.newPage();
  await page.goto(base + "/studio/");
  const hero = page.locator('[data-cta="hero-primary"]');
  const label = (await hero.innerText()).trim();
  const href = await hero.getAttribute("href");
  if (!studioUrl) fail("studio", "could not read studioDownload.url from site.ts");
  else if (studioUrl[1] === "null") {
    if (label !== "Join the beta" || href !== "/early-access/") fail("/studio/", `with no download URL the button must read "Join the beta" and link to /early-access/ (got "${label}" → ${href})`);
  } else if (label !== "Download for Windows (beta)" || href !== studioUrl[2]) fail("/studio/", `with a download URL the button must read "Download for Windows (beta)" and link to it (got "${label}" → ${href})`);

  await page.goto(base + "/campus/");
  const demo = page.locator('[data-cta="campus-demo"]');
  if ((await demo.innerText()).trim() !== "Try the demo" || (await demo.getAttribute("href")) !== demoUrl) fail("/campus/", "Try the demo must link to campus.demoUrl from site.ts");
  const text = await page.locator("main").innerText();
  for (const phrase of ["Early demo", "Billing is simulated", "not yet verified against SCORM Cloud or Moodle"]) {
    if (!text.includes(phrase)) fail("/campus/", `status banner is missing "${phrase}"`);
  }
  if (!(await page.locator("#status").isVisible())) fail("/campus/", "status banner is not visible");

  await page.goto(base + "/");
  if (/next at nari/i.test(await page.locator("main").innerText())) fail("/", "home must not have a Next at NARI slot");
  if ((await page.locator('a[href="/studio/"], a[href="/campus/"]').count()) < 2) fail("/", "home must link to both product pages");
  await page.close();
}

await browser.close();
await server.close();
console.log(`Checked ${routes.length} pages × 2 viewports, ${internalLinks.size} internal links.`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  for (const f of [...new Set(failures)]) console.log(" ✗", f);
  process.exit(1);
}
console.log("All checks passed.");
