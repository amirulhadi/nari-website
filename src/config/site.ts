/**
 * Site-wide facts and switches.
 *
 * Anything not yet confirmed by the owner is `null` and the UI hides it or shows
 * a neutral "announced at launch" message. Never put invented details here.
 */

export type PrimaryCtaMode = "waitlist" | "download";

export interface ContactChannel {
  /** Verified email address, or null until confirmed. */
  email: string | null;
}

export const site = {
  brand: "NARI Studio",
  shortBrand: "nari",
  tagline: "Interactive e-learning, authored on your desktop.",
  /** <title> for the homepage (kept under 60 characters with the brand). */
  homeTitle: "Desktop e-learning authoring software",
  description:
    "NARI Studio is a desktop authoring tool for building interactive e-learning courses with quizzes, branching and video, then publishing them as SCORM or HTML5 for any learning management system.",

  /** Registered company name. Not confirmed; the footer shows the brand instead. */
  legalName: null as string | null,

  /** Current app release the website describes (from the screenshot manifest). */
  productStage: "Early access",
  platforms: { windows: "available-in-early-access", macos: "planned" } as const,

  contact: {
    general: { email: null } as ContactChannel,
    sales: { email: null } as ContactChannel,
    enterprise: { email: null } as ContactChannel,
    support: { email: null } as ContactChannel,
  },

  social: {} as Record<string, string>,

  /**
   * Primary call to action. "waitlist" → Join early access (/early-access).
   * Switch to "download" at public release → Download for Windows (/download).
   */
  primaryCta: { mode: "waitlist" as PrimaryCtaMode },

  flags: {
    /** Sign in / account links. No account system exists yet. */
    accountsEnabled: false,
    /** Real prices on the pricing page. Not approved yet. */
    pricingPublished: false,
    /** Early-access form accepts submissions. Shown but disabled until approved. */
    waitlistFormEnabled: false,
    /** Public installer downloads. */
    downloadsEnabled: false,
  },
} as const;

/**
 * Account entry points. There is NO account system yet. When one exists it will be a
 * separate app (see docs/licensing-architecture.md); set `account.appUrl` to its origin
 * and `flags.accountsEnabled = true` to switch these links on. Until then no account
 * link is rendered anywhere, so nothing pretends to work.
 */
export const account = {
  /** Origin of the future account / billing portal, e.g. "https://account.example.com". */
  appUrl: null as string | null,
  paths: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    startTrial: "/sign-up?trial=1",
    manageAccount: "/account",
    manageSubscription: "/account/billing",
  },
} as const;

export type AccountLinkKey = keyof typeof account.paths;

/** Absolute URL for an account action, or null while accounts are not enabled. */
export function accountUrl(key: AccountLinkKey): string | null {
  if (!site.flags.accountsEnabled || !account.appUrl) return null;
  return new URL(account.paths[key], account.appUrl).href;
}

export function primaryCta() {
  return site.primaryCta.mode === "download" && site.flags.downloadsEnabled
    ? { label: "Download for Windows", href: "/download/" }
    : { label: "Join early access", href: "/early-access/" };
}

export function copyrightHolder() {
  return site.legalName ?? site.brand;
}
