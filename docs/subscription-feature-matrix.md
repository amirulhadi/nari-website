# NARI Studio — Subscription Feature Matrix (proposal for approval)

Status: **proposal only.** Nothing here is final, no prices are set, and no restriction or licence check will be built until you approve it.
Date: 2026-11-20 · Basis: the app as built at v0.9.0 (`D:\Projects NARI\NARI`, `PROJECT_CONTEXT.md` §8–31).

Legend: ✓ included · — not included · **Planned** = feature doesn't exist yet (shown on the site only with a "Planned" tag) · *[decide]* = open option for you.

---

## 1. Principles

1. **Free has to be a real tool.** Someone on Free can build, preview and publish a complete interactive course. Paid plans sell *professional use*, *scale* and *service*, not access to the basic editor.
2. **Only limit things we can enforce fairly.** NARI is an offline desktop app whose projects are ordinary local folders. Limits that depend on counting local files can be bypassed by copying a folder, and they punish honest users. Limits should sit at **export** (in the Rust export command) or on **server-side services** (which don't exist yet).
3. **Never lock people out of their own work.** When a subscription lapses, all projects still open and stay editable. Only paid export options go back to Free behaviour.
4. **Don't sell what isn't built.** Planned items appear on the pricing page with a "Planned" tag and are never part of the reason to pay today.
5. **Few, clear differences.** Three or four reasons to upgrade per tier, not a long list of small restrictions.

---

## 2. Each dimension evaluated

### 2.1 Project limits
| Option | Assessment |
|---|---|
| Limit the number of projects (e.g. 3 on Free) | ✗ **Not recommended.** Projects are local `.nari` folders, so a limit is easy to get around (copy or rename a folder) and enforcing it would mean the app scanning the user's disk. It frustrates exactly the people evaluating the product. |
| Limit slides per project | ✗ Not recommended. It stops a realistic trial: a real compliance module is 20–60 slides. |
| **Unlimited projects and slides on all plans** | ✓ **Recommended.** |
| Limit *cloud* projects (once cloud sync/review exists) | ✓ Reasonable later, since it's enforced on the server. |

### 2.2 Export capabilities
| Option | Assessment |
|---|---|
| Free exports HTML5 only, SCORM on paid plans | Possible, and a strong upgrade driver, but evaluators can't test the main point of the product (it working in their LMS). Risky for word of mouth. |
| Free exports SCORM 1.2 only, 2004 on paid plans | Arbitrary. Both formats are equally mature in the app. |
| **All current formats (HTML5, SCORM 1.2, SCORM 2004) on Free, with a NARI badge** | ✓ **Recommended.** Evaluation is complete; the badge and the licence terms do the upgrading. |
| Future formats (xAPI, cmi5) on Pro and above | ✓ Recommended **once built** (Planned). |
| Export to video / PDF handouts | Planned at most; not listed until on the roadmap. |

### 2.3 NARI branding on exports
| Option | Assessment |
|---|---|
| **Small "Made with NARI Studio" badge in the exported player's playbar on Free; removed on Pro+** | ✓ **Recommended.** It's the industry-standard free-tier lever, it doesn't get in the learner's way, it's easy to enforce at export, and it markets the product to everyone who takes the course. |
| Watermark over slide content | ✗ Damages the learner experience, looks cheap, and puts educators off. |
| Splash screen at course start | ✗ Adds friction for learners. |
| Custom player branding (logo, colours, loading screen) | Pro+ — **Planned** (doesn't exist yet). |

### 2.4 Commercial use rights
| Option | Assessment |
|---|---|
| **Free = personal, educational and evaluation use; Pro+ = commercial use (selling courses, client work, use inside a business)** | ✓ **Recommended**, enforced by the licence terms (EULA), not by code. |
| Free for commercial use too | Generous, but leaves only the badge as a reason to pay. |
| Free for non-profits and schools | *[decide]* A free or discounted **Education/Non-profit** programme (verified on request) supports the education audience without opening a loophole. |

Note: "personal/evaluation" wording needs a lawyer's review in the EULA. The website will only say "for personal and evaluation use" until the EULA exists.

### 2.5 Storage allowances
| Option | Assessment |
|---|---|
| Storage quota today | ✗ **Not applicable.** NARI stores nothing in the cloud; all media is on the user's disk. Showing a GB allowance would suggest a cloud service that doesn't exist. |
| **Leave storage off the pricing page until cloud features exist** | ✓ **Recommended.** |
| Later: cloud storage for review links, shared libraries and backups (e.g. a small amount on Pro, pooled storage per Team seat) | ✓ Planned, enforced server-side. |

### 2.6 Advanced features
Today the advanced features (branching, question pools, results/review, drag-and-drop, chroma key, captions, accessibility checks, PowerPoint/Captivate import) are what make NARI worth trying.

| Option | Assessment |
|---|---|
| Put branching, pools or import behind Pro | ✗ **Not recommended now.** It makes Free feel like a demo and hides the product's main differences from competitors during evaluation. |
| **Keep all current authoring features on every plan** | ✓ **Recommended.** |
| Put **new** premium value on paid tiers when it's built: premium template packs, custom player branding, text-to-speech narration, AI assistance credits, xAPI/cmi5, saving your own reusable templates | ✓ Recommended (all **Planned**). Server-backed or costly items (TTS, AI) as metered credits. |
| PowerPoint/Captivate import | ✓ All plans. It's the main way people move to NARI. *[decide]* Optionally limit Free imports to N slides — I don't recommend it. |

### 2.7 User limits
| Option | Assessment |
|---|---|
| **Free & Pro: 1 named user** | ✓ Standard for desktop tools. |
| Devices per user | Pro: **2 activated devices** (desktop + laptop), switchable. Free: no activation at all (nothing to enforce). |
| **Team: from 3 seats** (*[decide]* minimum 2, 3 or 5), seats added one at a time, central billing | ✓ Recommended. Seat management needs the licensing backend (**Planned**). |
| Enterprise: volume or site licence, by agreement | ✓ |
| Learner limits | ✗ Never. Exported courses run in the customer's LMS, so NARI shouldn't count learners. |

---

## 3. Recommended matrix

| | **Free** | **Pro** | **Team** | **Enterprise** |
|---|---|---|---|---|
| **Who it's for** | Individuals exploring, students, educators trying NARI | Freelancers, independent instructional designers, consultants | L&D and training departments | Large organisations, institutions, public sector |
| **Price** | Free | *Placeholder — not set* | *Placeholder — per seat* | Contact sales |
| Billing | — | Monthly / Annual | Annual (monthly *[decide]*) | Annual / custom |
| Free trial | — | *[decide]* 14-day Pro trial | *[decide]* 14-day trial | Pilot by agreement |
| **Authoring** | | | | |
| Full editor, timeline, animations, all object types | ✓ | ✓ | ✓ | ✓ |
| Interactions, branching, conditions, live text | ✓ | ✓ | ✓ | ✓ |
| Quizzes: MCQ, T/F, drag-and-drop, pools, results & review | ✓ | ✓ | ✓ | ✓ |
| Video (chroma key), audio, captions (SRT/VTT) | ✓ | ✓ | ✓ | ✓ |
| Accessibility checks | ✓ | ✓ | ✓ | ✓ |
| Starter course & slide templates (current set) | ✓ | ✓ | ✓ | ✓ |
| PowerPoint & Captivate import + Import report | ✓ | ✓ | ✓ | ✓ |
| Projects & slides | Unlimited | Unlimited | Unlimited | Unlimited |
| **Publishing** | | | | |
| HTML5, SCORM 1.2, SCORM 2004 | ✓ | ✓ | ✓ | ✓ |
| "Made with NARI Studio" badge in player | Shown | Removed | Removed | Removed |
| Custom player branding | — | Planned | Planned | Planned |
| xAPI / cmi5 | — | Planned | Planned | Planned |
| **Content & productivity** | | | | |
| Premium template & theme packs | — | Planned | Planned | Planned |
| Save your own reusable templates | Planned | Planned | Planned | Planned |
| Text-to-speech / AI assistance | — | Planned (credits) | Planned (pooled credits) | Planned (custom) |
| **Licence** | | | | |
| Use | Personal, education, evaluation | Commercial | Commercial | Commercial, organisation-wide |
| Users / devices | 1 / any (no activation) | 1 / 2 devices | 3+ seats | Volume / site |
| Offline use | ✓ | ✓ (30-day grace between licence checks) | ✓ | ✓ + offline licence files (Planned) |
| **Team & administration** | | | | |
| Central billing, seat assignment | — | — | Planned | Planned |
| Shared template/asset library, review links | — | — | Planned | Planned |
| Admin roles, usage overview | — | — | Planned | Planned |
| SSO for the account portal, invoice/PO billing, security review | — | — | — | Planned / by agreement |
| **Cloud storage** | Not offered (local files) | Not offered yet | Planned (pooled) | Planned (custom) |
| **Support** | Docs & community | Email | Priority email | Named contact, SLA, onboarding |

### What actually separates the tiers at launch (what's built today)
- **Free → Pro:** commercial use, no badge, email support. *(plus a Pro trial, if approved)*
- **Pro → Team:** several seats on one invoice, priority support. Most Team value (seat admin, shared libraries) is **Planned**, so Team should launch as "contact us" or "coming soon" until the licensing backend exists. *[decide]*
- **Team → Enterprise:** volume licensing, procurement (invoice/PO), security documentation, SLA.

**Implication:** at launch the honest paid offer is essentially **Free + Pro**, with **Team and Enterprise sold through enquiry**. The pricing page can still show all four cards, with Team/Enterprise CTAs set to "Contact sales" and their Planned features tagged.

---

## 4. Upgrade, downgrade, lapse — proposed behaviour (for the FAQ and the future system)

| Event | Behaviour |
|---|---|
| Upgrade Free → Pro | Immediate; next export has no badge; projects unchanged |
| Downgrade Pro → Free / subscription ends | Projects open and edit normally; **new** exports get the badge; courses already published are untouched |
| Offline beyond the grace period | Same as Free until the next successful check; never blocks editing |
| Team seat removed | That user drops to Free; their local projects stay theirs |
| Refunds, cancellation | Through the payment provider's portal; terms to be set with the EULA |

---

## 5. Decisions requested

1. Approve **unlimited projects / no storage quotas** on all plans. *(recommended)*
2. Approve **all current formats on Free with a "Made with NARI Studio" badge**. *(recommended)*
3. Approve **Free = personal/education/evaluation, Pro+ = commercial**. *(recommended)*
4. Approve **all current authoring features on every plan**; premium value only from new features. *(recommended)*
5. Pro trial: yes/no, and length (14 days suggested).
6. Team: launch as "Contact sales" until seat management exists? Minimum seats (3 suggested)?
7. Education / non-profit programme: yes/no.

Pricing amounts come later in a separate pricing memo with sourced competitor data.
