// Small progressive enhancements. The site works fully without this file.
// Kept as a static file (not inline) so the Content-Security-Policy can stay script-src 'self'.
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  // Header border once the page is scrolled.
  const header = document.querySelector("[data-header]");
  const onScroll = () => header && header.classList.toggle("border-line", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu.
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("hidden", !open);
      toggle.querySelector("[data-icon-open]")?.classList.toggle("hidden", open);
      toggle.querySelector("[data-icon-close]")?.classList.toggle("hidden", !open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });
  }

  // Billing period toggle: flips data-billing on the page's [data-billing-root].
  const billingRoot = document.querySelector("[data-billing-root]");
  const billingButtons = document.querySelectorAll("[data-billing-set]");
  if (billingRoot && billingButtons.length) {
    billingButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.getAttribute("data-billing-set");
        billingRoot.setAttribute("data-billing", mode);
        billingButtons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
      });
    });
  }

  // Reveal on scroll (the CSS only animates when reduced motion is not requested).
  const items = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  items.forEach((el) => observer.observe(el));
})();
