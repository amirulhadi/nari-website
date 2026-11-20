# NARI Studio Website

Official marketing site for NARI Studio, a desktop e-learning authoring tool. Built with Astro 7, Tailwind CSS 4 and TypeScript; deployed as a static site to Cloudflare Pages.

The app lives in its own repository (`D:\Projects NARI\NARI`); this site is independent of it.

## Status
- Phase 1 (planning) complete: [docs/phase-1-plan.md](docs/phase-1-plan.md), [subscription matrix](docs/subscription-feature-matrix.md), [logo directions](docs/brand/logo-directions.md).
- Phase 2 (design system + homepage) built, awaiting review: [docs/phase-2-summary.md](docs/phase-2-summary.md).

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
Everything that may change lives in `src/config/`: `site.ts` (brand, contact placeholders, feature flags, primary CTA mode), `features.ts`, `pricing.ts`, `navigation.ts`. Unconfirmed details are `null` and the UI hides them. Copy `.env.example` to `.env` to set `PUBLIC_SITE_URL`.

## Real screenshots
```bash
# in the app repo:  npx vite --port 1420
npm run capture    # writes src/assets/screenshots/*.png + manifest.json
npm run brand      # regenerates favicons and the Open Graph image
```
Needs Microsoft Edge or Chrome installed (set `CAPTURE_BROWSER=chrome` to switch).

## Rules for content
Only claim what the app does. Mark anything else "In development" or "Planned" in `features.ts`. No invented prices, testimonials, contact details or customer claims.
