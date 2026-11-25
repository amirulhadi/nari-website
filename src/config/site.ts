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
  /** Master brand. Products are named "NARI ___" and listed in `products` below. */
  brand: "NARI",
  tagline: "Learning software that works as one system.",
  /** <title> for the homepage (kept under 60 characters with the brand). */
  homeTitle: "Learning software that works as one system",
  description:
    "NARI makes learning software that works as one system: NARI Studio to author interactive courses on your desktop, and NARI Campus to publish, deliver and track them.",

  /** Registered company name. Not confirmed; the footer shows the brand instead. */
  legalName: null as string | null,

  /** Current stage the website describes. */
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

/**
 * The products NARI offers today. Add an entry only when a real product exists;
 * the site has no placeholder slot for future products.
 */
export type ProductId = "studio" | "campus";

export interface Product {
  id: ProductId;
  /** Full name, always "NARI ___". */
  name: string;
  /** Short form, allowed after the full name has been used on the page. */
  short: string;
  /** What kind of product it is, in plain words. */
  descriptor: string;
  /** One line: what it does today. */
  description: string;
  /** Honest stage label. */
  status: string;
  /** Root-relative product page. */
  path: string;
}

export const products: Product[] = [
  {
    id: "studio",
    name: "NARI Studio",
    short: "Studio",
    descriptor: "Desktop authoring",
    description: "Build interactive courses with quizzes, branching and video, then export SCORM or HTML5.",
    status: "Beta for Windows",
    path: "/studio/",
  },
  {
    id: "campus",
    name: "NARI Campus",
    short: "Campus",
    descriptor: "Learning management",
    description: "Publish SCORM courses, let people learn from them and see who finished.",
    status: "Early demo",
    path: "/campus/",
  },
];

export function getProduct(id: ProductId): Product {
  return products.find((p) => p.id === id)!;
}

/**
 * NARI Studio download switch.
 *
 * `url` is null until the first installer is published on GitHub Releases
 * (repo amirulhadi/nari-studio). While it is null, the Studio button reads
 * "Join the beta" and links to /early-access/. Set `url` to the release page or
 * installer URL and the same button reads "Download for Windows (beta)" and links
 * there. Nothing else needs to change. Do not set it before the installer exists.
 */
export const studioDownload: { url: string | null } = { url: null };

/** Primary button for NARI Studio, driven by `studioDownload.url`. */
export function studioCta(): { label: string; href: string; external: boolean } {
  return studioDownload.url
    ? { label: "Download for Windows (beta)", href: studioDownload.url, external: true }
    : { label: "Join the beta", href: "/early-access/", external: false };
}

/**
 * NARI Campus early demo: the live demo deployment on Cloudflare Workers.
 * Change `demoUrl` here if the demo moves.
 */
export const campus = {
  demoUrl: "https://nari-lms-app.nari-digital.workers.dev",
} as const;
