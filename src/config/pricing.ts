/**
 * Plans: the single source for everything on pricing surfaces (homepage, /pricing/).
 *
 * Tier contents follow docs/subscription-feature-matrix.md (a PROPOSAL, not final).
 * Prices are NOT set: `monthly` / `annual` stay null until the owner approves a pricing
 * memo (docs/pricing-memo-outline.md); the UI then shows "Announced at launch".
 * To publish prices: set the numbers below, set `site.flags.pricingPublished = true`.
 * Nothing here enforces anything in the desktop app.
 */

export type PlanId = "free" | "pro" | "team" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  audience: string;
  summary: string;
  /** Price per month when billed monthly, or null when not published. */
  monthly: number | null;
  /** Price per month when billed annually, or null when not published. */
  annual: number | null;
  /** "seat" = per user; "flat" = per account; "custom" = by agreement. */
  unit: "flat" | "seat" | "custom";
  highlights: string[];
  cta: "early-access" | "contact-sales";
  featured?: boolean;
}

export const pricing = {
  currency: "USD",
  /** Annual discount shown on the billing toggle, e.g. 17 → "Save 17%". Null hides it. */
  annualSavingPercent: null as number | null,
  /** Free-trial length for paid plans in days. Null hides all trial messaging. */
  trialDays: null as number | null,
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    audience: "For individuals exploring NARI Studio",
    summary: "The complete editor for personal, education and evaluation use.",
    monthly: 0,
    annual: 0,
    unit: "flat",
    highlights: [
      "Every authoring, quiz and branching feature",
      "Unlimited projects",
      "SCORM 1.2, SCORM 2004 and HTML5 export",
      "\"Made with NARI Studio\" badge in exported courses",
    ],
    cta: "early-access",
  },
  {
    id: "pro",
    name: "Pro",
    audience: "For freelancers and professional creators",
    summary: "Commercial use and unbranded output.",
    monthly: null,
    annual: null,
    unit: "flat",
    highlights: ["Everything in Free", "Commercial use licence", "No NARI badge in exported courses", "Email support"],
    cta: "early-access",
    featured: true,
  },
  {
    id: "team",
    name: "Team",
    audience: "For training and L&D teams",
    summary: "Several seats on one account.",
    monthly: null,
    annual: null,
    unit: "seat",
    highlights: ["Everything in Pro", "Multiple seats, one invoice", "Priority support", "Team administration (planned)"],
    cta: "contact-sales",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    audience: "For large organisations and institutions",
    summary: "Volume licensing and procurement support.",
    monthly: null,
    annual: null,
    unit: "custom",
    highlights: ["Volume or site licensing", "Invoice and purchase-order billing", "Security documentation", "Dedicated support"],
    cta: "contact-sales",
  },
];

/* ------------------------------------------------------------------ */
/* Comparison matrix                                                   */
/* ------------------------------------------------------------------ */

/**
 * A cell is: `true` (included), `false` (not included), a string (shown as text),
 * or `{ planned: "optional text" }` for something that does not exist yet.
 */
export type Cell = boolean | string | { planned: string | true };

export interface ComparisonRow {
  label: string;
  /** Values in the order free, pro, team, enterprise. */
  values: [Cell, Cell, Cell, Cell];
  note?: string;
}

export interface ComparisonGroup {
  title: string;
  rows: ComparisonRow[];
}

const all = (value: Cell): [Cell, Cell, Cell, Cell] => [value, value, value, value];
const planned: Cell = { planned: true };

export const comparison: ComparisonGroup[] = [
  {
    title: "Authoring",
    rows: [
      { label: "Full editor, timeline and animations", values: all(true) },
      { label: "Interactions, branching and live text", values: all(true) },
      { label: "Quizzes: multiple choice, true/false, drag-and-drop, pools, results and review", values: all(true) },
      { label: "Video (background removal), audio and captions", values: all(true) },
      { label: "Accessibility checks", values: all(true) },
      { label: "Starter courses and slide layouts (current set)", values: all(true) },
      { label: "PowerPoint and Captivate import with Import report", values: all(true) },
    ],
  },
  {
    title: "Usage allowances",
    rows: [
      { label: "Projects", values: all("Unlimited"), note: "Projects are local folders on your computer." },
      { label: "Slides per project", values: all("Unlimited") },
      { label: "Users", values: ["1", "1", "3 or more seats", "Volume or site"] },
      { label: "Devices", values: ["No activation needed", "2 devices", "To be confirmed", "By agreement"] },
      { label: "Cloud storage", values: ["Not offered", "Not offered", planned, planned], note: "NARI Studio is a desktop app; cloud storage arrives with cloud features." },
    ],
  },
  {
    title: "Publishing",
    rows: [
      { label: "HTML5, SCORM 1.2 and SCORM 2004 export", values: all(true) },
      { label: "\"Made with NARI Studio\" badge in exported courses", values: ["Shown", "Removed", "Removed", "Removed"] },
      { label: "Custom player branding", values: [false, planned, planned, planned] },
      { label: "xAPI and cmi5 export", values: [false, planned, planned, planned] },
    ],
  },
  {
    title: "Content and productivity",
    rows: [
      { label: "Premium template and theme packs", values: [false, planned, planned, planned] },
      { label: "Save your own reusable templates", values: all(planned) },
      { label: "Text-to-speech and AI assistance", values: [false, { planned: "Credits" }, { planned: "Pooled credits" }, { planned: "Custom" }] },
    ],
  },
  {
    title: "Licence",
    rows: [
      { label: "Permitted use", values: ["Personal, education, evaluation", "Commercial", "Commercial", "Commercial, organisation-wide"], note: "Final licence terms will be published with the EULA." },
      { label: "Works offline", values: all(true) },
      { label: "Offline licence files for restricted networks", values: [false, false, false, planned] },
    ],
  },
  {
    title: "Team and administration",
    rows: [
      { label: "Central billing and seat assignment", values: [false, false, planned, planned] },
      { label: "Shared template and asset library, review links", values: [false, false, planned, planned] },
      { label: "Admin roles and usage overview", values: [false, false, planned, planned] },
      { label: "Single sign-on, invoice and purchase-order billing, security review", values: [false, false, false, { planned: "By agreement" }] },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Support level", values: ["Documentation and community", "Email", "Priority email", "Named contact and service level"] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Subscription benefits and upgrade messaging                         */
/* ------------------------------------------------------------------ */

export const subscriptionBenefits = [
  { title: "Start free, keep your work", body: "Projects are ordinary folders on your computer. Upgrading never requires moving or converting them." },
  { title: "Your projects are never locked", body: "If a paid plan ends, you can still open and edit every project. Only the paid export options go back to Free behaviour." },
  { title: "Pay for professional use", body: "Paid plans are for commercial work, unbranded output, more seats and support, not for access to the core editor." },
];

export const upgradeMessage =
  "Start on Free. When you begin publishing for clients or your organisation, move to Pro, or to Team for several seats. Your projects carry over as they are.";

/* ------------------------------------------------------------------ */
/* FAQ                                                                  */
/* ------------------------------------------------------------------ */

export interface Faq {
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    question: "When will pricing be announced?",
    answer: "Pricing will be announced at launch. NARI Studio is in early access, and the plans on this page are a proposal that may change. We will not charge anyone before the prices are published.",
  },
  {
    question: "Is the Free plan really free, and what does it include?",
    answer: "The proposed Free plan includes the full editor, every quiz and branching feature, unlimited projects and SCORM and HTML5 export. Exported courses carry a small \"Made with NARI Studio\" badge, and Free is intended for personal, education and evaluation use.",
  },
  {
    question: "Can I use the Free plan for client or commercial work?",
    answer: "The proposal is that commercial use requires a paid plan. The final terms will be published with the licence agreement before launch.",
  },
  {
    question: "What happens to my projects if I cancel or downgrade?",
    answer: "Nothing happens to them. Projects stay on your computer and remain fully editable. New exports would go back to Free behaviour, including the badge. Courses you already published are not changed.",
  },
  {
    question: "Do I need an internet connection?",
    answer: "No. NARI Studio works offline today. When paid plans launch, the app is designed to check your licence only occasionally and to keep working through a grace period if you are offline.",
  },
  {
    question: "Which learning management systems does it work with?",
    answer: "NARI Studio exports SCORM 1.2 and SCORM 2004 (4th edition) and standalone HTML5 packages. Packages are tested against simulated LMS environments, and verification in SCORM Cloud and common LMSs is in progress, so we do not yet claim compatibility with specific products.",
  },
  {
    question: "Is there a Mac version?",
    answer: "Not yet. Windows comes first, and macOS is planned.",
  },
  {
    question: "Is there a free trial of the paid plans?",
    answer: "Trial terms have not been decided. Any trial will be announced with the pricing.",
  },
  {
    question: "Is there a discount for education or non-profits?",
    answer: "We are considering an education and non-profit programme. It has not been decided, and details will be announced with the pricing.",
  },
  {
    question: "How do I enquire about Team or Enterprise licensing?",
    answer: "Use the Contact page. Team and Enterprise plans will start with an enquiry, because seat management and organisation-wide features are still being built.",
  },
];
