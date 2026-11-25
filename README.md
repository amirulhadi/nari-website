# NARI Studio Website

Official marketing site for NARI Studio, a desktop e-learning authoring tool. Built with Astro 7, Tailwind CSS 4 and TypeScript; deployed as a static site to Cloudflare Pages.

The app lives in its own repository (`D:\Projects NARI\NARI`); this site is independent of it.

## Status
- Phase 1 (planning) complete: [docs/phase-1-plan.md](docs/phase-1-plan.md), [subscription matrix](docs/subscription-feature-matrix.md), [logo directions](docs/brand/logo-directions.md).
- Phase 2 (design system + homepage): [docs/phase-2-summary.md](docs/phase-2-summary.md).
- Phase 3 (features, solutions, showcase, about, contact): [docs/phase-3-summary.md](docs/phase-3-summary.md).
- Phase 4 (pricing, account entry points, licensing architecture): [docs/phase-4-summary.md](docs/phase-4-summary.md), [licensing architecture](docs/licensing-architecture.md), [pricing memo outline](docs/pricing-memo-outline.md).
- Phase 5 (accessibility, performance, SEO, dark mode, tests) done, awaiting review: [docs/phase-5-summary.md](docs/phase-5-summary.md), [browser support](docs/browser-support.md).

## Site structure
| Path | What |
|---|---|
| `/` | NARI master brand: promise, create / deliver / learn flow, both products, early access |
| `/studio/` | NARI Studio: overview, Beta Edition section |
| `/studio/features/`, `/studio/solutions/…`, `/studio/showcase/…` | Studio features, solutions and playable examples |
| `/studio/beta/` | Beta Edition: known issues and tester guide (facts from the Studio repo, `docs/beta/`; never mentions the disabled Captivate import) |
| `/campus/` | NARI Campus early demo (draft copy for owner review; facts from the Campus README) |
| `/pricing/`, `/early-access/`, `/about/`, `/contact/` | Pricing (unpublished), early access, company pages |

Old paths `/features/`, `/solutions/…` and `/showcase/…` redirect to the `/studio/` versions. `public/_redirects` (Cloudflare Pages, 301) does the work; Astro `redirects` in `astro.config.mjs` emit meta-refresh stubs as a fallback. The sitemap lists only the new URLs. Product pages show a thin sub-header (`src/components/layout/ProductNav.astro`, links in `navigation.ts`). Product lockups come from `src/assets/brand/nari-{studio,campus}-logo*.svg` through `Logo.astro` (`product="studio"` or `"campus"`).

## Develop
```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # type check
npm run build      # static output in dist/
npm run preview
```
Node 22.23+ is required (`.node-version` pins 24 for CI and Cloudflare).

## Configuration
Everything that may change lives in `src/config/`: `site.ts` (master brand, products list, Studio download switch, Campus demo URL, contact placeholders, feature flags, site-wide CTA mode), `features.ts`, `pricing.ts`, `navigation.ts`. Unconfirmed details are `null` and the UI hides them. Copy `.env.example` to `.env` to set `PUBLIC_SITE_URL`.

### Campus demo URL
`campus.demoUrl` in `src/config/site.ts` is the live Campus demo that the Try the demo buttons open. Change it there if the demo moves.

### Studio download switch
`studioDownload.url` in `src/config/site.ts` is `null` until the first installer is published on GitHub Releases (repo `amirulhadi/nari-studio`). While it is `null`, the Studio button says "Join the beta" and links to `/early-access/`. Set the URL to the release page or installer and the same button says "Download for Windows (beta)" and links there. Nothing else changes. Do not set it before the installer exists.

## Real screenshots
```bash
# in the app repo:  npx vite --port 1420
npm run capture    # writes src/assets/screenshots/*.png + manifest.json
npm run brand      # regenerates favicons and the Open Graph image
npm run demos      # rebuilds the Showcase example courses with the app's own exporter
npm run test:site      # after a build: crawls every page under the production headers, checks links and anchors, every old URL redirect, no Captivate mention in the beta section
npm run test:a11y      # axe-core on every page, light and dark, desktop and phone
npm run test:keyboard  # keyboard, 320 px reflow, reduced motion, no-JS
npm run test:seo       # titles, descriptions, canonical, sitemap, structured data
```
Needs Microsoft Edge or Chrome installed (set `CAPTURE_BROWSER=chrome` to switch).

## Rules for content
Only claim what the app does. Mark anything else "In development" or "Planned" in `features.ts`. No invented prices, testimonials, contact details or customer claims.
