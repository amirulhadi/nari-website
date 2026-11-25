// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { solutions } from "./src/config/solutions.ts";
import { demos } from "./src/config/showcase.ts";

// The production URL comes from the environment so the site can move from
// *.pages.dev to the custom domain without code changes (see docs/deployment.md).
const site = process.env.PUBLIC_SITE_URL ?? "https://nari-website.pages.dev";

// Pages that must never appear in the sitemap.
const EXCLUDED = ["/styleguide/"];

// Studio pages moved under /studio/. Cloudflare Pages applies public/_redirects (301) first;
// these Astro redirects are the fallback for hosts that ignore _redirects (meta refresh pages).
// The sitemap integration skips redirect routes, so the old paths are never listed.
const redirects = {
  "/features": "/studio/features/",
  "/solutions": "/studio/solutions/",
  "/showcase": "/studio/showcase/",
  ...Object.fromEntries(solutions.map((s) => [`/solutions/${s.slug}`, `/studio/solutions/${s.slug}/`])),
  ...Object.fromEntries(demos.map((d) => [`/showcase/${d.slug}`, `/studio/showcase/${d.slug}/`])),
};

export default defineConfig({
  site,
  redirects,
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [
    sitemap({
      filter: (page) => !EXCLUDED.some((path) => page.endsWith(path)),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Never inline assets as data: URIs: the production Content-Security-Policy
    // (public/_headers) only allows fonts and scripts from the site's own origin.
    build: { assetsInlineLimit: 0 },
  },
});
