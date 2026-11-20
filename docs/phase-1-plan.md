# NARI Studio Website — Phase 1: Product Review & Website Plan

Status: **proposal for review — no website code written yet.**
Date: 2026-11-20
Product source reviewed: `D:\Projects NARI\NARI` (v0.9.0 release candidate), including `README.md`, `PROJECT_CONTEXT.md` (§1–31), `docs/product.md`, `docs/roadmap.md`, `docs/release.md`, `src-tauri/tauri.conf.json`, the app's styles and Home screen.

---

## 1. What the product actually is today

NARI Studio is an **offline, desktop e-learning authoring tool** (Tauri 2 + Rust + React 19). Authors build slide-based courses with timed objects, interactions and quizzes, preview them, and publish **HTML5** or **SCORM 1.2 / SCORM 2004 (4th Ed.)** packages. It can **import PowerPoint and Captivate** files as starting points and produces an **Import report** that says what converted and what to fix.

### 1.1 Verified capabilities (safe to market as "Available")

| Area | Capabilities (from as-built notes and tests) |
|---|---|
| Projects | New / open / save / save as, autosave (~3 s), atomic save with `.bak`, recent projects, unsaved-changes protection, 5 course starter templates (Blank, Knowledge quiz, Lesson with knowledge check, Branching scenario, Drag-and-drop practice) |
| Slides | Add from 11 slide layouts, duplicate, delete, rename, reorder, hide, colour or image backgrounds, thumbnails |
| Canvas | Select, marquee, move, resize, rotate, snap, zoom/pan, arrow nudge, copy/paste across slides, align, layer order, edit text on the slide, undo/redo |
| Objects | Text, captions, 4 shapes, buttons, images, audio, video, questions, results summary |
| Images | Crop, fit, filters, blend modes, border/radius/shadow, alt text / decorative |
| Video & audio | Autoplay/loop/controls, poster frames, **chroma-key background removal**, "wait until video ends" gating |
| Captions | Timed cues on the timeline, **SRT/VTT import**, learner CC on/off |
| Timeline | Per-object start/duration, trim, scrub, zoom, slide duration, timeline bookmarks that run actions |
| Animation | 14 enter/exit effects (fade, fly ×4, zoom, wipe, morph, page-turn ×4), reduced-motion respected in export |
| Interactions | Click → action lists (go to slide, show/hide/toggle, set variable, play/pause media, set state, exit course …), element states, **branching** (`If … go to slide`), conditions on interactions, **show-when** rules, **live text** (`{{score}}`, variables) |
| Assessment | Multiple choice, true/false, **drag-and-drop** (dedicated + using any slide objects), object-choice quizzes, attempts, feedback, **question pools & randomisation**, **results slide**, **review mode**, **try again**, pass mark |
| Accessibility | Accessibility checks (missing alt text, low contrast, media without captions), keyboard-operable exported player, screen-reader live region, course language |
| Quality | Validation badge with "Go to" links, pre-export check dialog |
| Publishing | HTML5 package, SCORM 1.2, SCORM 2004 4th Ed.: completion rules, pass/fail, score, `cmi.interactions`, **resume (suspend_data)**, session time |
| Migration | PowerPoint (.pptx) and Captivate (.cpt/.cptx) import (best-effort) + **Import report** |
| Privacy | Works fully offline, **no telemetry**, course files stay on the user's machine |
| Platform | **Windows** installer (NSIS + MSI) |

### 1.2 Must be labelled honestly

| Item | Label |
|---|---|
| macOS build | **Planned** (not set up: needs Apple developer account + notarisation) |
| Real-LMS verification (SCORM Cloud, Moodle …) | Tested against simulated LMSs only — do **not** claim "works with every LMS" until `docs/scorm_lms_testing.md` is run |
| PowerPoint / Captivate import | "Best-effort starting point" — interactions, quizzes, animations, notes not imported. Not yet run on real customer files |
| Screen-reader testing (NVDA/JAWS/VoiceOver), VPAT | Not done — say "accessibility checks built in", never "WCAG compliant" |
| xAPI / cmi5, text-to-speech, AI assistance, rich text, grouping | **Planned** |
| Accounts, cloud, collaboration, team admin, SSO | **Do not exist** (no backend at all) |
| Code signing, auto-update, licence activation | Not yet — affects the download experience |

### 1.3 Facts that shape the website

- **No backend, no auth, no accounts, no payments, no licensing.** Every sign-in / subscription entry point must be a configuration flag, off by default.
- **No brand assets.** The app icon is still the **default Tauri placeholder**; the wordmark is "NARI Studio" set in Georgia. A real logo is needed before launch.
- **No verified contact details, domain, company legal name.** `tauri.conf.json` publisher and copyright are placeholders.
- **No screenshots, no customer content, no testimonials.** But the app runs in browser mock mode (`npm run dev`) and ships 5 starter templates → we can generate **real, reproducible screenshots** and **real exported courses** for the Showcase.
- App visual language: dark slate chrome, **teal** accent (`teal-500` is the primary button), serif wordmark. The website should feel like the same family.

---

## 2. Positioning & messaging

### 2.1 Positioning statement

> For instructional designers and training teams who need professional, LMS-ready interactive courses, **NARI Studio** is a desktop authoring tool that takes you from slides to SCORM in one focused workspace — with quizzes, branching and video built in, your files kept on your own machine, and a path in from PowerPoint and Captivate.

### 2.2 What sets it apart (only verified points)

1. **Focused & fast** — one desktop app: build, preview, publish. No cloud lock-in, works offline.
2. **Real interactivity, not just slides** — drag-and-drop, branching by score, question pools, results & review.
3. **LMS-ready output** — SCORM 1.2 / 2004 with completion rules, pass marks and resume.
4. **Bring your existing content** — PowerPoint and Captivate import with an honest Import report.
5. **Private by design** — no telemetry; course files never leave your computer.
6. **Accessibility built into the workflow** — alt text, contrast and caption checks before you publish.

### 2.3 Tagline & headline (recommendation first)

| Use | Copy |
|---|---|
| **Tagline (recommended)** | **Interactive e-learning, authored on your desktop.** |
| Alternative | From slides to SCORM, without the heavyweight. |
| Alternative | Build it. Branch it. Ship it to any LMS.* (*only after real-LMS testing) |
| **Homepage H1** | **Build interactive courses. Publish to your LMS.** |
| Sub-headline | NARI Studio is a desktop authoring tool for instructional designers and training teams. Design slides, add video, quizzes and branching, then export SCORM or HTML5 — all offline, with your files on your own machine. |

Tone: plain, specific, confident; numbers and nouns over adjectives. No "revolutionary", "AI-powered", "trusted by".

### 2.4 SEO themes (one primary topic per page, no stuffing)

| Page | Primary topic | Secondary |
|---|---|---|
| Home | e-learning authoring software | desktop authoring tool, SCORM authoring tool |
| Features | interactive course creation | SCORM export, drag and drop quiz, branching scenarios |
| Solutions / corporate training | corporate training content creation | compliance training, onboarding |
| Solutions / education | digital learning authoring tool for educators | |
| Showcase | interactive e-learning examples | |
| Pricing | e-learning authoring software pricing | |
| Features → Migration | PowerPoint to SCORM, Captivate alternative* | |

\*Third-party product names only in descriptive, nominative use, with a "not affiliated with Adobe or Microsoft" note in the footer.

---

## 3. Repository & technical architecture

### 3.1 Recommendation: **a separate repository** (this folder)

| | Same repo (monorepo `apps/website`) | **Separate repo (recommended)** |
|---|---|---|
| Release cadence | Tied to app tags & CI | Independent — publish copy changes daily |
| CI | App CI (Rust build, 5 min) runs on every copy change unless carefully filtered | Fast, web-only CI |
| Repo weight | App repo holds large local samples (`*.cpt`, `*.zip`) | Clean |
| Access | Marketers/contractors get app source | Can be given website-only access |
| Code sharing | Possible, but the app has no UI library worth sharing | Brand tokens copied once; screenshots generated *from* the app by a script |
| Deploy | Needs path filters | One repo → one static site |

The only real coupling is **screenshots and demo courses**, solved with a capture script that runs the app's dev server and writes images/exports into this repo (`scripts/capture/`).

### 3.2 Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro** (static output) | Ships zero JS by default → fast, SEO-friendly; file-based routes; built-in image optimisation; React islands only where needed |
| Styling | **Tailwind CSS 4** + CSS custom-property design tokens | Same as the app; tokens in one file |
| Language | TypeScript (strict) | Same as the app |
| Content | Typed config files (`src/config/*.ts`) + Astro content collections for showcase/solutions/changelog | Pricing, features and plans editable without touching layout |
| Interactivity | Small vanilla/Astro scripts (billing toggle, nav menu, showcase filter) | No React runtime unless needed |
| Dependencies | `astro`, `@astrojs/sitemap`, `tailwindcss`, `@tailwindcss/vite`; fonts self-hosted | Minimal; no analytics/CRM/forms until approved |
| Hosting | **Cloudflare Pages** (recommended) — or Netlify/Vercel | Free tier, global CDN, preview deploys per branch, headers file for security; R2 can later host installers |
| Security | Strict CSP + security headers in `public/_headers`, no secrets in repo, `.env.example` only | |

### 3.3 Proposed structure

```
NARI Website/
  docs/                      plan, design system, pricing & licensing architecture, deployment
  public/                    favicons, robots.txt, _headers, og images
  scripts/capture/           screenshot + demo-export pipeline (runs the app in mock mode)
  src/
    config/
      site.ts                name, URLs, contact, feature flags (accountsEnabled, pricingPublished, downloadsEnabled)
      pricing.ts             plans, placeholder prices, allowances, comparison matrix
      features.ts            feature catalogue with status: available | in-development | planned
      navigation.ts
    content/                 showcase/, solutions/, changelog/  (Markdown/MDX)
    components/              ui/ (Button, Badge, Card, Section, StatusTag, Field…), marketing/ (Hero, FeatureGrid, PlanCard, ComparisonTable, FAQ, CTA, ProductFrame…)
    layouts/BaseLayout.astro SEO head, OG, JSON-LD, header/footer
    pages/                   routes below
    styles/tokens.css        design tokens (light + dark)
```

---

## 4. Sitemap

| Route | Purpose | Primary CTA |
|---|---|---|
| `/` | Understand in 5 s, see the product, start | Get started |
| `/features` | Capabilities by category, each with a real screenshot/clip; status tags | Get started / See examples |
| `/solutions` | Overview of use cases | — |
| `/solutions/corporate-training` | Problem → how NARI helps → template to start from | Get started |
| `/solutions/employee-onboarding` | 〃 | |
| `/solutions/compliance-training` | 〃 (pools, pass marks, SCORM completion) | |
| `/solutions/education` | Educators & institutions | |
| `/solutions/freelancers` | Independent / freelance developers | |
| `/showcase` | Gallery of real courses built with NARI Studio | Try the demo |
| `/showcase/[slug]` | **Live, playable exported course** embedded + how it was built | Build one like this |
| `/pricing` | Plans, monthly/annual, comparison, FAQ | Get started / Talk to sales |
| `/download` | Target of "Get started": system requirements, installer, release notes (or early-access form — see decisions) | Download for Windows |
| `/about` | Vision, mission, principles | |
| `/contact` | General / Sales / Enterprise / Support routes | |
| `/changelog` | Release notes (trust signal, cheap to maintain) | |
| `/legal/privacy`, `/legal/terms`, `/legal/eula` | Required before downloads/payments (text needs owner/legal) | |
| `/404` | | |
| *(flagged off)* `/signin`, `/signup`, `/account`, `/account/billing` | Future — links resolve to the account app when `accountsEnabled` | |

Solutions start as 5 focused pages (better for search than one long page); a sixth (professional development) can be added from the same template.

### Navigation

- **Header:** Logo · Features · Solutions ▾ · Showcase · Pricing · Download | *(Sign in — hidden until accounts exist)* · **[Get started]**
- **Footer:** Product (Features, Showcase, Pricing, Download, Changelog) · Solutions · Company (About, Contact) · Legal · "Not affiliated with Adobe or Microsoft" note · © line.

---

## 5. Page plans (key sections)

### Home
1. **Hero** — H1 + sub-headline, `Get started` + `Explore features`, small line "Windows · Works offline · SCORM 1.2 & 2004". Below: a **large real screenshot of the editor** (slide canvas + timeline + inspector), in a minimal window frame — the visual centrepiece.
2. **Workflow strip** — Build → Interact → Preview → Publish, each a cropped real UI detail.
3. **Benefits (3)** — Focused & offline · Real interactivity · LMS-ready output.
4. **Feature highlights (alternating, 4 max)** — Drag-and-drop & quizzes · Branching & live text · Video with chroma key & captions · Import report for PowerPoint/Captivate.
5. **See it in action** — 3 showcase cards linking to playable demo courses.
6. **Who it's for** — 4 audience tiles linking to Solutions.
7. **Publishing** — SCORM 1.2 / 2004 / HTML5 details: completion rules, pass mark, resume.
8. **Pricing intro** — "Start free. Upgrade when you publish professionally." + link.
9. **Final CTA**.

### Features
Sticky in-page nav: Authoring · Slides & templates · Media · Video & audio · Interactions & logic · Quizzes & assessment · Accessibility · Publishing · Migration · Roadmap. Each block: short problem-oriented intro, real screenshot, bullet list driven by `features.ts`, with **Available / In development / Planned** tags. A **Roadmap** block at the end lists planned items (macOS, xAPI/cmi5, TTS, AI assist, collaboration) clearly as plans.

### Solutions (template)
Hero → "The challenge" → "How NARI Studio helps" (3–4 mapped capabilities) → recommended starter template + screenshot → related showcase → CTA.

### Showcase
Real courses built from the app's starter templates, customised with neutral content, exported by NARI Studio and **embedded as the actual HTML5 player** (iframe, sandboxed). Each labelled "Built with NARI Studio v0.9 from the *X* template". Planned items: Compliance quiz (pools, pass mark), Branching scenario, Onboarding lesson with video & captions, Drag-and-drop practice. Anything not produced by the app is labelled **"Concept"**.

### About
Vision ("Professional e-learning authoring should be focused, affordable and in the author's control"), mission, principles (Honest output, Your files stay yours, Accessible by default, Standards first). No history, customer counts or market claims.

### Contact
Four cards (General, Sales, Enterprise, Support) each with the approved channel. Until a form backend is approved: **mailto links to verified addresses only**; support also points to the Download page's diagnostics instructions (About → Copy diagnostics already exists in the app).

---

## 6. Pricing presentation & subscription model

### 6.1 What can sensibly be tiered — given the product as it is

Because NARI Studio is **offline and local-first**, several usual SaaS metrics don't fit:

| Metric | Fit | Reason |
|---|---|---|
| Number of projects | ✗ **Avoid** | Projects are local folders — easy to bypass and hostile to users |
| Storage | ✗ (for now) | No cloud storage exists; only relevant once cloud sync/review exists |
| **Seats (named users / devices)** | ✓ **Primary** | Standard for desktop authoring tools; enforceable with licence activation |
| **Commercial use & output branding** | ✓ | "Made with NARI Studio" badge in the exported player on Free; removed on paid |
| **Publishing formats** | ✓ (light) | All formats available on Free; future formats (xAPI/cmi5) can be Pro+ |
| Premium content (template packs, themes) | ✓ later | Not built yet — mark Planned |
| AI / TTS credits | ✓ later | Usage-based add-on once built |
| Collaboration, review links, shared libraries | ✓ Team, later | Requires backend — Planned |
| Admin, SSO, offline licence files, invoicing | ✓ Enterprise | Business/process value |
| Support level | ✓ | Community → email → priority → SLA |

### 6.2 Recommended tier contents

| | **Free** | **Pro** | **Team** | **Enterprise** |
|---|---|---|---|---|
| For | Individuals exploring & learning | Freelancers, independent IDs | L&D / training teams | Large organisations, institutions |
| Full editor, all object types, interactions, quizzes, branching | ✓ | ✓ | ✓ | ✓ |
| Unlimited projects (local) | ✓ | ✓ | ✓ | ✓ |
| HTML5 + SCORM 1.2 / 2004 export | ✓ with "Made with NARI Studio" badge | ✓ no badge | ✓ | ✓ |
| PowerPoint & Captivate import + Import report | ✓ | ✓ | ✓ | ✓ |
| Commercial use licence | Personal / evaluation | ✓ | ✓ | ✓ |
| Custom player branding (logo/colours) | — | Planned | Planned | Planned |
| Premium templates & themes | — | Planned | Planned | Planned |
| xAPI / cmi5 export | — | Planned | Planned | Planned |
| AI / TTS credits | — | Planned (add-on) | Planned | Planned |
| Seats | 1 | 1 (2 devices) | 3+ | Volume |
| Central billing & seat management | — | — | Planned | Planned |
| Shared template library, review links | — | — | Planned | Planned |
| SSO, offline licence files, security review, invoicing | — | — | — | Planned / by agreement |
| Support | Community / docs | Email | Priority email | Dedicated + SLA |

**Why this is fair:** the Free plan is a genuinely complete tool — the main paywall is **commercial use and unbranded output**, which is what professionals sell. This avoids crippling essential functionality and is easy to enforce at export time. Team and Enterprise are mostly sold on **seats, administration and support** today, with collaboration added once a backend exists.

Optional alternative to discuss: limit Free to SCORM *1.2 only* or N slides per export — I **don't** recommend it (it damages first impressions and evaluation inside an LMS).

### 6.3 Pricing page design

- Header: "Simple plans that grow with you." Monthly/Annual **toggle** (annual shows "save X%" from config).
- 4 plan cards; Pro highlighted. Price field from `pricing.ts`; while `price: null` the card shows **"Pricing at launch"** and the CTA becomes **"Get started free"** / **"Join the Pro waitlist"** / **"Contact sales"** (depending on approved flows).
- Comparison table generated from the same config, with **status tags** (Available / Planned) so we never sell what isn't built.
- Free-trial line driven by `trialDays` (null = hidden).
- Upgrade messaging: "Start on Free — your projects carry over when you upgrade. Nothing to migrate."
- Enterprise block → Contact (enterprise).
- FAQ: Is the Free plan really free? Can I use Free commercially? What happens to my projects if I cancel? (they stay on your computer and remain editable; only paid export options revert) · Do I need internet? · Which LMSs? · macOS? · Refunds? · Student/education pricing?
- **Every price, discount and allowance lives in one file** — no redesign to change pricing.

### 6.4 Price-setting approach (no prices proposed yet)

Prices to be decided in a separate approval step, based on: (1) competitor reference points (major desktop/cloud authoring suites are typically priced per seat per year in the high hundreds to over a thousand USD — **to verify with current data before deciding**); (2) NARI's narrower scope today (Windows-only, no cloud review) → price clearly below incumbents; (3) annual-first billing with ~15–20% annual discount; (4) regional/education pricing via the payment provider. I'll prepare a short pricing memo with sourced competitor data when we reach Phase 4.

---

## 7. Future subscription & licensing architecture (document only — nothing to implement now)

### 7.1 Components

```
 Website (static, Astro)          Account portal (future web app)        Payment provider (Merchant of Record)
 marketing, pricing, download ──► sign up / sign in, seats, invoices ◄──► checkout, tax, renewals, dunning,
                                        │                                  upgrades/downgrades, customer portal
                                        ▼                                         │ webhooks
                                 Licensing API (small backend) ◄──────────────────┘
                                 accounts · subscriptions · entitlements · device activations
                                 issues SIGNED licence tokens (Ed25519)
                                        ▲
                                        │ HTTPS (activate / refresh / deactivate)
 NARI Studio desktop (Tauri)  ──────────┘
   Rust: stores token in OS keychain, verifies signature offline with an embedded public key,
         enforces entitlements in the export commands (badge, formats)
   UI:  shows plan, "Sign in", "Manage subscription" (opens portal in the browser)
```

### 7.2 Key decisions

| Topic | Recommendation |
|---|---|
| **Payment processing** | A **Merchant of Record** (e.g. Paddle or Lemon Squeezy) — handles global sales tax/VAT, invoices, renewals, upgrades/downgrades, cancellation, payment history and a hosted billing portal. Far less work and tax risk for a small company than raw Stripe. (Stripe Billing + Stripe Tax is the alternative if a local entity and accountant are in place.) |
| **Auth** | Managed auth (e.g. Clerk, Auth0, Supabase Auth) for the portal. Desktop signs in via the **system browser + OAuth PKCE** with a deep link / loopback redirect — never a password field inside the app. |
| **Licence format** | Short-lived **signed entitlement token** (plan, features, seat, device id, `expires`, `refreshAfter`). Verified **offline in Rust** with an embedded public key. Private key only on the server. |
| **Refresh & offline** | Refresh silently every ~7 days; **offline grace period ~30 days** after expiry of the refresh window; Enterprise gets **offline licence files** (signed, long-lived, device-bound) for air-gapped sites. |
| **Expiry behaviour** | On lapse the app **never locks the user out of their projects**: editing and opening keep working, paid-only export options revert to Free behaviour. |
| **Enforcement point** | In the **Rust export command** (badge injection, format availability) — not in the website and not only in TypeScript. Accept that a determined user can patch a desktop app; aim for honest-user friction, not DRM. |
| **Device activations** | Per seat: 2 devices (Pro), deactivate from the app or portal. |
| **Usage limits** | Only for future cloud/AI features (metered server-side, where they can actually be enforced). |
| **Privacy** | The licence check sends only account id, device id (hashed) and app version — consistent with "no telemetry". Opt-in, documented. |
| **App changes needed later** | Add licence API host to the CSP `connect-src`; `keyring` crate for token storage; deep-link plugin; `tauri-plugin-updater` (also needs signing keys); code-signing certificate. |

### 7.3 Roadmap (after the website)

1. **L0 – Prereqs:** company/legal name, EULA & privacy policy, code signing, auto-update. *(needed before paid launch regardless)*
2. **L1 – Accounts & checkout:** MoR products & prices, account portal, webhooks → licensing DB.
3. **L2 – Licence API & desktop activation:** sign-in, token issue/verify, plan display, export enforcement, offline grace.
4. **L3 – Team:** seat assignment, admin roles, invoices.
5. **L4 – Enterprise:** offline licence files, SSO for portal, volume/PO billing.
6. **L5 – Cloud features (optional):** review links, shared libraries, AI/TTS credits with metering.

A full version of this goes into `docs/licensing-architecture.md` in Phase 4.

---

## 8. Visual design direction

**Concept: "Editorial calm, product forward."** A light, paper-like page with ink-dark type lets the dark NARI editor screenshots carry the colour and attention.

| Token | Proposal |
|---|---|
| Background | Warm off-white `#F7F6F2`; surface `#FFFFFF`; subtle border `#E6E3DC` |
| Ink | `#0E1420` (text), `#4A5363` (secondary), `#7A8291` (muted) |
| Accent | **Teal** (continuity with the app): `#0F766E` for links/buttons on light, `#14B8A6` highlights; used sparingly |
| Product dark | `#0F172A` slate (app chrome) for screenshot frames and one dark showcase band |
| Status tags | Available = teal, In development = amber, Planned = slate outline |
| Display type | A refined serif (e.g. **Instrument Serif** or **Fraunces**) — echoes the app's serif wordmark |
| Body/UI type | **Inter** (or Geist) — self-hosted, variable |
| Scale | 12 / 14 / 16 / 18 / 20 / 24 / 32 / 44 / 60 / 76 px; body 17px/1.6 |
| Spacing | 4-px base; section padding 96–160 px desktop, 64 px mobile; content max 1200 px, text max 68ch |
| Radius | 6 px controls, 12 px cards, 14 px product frames |
| Shadows | One soft shadow for product frames only; cards are bordered, not floating |
| Motion | Fade/translate 8 px on scroll-in, 200–300 ms, disabled under `prefers-reduced-motion` |
| Dark mode | Supported via tokens (respects system), light is the default identity |
| Imagery | Only real UI captures and real exported courses; simple line icons (inline SVG, one set) — **no stock photos** |

**Logo:** the current app icon is the default Tauri placeholder. Proposal: a simple **"N" monogram built from a slide frame + play/branch mark** with a serif "NARI Studio" wordmark, delivered as SVG in Phase 2 for approval — and reusable as the app icon later.

Components in the design system: Button (primary/secondary/ghost/link, sm/md/lg), Badge/StatusTag, Card, Section header, ProductFrame (window chrome + caption), FeatureRow, PlanCard, ComparisonTable, FAQ (native `<details>`), Callout, Form fields (for later), Header with mobile menu, Footer.

---

## 9. Product visualisation plan

1. **Capture pipeline** (`scripts/capture/`): start the app's Vite dev server (browser mock mode), drive it with a headless browser, open each **starter template**, set up the view (selection, panel, timeline) and save PNG → converted to AVIF/WebP by Astro. Re-runnable for every release so screenshots never drift from the product.
2. **Real exports**: build 3–4 demo courses from templates in the app and export them as HTML5; commit the exported folders under `public/demos/` and embed them on Showcase pages.
3. **Short clips** (optional, Phase 5): 5–10 s muted loops (drag-and-drop, branching) recorded from the real app.
4. Everything is labelled with app version; concepts are labelled **"Concept"**.

Limitation: mock mode can't run import or native file dialogs — the Import report screenshot will be rendered from a sample report (as the app's own tests do) and labelled accordingly, or captured from the desktop build manually.

---

## 10. Conversion journey

| Stage | Visitor need | Page | CTA |
|---|---|---|---|
| Discover | "What is this?" | Home hero, Solutions (search landing) | Get started · Explore features |
| Understand | "Can it do what I need?" | Features | See examples |
| Evaluate | "What does the output look like?" | Showcase (playable) | Build one like this → Get started |
| Compare | "What does it cost / which plan?" | Pricing | Get started free · Contact sales |
| Act | | Download / Contact | Download for Windows · Enquiry |
| Convert (future) | | Account portal | Upgrade |

Prepared integration points (no services connected): a single `analytics.ts` event helper (no-op by default) on every CTA with `data-cta` attributes; newsletter/lead forms behind flags; contact routes in `site.ts`.

---

## 11. Implementation roadmap

| Phase | Deliverables | Exit check |
|---|---|---|
| **2 — Design system & Home** | Repo setup (Astro, Tailwind, tokens), logo proposal, Header/Footer/mobile nav, UI components, capture pipeline + first real screenshots, Homepage | Lighthouse ≥ 95 on Home, mobile/desktop review |
| **3 — Marketing pages** | Features (with status tags), 5 Solutions pages, Showcase with 3–4 playable demo courses, About, Contact | All copy traceable to verified capabilities |
| **4 — Commercial** | Pricing page from config (toggle, comparison, FAQ), Download page, flagged account entry points, `docs/licensing-architecture.md`, pricing memo for approval | Prices still placeholders until approved |
| **5 — Polish** | SEO (titles, meta, OG images, sitemap, robots, JSON-LD `SoftwareApplication` + `Organization` + `FAQPage`), accessibility audit (axe, keyboard, contrast), performance, cross-browser (Chrome, Edge, Firefox, Safari/iOS) | axe clean, CWV good |
| **6 — Production** | Cloudflare Pages config, `_headers` (CSP etc.), env docs, domain/DNS guide, production build, final QA, README | Preview deploy reviewed |

After each phase: review, fix, summary, docs update, next tasks — as requested.

---

## 12. Decisions needed from you before / during Phase 2

1. **Repository** — confirm a separate repo in `D:\01_SOFTWARE_DEVELOPMENT\NARI Website` (recommended).
2. **"Get started" destination** — (a) **Download for Windows** (installer from GitHub Releases / storage; ideally after code signing), or (b) **Join early access** (needs a form service → approval), or (c) Download now, early-access for macOS. *Recommended: (a) + macOS waitlist later.*
3. **Contact details** — the email address(es)/domain to publish, and the company/legal name for the footer, EULA and privacy policy.
4. **Domain & hosting** — the planned domain; Cloudflare Pages OK?
5. **Free plan model** — approve "full features, badge on export, non-commercial" (recommended) or prefer another split.
6. **Logo** — OK for me to propose a new mark in Phase 2 (and later reuse it as the app icon)?
7. **Typeface pairing** — serif + Inter as proposed (Instrument Serif or Fraunces), or sans-only.

Until answered I will use clearly marked placeholders and feature flags — nothing will pretend to work.
