# Phase 3 — Product marketing pages: summary

Branch: `phase-3` (from `phase-2`) · Date: 2026-11-20 · Status: **built, awaiting your review.** Phase 4 has not started.

## What was built
| Page | Route | Notes |
|---|---|---|
| Features | `/features/` | Nine categories from `features.ts`, sticky in-page navigation, an Available / In development / Planned tag on every item, real screenshots where one genuinely shows the feature, and a "What's next" roadmap block |
| Solutions | `/solutions/` + 5 pages | Corporate training (incl. professional development), employee onboarding, compliance training, education (incl. interactive learning) and freelancers. Each: challenge → how NARI Studio helps (mapped to real features) → recommended starter course → related playable example. Content lives in `src/config/solutions.ts` |
| Showcase | `/showcase/` + 4 pages | Four **real HTML5 courses exported by NARI Studio v0.9.0's own exporter**, embedded as playable demos (sandboxed iframe), with "try this" steps, capabilities shown and a "full screen" link. A "what these examples don't show yet" section lists the gaps honestly (video, captions, SCORM) |
| About | `/about/` | Vision, mission, why it exists, four principles, "where we are". No company history, customer numbers or market claims |
| Contact | `/contact/` | General, sales, enterprise and support cards driven by `site.contact`; with no confirmed address, a card shows "Contact details will be published at launch" and points to early access. No form, no invented details |

## Showcase demos: how they are made
`npm run demos` loads the app's real TypeScript modules through the app's own Vite config (the app repo is **not modified**), builds each starter course, fills it with neutral demo content, validates it with the app's validator and writes the app's HTML5 export to `public/demos/<slug>/`:

| Demo | Starter course | Shows |
|---|---|---|
| Workplace safety check | Knowledge quiz | Question pools (4 of 6 dealt), pass mark, results, review, retry |
| Handling a delayed order | Branching scenario | Branching by learner choice, retry path |
| Welcome: your first week | Lesson with knowledge check | Key-point layouts, true/false check, completion |
| Hazard or safeguard? | Drag and drop practice | Drag-and-drop, partial credit, results |

Demo content is original and labelled "demonstration content only"; the safety demo says it is not a safety training course.

## Checks run
| Check | Result |
|---|---|
| `astro check` | 0 errors, 0 warnings |
| `astro build` | 18 pages, sitemap |
| `npm run test:site` (new) | Serves `dist/` **with the production security headers**, visits 17 pages at 1440 px and 390 px: no console errors or CSP violations, no horizontal overflow, one `<h1>`, title, description, canonical and image alt text on every page, all 22 internal links resolve, and a demo is played inside its iframe |
| Playing the demos | Drag-and-drop: all six items sorted → "All six are in the right place." Quiz: four questions answered → "100%, 40 of 40 points · pass mark 80% · Congratulations — you passed!". Branching: choice → outcome slide |

## Issues found and fixed during this phase
- **Production font bug (caught by the new test):** the build inlined a small Manrope file as a `data:` URI, which the strict Content-Security-Policy (`font-src 'self'`) blocks, so headings would have fallen back to a system font on the live site. Fixed with `assetsInlineLimit: 0`; the policy stays strict.
- The security headers originally forbade all framing, which would have blocked the demo iframe. Now `frame-ancestors 'self'` / `X-Frame-Options: SAMEORIGIN`.
- Raw demo player files are `Disallow`ed in `robots.txt`; the Showcase pages are the indexable entry points.
- The styleguide page had no `<h1>`.

## Not done / honest gaps
- The demos are **HTML5 exports, not SCORM**, and use no video, audio or images (starter courses have no media). Video, captions and background removal are not shown on the Showcase yet; the page says so. Showing them needs sample media and a project saved in the desktop app. That is a decision for you (see below).
- No cropped detail screenshots yet (timeline, inspector, import report). The Import report cannot be captured in the browser version of the app.
- Firefox/Safari, keyboard-only and screen-reader testing, and Lighthouse are still Phase 5. Dark mode is implemented but not visually reviewed.
- The demo player inside the iframe is the app's own player UI (dark theme, small button text); it is shown as exported, not restyled.
- GitHub push is still pending (see the end-of-turn note).

## Questions for you
1. **Video demo:** do you have (or can you approve creating) a short sample video, ideally with captions, that I can use to build a media-based demo with the desktop app? Without it, the Showcase stays honest but has no video example.
2. **Concept labels:** for "example presentations" in your brief, the demos above are the real output; I did not add any "Concept" mock-ups. OK to leave it that way?

## Proposed Phase 4 tasks
1. Pricing page from `pricing.ts`: monthly/annual toggle, 4 plan cards, feature comparison table with Available/Planned tags, usage/licence rows, upgrade messaging, enterprise enquiry CTA, FAQ. All prices stay `null` ("Announced at launch").
2. Free-trial messaging hidden unless `trialDays` is set.
3. Flagged account entry points (sign in, sign up, manage account, manage subscription): architecture only, hidden while `accountsEnabled` is false.
4. `docs/licensing-architecture.md` (the recommended design from the Phase 1 plan, in full) and the pricing-memo outline.
5. Switch the homepage plans section to the shared plan components.
