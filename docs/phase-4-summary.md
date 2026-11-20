# Phase 4 — Commercial website: summary

Branch: `phase-4` (from `phase-3`) · Date: 2026-11-20 · Status: **built, awaiting your review.** Phase 5 has not started.

## What was built
| Item | Where | Notes |
|---|---|---|
| **Pricing page** | `/pricing/` | Hero, "pricing announced at launch" notice, monthly/annual toggle, four plan cards, "fair upgrades" benefits and upgrade message, full comparison table, enterprise enquiry call to action, FAQ |
| **Billing toggle** | `BillingToggle.astro` + `public/js/site.js` | A working switch (hidden without JavaScript). It flips the visible price text and billing note on every card. With no prices set, each card says "Announced at launch" and "Billed monthly / annually", and the toggle notes "Annual savings announced at launch" |
| **Comparison table** | `ComparisonTable.astro` from `config/pricing.ts` | Seven groups (authoring, usage allowances, publishing, content, licence, team and administration, support). Real table markup with row/column headers, screen-reader text for ticks, horizontal scroll with a sticky first column on phones, and **Planned** tags for anything not built |
| **Usage allowances** | Table group | Unlimited projects and slides, users, devices, cloud storage "Not offered", with the reasoning on the row |
| **Upgrade messaging** | Pricing page | Start free, projects carry over, nothing is locked if a plan ends |
| **Free-trial messaging** | `pricing.trialDays` | **Hidden** until you set a trial length. The FAQ says trial terms are undecided |
| **Enterprise enquiry** | Pricing page + Team/Enterprise cards | Goes to `/contact/` (no addresses are invented; that page shows "published at launch") |
| **FAQ** | `FaqList.astro` (native `<details>`) + `FAQPage` structured data | Ten answered questions; the data contains no prices or offers |
| **Account entry points** | `config/site.ts` → `account`, `accountUrl()` | Sign in, sign up, start trial, manage account, manage subscription are defined as links to a future portal. **None is rendered** while `accountsEnabled` is false or `account.appUrl` is null. The site test fails if an account link appears in that state |
| **Shared plan cards** | `PlanCard.astro` | The homepage plans section now uses the same component and links to `/pricing/` |
| **Licensing architecture** | [licensing-architecture.md](licensing-architecture.md) | Full recommendation: components, MoR payments, browser-based PKCE sign-in, Ed25519 signed licence tokens, device activation, offline grace and offline licence files, expiry behaviour, enforcement point in the app's Rust `export_package`, privacy, data model, app changes, roadmap L0–L5, risks and decisions |
| **Pricing memo outline** | [pricing-memo-outline.md](pricing-memo-outline.md) | What must be researched and decided before any price is published, plus the 30-minute checklist for publishing prices |

## Updating prices later (no redesign)
Edit `src/config/pricing.ts` (`monthly`, `annual`, `annualSavingPercent`, `trialDays`), set `site.flags.pricingPublished = true`, revise the three FAQ entries that mention "announced at launch", trials and education discounts, rebuild. **Tested:** I temporarily set sample numbers and flags, confirmed the cards showed `$11 / $9`, `$22.50 / $19`, the 14-day trial line and "Save 17%", that the toggle switched between them, and that the notice disappeared; then restored the real config. No sample number was committed.

## Checks run
| Check | Result |
|---|---|
| `astro check` | 0 errors, 0 warnings |
| `astro build` | 19 pages |
| `npm run test:site` (extended) | 18 pages × 2 viewports under the production headers, 22 internal links; **plus** on `/pricing/`: 4 plan cards, toggle changes visible prices and `aria-pressed`, comparison table has 5 column headers, FAQ opens, `FAQPage` data present and free of prices, and no account links on the home, pricing or contact pages |
| Visual review | Pricing page at 1440 px and 390 px |

## Fixes made during review
- The "Most popular" badge implied customer data that does not exist; it now says **Recommended**.
- A missing space in the pricing notice and uneven comparison-table column widths.

## Not done / honest gaps
- **No prices**, trial terms or education discount exist; the page says so. These need your pricing memo.
- The plan contents (badge on Free, commercial-use rule, 2 devices on Pro, support levels) are the **proposal** from the subscription matrix. You said "subscription matrix" in your reply but did not mark individual points, so the page labels them as a proposal. Please confirm or amend.
- **Team and Enterprise** are "Contact sales" because seat management and administration are not built; many of their rows are tagged Planned.
- No cookie banner is needed yet (no cookies, no analytics). When analytics, forms or the CRM are approved, a privacy notice, consent approach and `connect-src` changes are needed.
- The legal pages (privacy, terms, EULA) do not exist; they need text from you or your lawyer and are required before the early-access form opens or anything is sold.
- Firefox/Safari, keyboard-only and screen-reader testing, Lighthouse and dark mode review are Phase 5.
- **GitHub push still pending** (no GitHub sign-in on this PC).

## Proposed Phase 5 tasks
1. Accessibility: automated axe run on every page, keyboard-only walkthrough, focus order, 200% zoom and reduced-motion checks, colour-contrast audit of both themes, fix findings.
2. Performance: Lighthouse on all pages, image sizes and fallbacks (drop the PNG fallback to save build size), font loading, caching headers.
3. SEO: per-page titles/descriptions review, Open Graph image per section, `SoftwareApplication` and breadcrumb data, sitemap `lastmod`, internal-link review, search topics from the Phase 1 plan reviewed against the real copy.
4. Cross-browser: Chrome, Edge, Firefox and Safari/iOS (needs access to Safari or a hosted test service; I can run Chromium and Firefox locally).
5. Dark-mode visual review and fixes.
6. Functional re-test and Phase 5 review.
