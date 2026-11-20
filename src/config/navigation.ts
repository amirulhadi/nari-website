/**
 * Navigation.
 *
 * Pages built in a later phase have `ready: false`. Until then the link goes to
 * `fallback` (the matching homepage section) or is not rendered at all, so the
 * site never links to a missing page.
 */

export interface NavItem {
  label: string;
  href: string;
  ready: boolean;
  /** Used while the page is not ready. Omit to hide the link until then. */
  fallback?: string;
}

export const mainNav: NavItem[] = [
  { label: "Features", href: "/features/", ready: false, fallback: "/#features" },
  { label: "Solutions", href: "/solutions/", ready: false, fallback: "/#audiences" },
  { label: "Showcase", href: "/showcase/", ready: false, fallback: "/#examples" },
  { label: "Pricing", href: "/pricing/", ready: false, fallback: "/#plans" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Overview", href: "/", ready: true },
      { label: "Features", href: "/features/", ready: false, fallback: "/#features" },
      { label: "Publishing", href: "/features/#publishing", ready: false, fallback: "/#publishing" },
      { label: "Showcase", href: "/showcase/", ready: false, fallback: "/#examples" },
      { label: "Pricing", href: "/pricing/", ready: false, fallback: "/#plans" },
      { label: "Early access", href: "/early-access/", ready: true },
    ],
  },
  {
    title: "Solutions",
    items: [
      { label: "Corporate training", href: "/solutions/corporate-training/", ready: false },
      { label: "Employee onboarding", href: "/solutions/employee-onboarding/", ready: false },
      { label: "Compliance training", href: "/solutions/compliance-training/", ready: false },
      { label: "Education", href: "/solutions/education/", ready: false },
      { label: "Freelancers", href: "/solutions/freelancers/", ready: false },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about/", ready: false },
      { label: "Contact", href: "/contact/", ready: false },
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
