/**
 * Navigation.
 *
 * Pages built in a later phase have `ready: false`. Until then the link goes to
 * `fallback` or is not rendered at all, so the site never links to a missing page.
 */

export interface NavItem {
  label: string;
  href: string;
  ready: boolean;
  /** Used while the page is not ready. Omit to hide the link until then. */
  fallback?: string;
}

/** A top-level entry: a plain link, or a group that opens a small menu. */
export interface NavGroup {
  label: string;
  /** Link target. Omit for a group that only holds `children`. */
  href?: string;
  children?: NavItem[];
}

export const mainNav: NavGroup[] = [
  {
    label: "Products",
    children: [
      { label: "NARI Studio", href: "/studio/", ready: true },
      { label: "NARI Campus", href: "/campus/", ready: true },
    ],
  },
  { label: "Solutions", href: "/studio/solutions/" },
  { label: "Pricing", href: "/pricing/" },
  {
    label: "Company",
    children: [
      { label: "About", href: "/about/", ready: true },
      { label: "Contact", href: "/contact/", ready: true },
    ],
  },
];

/** Section links shown in the thin sub-header on a product's pages. */
export const productNav: Record<"studio" | "campus", { label: string; href: string }[]> = {
  studio: [
    { label: "Overview", href: "/studio/" },
    { label: "Features", href: "/studio/features/" },
    { label: "Solutions", href: "/studio/solutions/" },
    { label: "Showcase", href: "/studio/showcase/" },
    { label: "Beta", href: "/studio/beta/" },
  ],
  campus: [
    { label: "Overview", href: "/campus/" },
    { label: "What it does", href: "/campus/#what-it-does" },
    { label: "Roles", href: "/campus/#roles" },
    { label: "Status", href: "/campus/#status" },
  ],
};

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "NARI Studio",
    items: [
      { label: "Overview", href: "/studio/", ready: true },
      { label: "Features", href: "/studio/features/", ready: true },
      { label: "Publishing", href: "/studio/#publishing", ready: true },
      { label: "Showcase", href: "/studio/showcase/", ready: true },
      { label: "Beta Edition", href: "/studio/beta/", ready: true },
    ],
  },
  {
    title: "NARI Campus",
    items: [
      { label: "Overview", href: "/campus/", ready: true },
      { label: "What it does", href: "/campus/#what-it-does", ready: true },
      { label: "Roles", href: "/campus/#roles", ready: true },
      { label: "Status", href: "/campus/#status", ready: true },
    ],
  },
  {
    title: "Solutions",
    items: [
      { label: "Corporate training", href: "/studio/solutions/corporate-training/", ready: true },
      { label: "Employee onboarding", href: "/studio/solutions/employee-onboarding/", ready: true },
      { label: "Compliance training", href: "/studio/solutions/compliance-training/", ready: true },
      { label: "Education", href: "/studio/solutions/education/", ready: true },
      { label: "Freelancers", href: "/studio/solutions/freelancers/", ready: true },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about/", ready: true },
      { label: "Pricing", href: "/pricing/", ready: true },
      { label: "Early access", href: "/early-access/", ready: true },
      { label: "Contact", href: "/contact/", ready: true },
    ],
  },
];

/** Links that can be shown now, with the right target for the current phase. */
export function resolve(items: NavItem[]): { label: string; href: string }[] {
  return items.flatMap((item) => {
    if (item.ready) return [{ label: item.label, href: item.href }];
    if (item.fallback) return [{ label: item.label, href: item.fallback }];
    return [];
  });
}
