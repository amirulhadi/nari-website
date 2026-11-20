/**
 * Plans: the single source for everything on pricing surfaces.
 *
 * Tier contents follow docs/subscription-feature-matrix.md. Prices are NOT set:
 * `monthly` / `annual` stay null until the owner approves a pricing memo, and the UI
 * shows "Pricing announced at launch" for null prices. Nothing here enforces
 * anything in the desktop app.
 */

export type PlanId = "free" | "pro" | "team" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  audience: string;
  summary: string;
  /** Price per month in the display currency, or null when not published. */
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
  /** Free-trial length for paid plans in days. Null hides trial messaging. */
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
