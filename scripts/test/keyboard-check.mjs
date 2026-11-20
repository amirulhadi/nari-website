// Keyboard, reflow and reduced-motion checks that automated rule engines cannot judge.
//   - skip link is the first Tab stop, becomes visible, and moves focus to <main>
//   - every focused control shows a visible focus indicator
//   - mobile menu: opens by keyboard, Escape closes it and returns focus to the button
//   - billing toggle and FAQ work from the keyboard
//   - WCAG 1.4.10 reflow: no horizontal scrolling at 320 px wide on any page
//   - reduced motion: content is visible at once (no reveal-on-scroll hiding)
//
// Usage: npm run build && npm run test:keyboard

import { launch, routes, startServer } from "./lib.mjs";

const server = await startServer(4430);
const pages = await routes();
const browser = await launch();
const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

const active = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      name: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40),
      outline: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2,
      visible: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0,
    };
  });

// ---- Desktop: skip link, focus order and visible focus on a content-rich page ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const route of ["/", "/pricing/", "/features/", "/early-access/"]) {
    await page.goto(server.base + route);
    await page.keyboard.press("Tab");
    const first = await active(page);
    if (!first || !/skip to content/i.test(first.name)) fail(route, `first Tab stop should be the skip link, got "${first?.name}"`);
    else if (!first.visible) fail(route, "skip link is not visible when focused");
    await page.keyboard.press("Enter");
    const afterSkip = await page.evaluate(() => document.activeElement?.id);
    if (afterSkip !== "main") fail(route, `skip link should move focus to #main, focus is on "${afterSkip}"`);

    // Tab through the whole page: every focused element must show a focus indicator.
    await page.goto(server.base + route);
    let stops = 0;
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press("Tab");
      const el = await active(page);
      if (!el) break;
      stops++;
      if (!el.outline && el.tag !== "details") fail(route, `no visible focus indicator on ${el.tag} "${el.name}"`);
      if (el.tag === "body") break;
    }
    if (stops < 5) fail(route, `suspiciously few tab stops (${stops})`);
  }

  // Billing toggle from the keyboard.
  await page.goto(server.base + "/pricing/");
  await page.getByRole("button", { name: "Annual", exact: true }).focus();
  await page.keyboard.press("Enter");
  if ((await page.getByRole("button", { name: "Annual", exact: true }).getAttribute("aria-pressed")) !== "true") fail("/pricing/", "billing toggle does not work with Enter");
  await page.getByRole("button", { name: "Monthly", exact: true }).focus();
  await page.keyboard.press("Space");
  if ((await page.getByRole("button", { name: "Monthly", exact: true }).getAttribute("aria-pressed")) !== "true") fail("/pricing/", "billing toggle does not work with Space");

  // FAQ from the keyboard.
  const summary = page.locator("details summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  if (!(await page.locator("details").first().evaluate((d) => d.open))) fail("/pricing/", "FAQ does not open with Enter");

  // Comparison table scroll region is keyboard reachable.
  const region = page.getByRole("region", { name: /plan comparison table/i });
  if ((await region.getAttribute("tabindex")) !== "0") fail("/pricing/", "scrollable comparison table is not keyboard focusable");

  // Early-access form: disabled, labelled, and not submittable.
  await page.goto(server.base + "/early-access/");
  const disabledFields = await page.locator("form fieldset[disabled] :is(input, select, textarea, button)").count();
  if (disabledFields < 6) fail("/early-access/", `expected the form controls to be disabled, found ${disabledFields}`);
  const unlabeled = await page.locator("form :is(input, select, textarea)").evaluateAll((els) => els.filter((e) => !document.querySelector(`label[for="${e.id}"]`)).length);
  if (unlabeled) fail("/early-access/", `${unlabeled} form controls without a label`);
  await page.close();
}

// ---- Phone: menu by keyboard ----
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(server.base + "/");
  const toggle = page.locator("[data-menu-toggle]");
  await toggle.focus();
  await page.keyboard.press("Enter");
  if ((await toggle.getAttribute("aria-expanded")) !== "true") fail("menu", "menu did not open with Enter");
  if (!(await page.locator("#mobile-menu").isVisible())) fail("menu", "menu panel not visible after opening");
  await page.keyboard.press("Tab");
  const inMenu = await page.evaluate(() => !!document.activeElement?.closest("#mobile-menu"));
  if (!inMenu) fail("menu", "focus did not move into the open menu on Tab");
  await page.keyboard.press("Escape");
  if ((await toggle.getAttribute("aria-expanded")) !== "false") fail("menu", "Escape did not close the menu");
  if (!(await toggle.evaluate((el) => el === document.activeElement))) fail("menu", "focus did not return to the menu button after Escape");
  await page.close();
}

// ---- Reflow at 320 px (WCAG 1.4.10) and 400% zoom equivalent ----
{
  const page = await browser.newPage({ viewport: { width: 320, height: 640 }, isMobile: true });
  for (const route of pages) {
    await page.goto(server.base + route);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) fail(route, `horizontal scrolling at 320 px (${overflow}px overflow)`);
  }
  await page.close();
}

// ---- Reduced motion: nothing hidden waiting for a scroll animation ----
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(server.base + "/");
  await page.waitForTimeout(300);
  const hidden = await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((el) => parseFloat(getComputedStyle(el).opacity) < 1).length);
  if (hidden) fail("reduced-motion", `${hidden} reveal elements are still transparent`);
  await context.close();
}

// ---- No JavaScript: content and navigation must still work ----
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(server.base + "/");
  const hiddenWithoutJs = await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((el) => parseFloat(getComputedStyle(el).opacity) < 1).length);
  if (hiddenWithoutJs) fail("no-js", `${hiddenWithoutJs} elements are hidden without JavaScript`);
  await page.goto(server.base + "/pricing/");
  if (await page.locator("[data-billing-set]").first().isVisible()) fail("no-js", "billing toggle is shown without JavaScript");
  if (!(await page.locator('[data-plan] [data-when="monthly"]').first().isVisible())) fail("no-js", "monthly prices are not visible without JavaScript");
  await context.close();
}

await browser.close();
await server.close();
console.log(`Keyboard, reflow, reduced-motion and no-JS checks on ${pages.length} pages.`);
if (failures.length) {
  const unique = [...new Set(failures)];
  console.log(`\n${unique.length} problem(s):`);
  unique.forEach((f) => console.log(" ✗", f));
  process.exit(1);
}
console.log("All checks passed.");
