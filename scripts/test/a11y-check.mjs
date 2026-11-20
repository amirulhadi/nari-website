// Accessibility audit: runs axe-core (WCAG 2.0/2.1/2.2 A and AA rules + best practices)
// on every built page, at desktop and phone width, in light and dark mode, with
// reduced motion off and on. Fails on any violation.
//
// Usage: npm run build && npm run test:a11y

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { launch, routes, startServer } from "./lib.mjs";

const axeSource = await readFile(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const server = await startServer(4420);
const pages = await routes();
const browser = await launch();

const modes = [
  { name: "desktop light", viewport: { width: 1440, height: 900 }, colorScheme: "light", reducedMotion: "no-preference" },
  { name: "desktop dark", viewport: { width: 1440, height: 900 }, colorScheme: "dark", reducedMotion: "no-preference" },
  { name: "phone light", viewport: { width: 390, height: 844 }, colorScheme: "light", reducedMotion: "reduce", isMobile: true },
  { name: "phone dark", viewport: { width: 390, height: 844 }, colorScheme: "dark", reducedMotion: "reduce", isMobile: true },
];

const failures = [];
let checks = 0;
for (const mode of modes) {
  // bypassCSP only so axe can be injected; the CSP itself is verified by test:site.
  const context = await browser.newContext({ bypassCSP: true, viewport: mode.viewport, colorScheme: mode.colorScheme, reducedMotion: mode.reducedMotion, isMobile: mode.isMobile });
  const page = await context.newPage();
  for (const route of pages) {
    await page.goto(server.base + route, { waitUntil: "load" });
    // Reveal-on-scroll items must not hide content from the audit.
    await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible")));
    await page.waitForTimeout(700); // let reveal transitions settle
    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(() =>
      // eslint-disable-next-line no-undef
      axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } }),
    );
    checks++;
    for (const violation of results.violations) {
      const where = violation.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ");
      failures.push(`[${mode.name}] ${route} — ${violation.id} (${violation.impact}): ${violation.help} → ${where}`);
    }
  }
  await context.close();
}

await browser.close();
await server.close();
console.log(`axe-core: ${checks} page audits (${pages.length} pages × ${modes.length} modes).`);
if (failures.length) {
  const unique = [...new Set(failures)];
  console.log(`\n${unique.length} violation(s):`);
  unique.forEach((f) => console.log(" ✗", f));
  process.exit(1);
}
console.log("No WCAG A/AA or best-practice violations found.");
