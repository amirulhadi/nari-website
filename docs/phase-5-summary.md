# Phase 5 — Technical polish: summary

Branch: `phase-5` (from `phase-4`) · Date: 2026-11-20 · Status: **done, awaiting your review.** Phase 6 has not started.

## Results at a glance
| Area | Result |
|---|---|
| Accessibility (axe-core, WCAG 2.0/2.1/2.2 A + AA + best practices) | **72 page audits** (18 pages × desktop/phone × light/dark): no violations after fixes |
| Keyboard, reflow, reduced motion, no-JS | All pass (see list below) |
| Performance (Lighthouse, mobile profile, production headers) | Home 99, Features 100, Pricing 100, Showcase demo 100, Solutions 100. Accessibility, Best Practices and SEO 100 on all five. LCP 1.4–1.9 s, CLS ≤ 0.03, TBT 0 ms, 78–253 KB per page |
| SEO | 19 unique titles (≤ 60 characters), unique descriptions (70–160), one `<h1>` per page, canonical and Open Graph everywhere, sitemap and robots consistent, structured data valid and free of prices |
| Browsers | Edge/Chromium 157 tested. **Firefox and Safari not tested** (see below) |

## Problems found and fixed
| # | Found by | Problem | Fix |
|---|---|---|---|
| 1 | axe | **Text contrast too low** on every page: muted grey was 4.4:1 on the page background and 4.1:1 on tinted bands (needs 4.5:1); screenshot window titles were 4.5:1 and borderline | Muted text darkened to `#5c6474` (5.5:1 on the page, 5.1:1 on bands); frame titles to 65% white (7:1) |
| 2 | SEO audit | Three titles (63–73 chars) and three descriptions (167–184 chars) would be truncated in search results | Rewrote them; the homepage title now comes from a config value (`site.homeTitle`) |
| 3 | Visual review | In dark mode the closing call-to-action band became a glaring white slab | New band tokens: dark card with a teal button in dark mode; the homepage now uses the shared component |
| 4 | Visual review | Sticky header and feature menu were slightly translucent, so content showed through when scrolling in dark mode | Made opaque |
| 5 | Performance review | The build generated PNG fallbacks browsers never download (build output 14 MB) | WebP fallback; build output **4.3 MB** |

## Added
- Test suites: `test:a11y`, `test:keyboard`, `test:seo` (plus the existing `test:site`) and `scripts/test/serve.mjs`. A shared helper (`scripts/test/lib.mjs`) serves the build with the production security headers, so tests run under the real CSP.
- Breadcrumb structured data on Solutions and Showcase detail pages.
- [docs/browser-support.md](browser-support.md): supported browser baseline, what was and wasn't tested, a manual checklist.
- One dev-only dependency: **axe-core** (test tool; ships nothing to the site). Lighthouse is run with `npx` and is not a dependency.

## What the keyboard/robustness tests prove
Skip link is the first Tab stop, becomes visible and moves focus to the main content · every focusable element on Home, Pricing, Features and Early access shows a 2 px focus ring (and I confirmed the check fails if the ring is removed) · the mobile menu opens with Enter, moves focus inside, closes with Escape and returns focus to its button · the billing toggle works with Enter and Space · FAQ opens with Enter · the scrollable comparison table is keyboard-focusable · every form control is labelled and the early-access form is disabled · no horizontal scrolling at 320 px on any page (WCAG reflow) · with reduced motion nothing waits to fade in · with JavaScript off, content stays visible, prices show, and the toggle is hidden.

## Not done / honest gaps
- **Firefox and Safari are not tested.** The Firefox on this PC is version 77 (2020): too old to be meaningful or automatable. A manual checklist is in [browser-support.md](browser-support.md). To automate them, I'd need to download Playwright's Firefox and WebKit builds (about 150 MB); I haven't done this without your approval.
- **No screen-reader testing** (NVDA/VoiceOver). Automated rules and keyboard tests cannot replace it; the pages use landmark, heading, table and `details` semantics that should read well, but this is unverified.
- **Lighthouse numbers are from a local, throttled simulation**, not from the live Cloudflare network; they will differ slightly in production.
- The demo players inside the Showcase frames are the desktop app's exported player, so their own accessibility and styling (small button text, fixed dark theme) are the app's, not the website's. The page's frame, title and "open full screen" link pass the audits.
- No cookie banner is needed (no cookies, analytics or third parties).
- The legal pages and real contact details are still missing (needed before launch).
- **GitHub push is still pending** (no GitHub sign-in on this PC).

## Proposed Phase 6 tasks
1. Cloudflare Pages configuration: build command, Node version, output directory, `_headers`, preview deployments per branch, and the `PUBLIC_SITE_URL` variable. Document and, once you sign in or give me access, set up the project.
2. `docs/deployment.md`: step-by-step deployment, custom domain and DNS guide, SSL, redirects (`www`, trailing slash), cache headers, rollback.
3. Environment-variable documentation and a secrets review (the site has none).
4. Production build and a final end-to-end run of all suites against the deployed preview URL.
5. Release checklist (domain, contact details, legal pages, privacy notice, analytics decision, waitlist form decision, prices) and the switch list for turning on early-access sign-ups, downloads and accounts.
6. Final documentation pass and handover summary; merge plan for the phase branches.
