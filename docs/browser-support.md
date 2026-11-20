# Browser support and testing

## Supported baseline
The site uses Tailwind CSS 4, which relies on `@property`, `color-mix()` and cascade layers (the built CSS contains all three, with `@supports` fallbacks). That sets the baseline:

| Browser | Minimum |
|---|---|
| Chrome / Edge | 111 |
| Safari / iOS Safari | 16.4 |
| Firefox | 128 |

Older browsers still receive all content (it is plain HTML) but may lose some styling. The site needs **no JavaScript** to read content or navigate; JavaScript only adds the mobile menu, the billing toggle and the scroll reveal (`tests: no-JS check`).

## What has been tested
| Browser | How | Result |
|---|---|---|
| Microsoft Edge 157 (Chromium), desktop 1440 px and phone emulation 390 px and 320 px | Automated: site, accessibility, keyboard, SEO suites and Lighthouse | Passing |
| Chrome | Same engine as Edge; not run separately | Expected to match |
| **Firefox (current)** | **Not tested.** The only Firefox on the development PC is version 77 (2020), below the baseline and too old to automate | Needs a manual check |
| **Safari / iOS Safari** | **Not tested.** No Apple device or WebKit build available | Needs a manual check |

## Manual checklist for Firefox and Safari
Run `npm run build && npm run preview` (or open the Cloudflare preview URL) and check on a current Firefox, desktop Safari and an iPhone:

1. Homepage: heading font is Manrope, hero screenshot loads (AVIF/WebP), no horizontal scroll.
2. Mobile menu opens and closes; Escape closes it on desktop Safari/Firefox with a keyboard attached.
3. Pricing: Monthly/Annual toggle switches the "Billed monthly/annually" text; the comparison table scrolls sideways on a phone; FAQ items open.
4. Showcase: open each example; start the course, answer a question, and drag an item in "Hazard or safeguard?" (touch and mouse).
5. Dark mode (system setting): cards, table and the closing band are legible.
6. Early access: the form is visibly disabled.

Optional: BrowserStack or a similar service, or Playwright's bundled Firefox and WebKit builds (a roughly 150 MB download that needs your approval) would let the automated suites run on both engines.

## Automated test commands
| Command | What it checks |
|---|---|
| `npm run test:site` | Every page under the production security headers: console and CSP errors, overflow, titles, links, the pricing toggle and a played demo |
| `npm run test:a11y` | axe-core WCAG 2.0/2.1/2.2 A and AA plus best practices on every page, light and dark, desktop and phone |
| `npm run test:keyboard` | Skip link, tab order, visible focus, mobile menu, toggle, FAQ, 320 px reflow, reduced motion, no-JS |
| `npm run test:seo` | Titles, descriptions, headings, canonical, Open Graph, sitemap and robots, structured data |
| Lighthouse | `node scripts/test/serve.mjs 4450` then `npx lighthouse http://localhost:4450/ --only-categories=performance,accessibility,best-practices,seo` (set `CHROME_PATH` to Edge or Chrome) |

All four suites need a build first (`npm run build`).
