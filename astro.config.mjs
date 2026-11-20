// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// The production URL comes from the environment so the site can move from
// *.pages.dev to the custom domain without code changes (see docs/deployment.md).
const site = process.env.PUBLIC_SITE_URL ?? "https://nari-website.pages.dev";

// Pages that must never appear in the sitemap.
const EXCLUDED = ["/styleguide/"];

export default defineConfig({
  site,
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
