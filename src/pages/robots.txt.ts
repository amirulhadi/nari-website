import type { APIRoute } from "astro";

// Generated so the sitemap URL follows PUBLIC_SITE_URL (pages.dev now, custom domain later).
// /demos/ holds the raw exported example players; the Showcase pages are the indexable entry points.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site).href;
  const body = ["User-agent: *", "Allow: /", "Disallow: /styleguide/", "Disallow: /demos/", "", `Sitemap: ${sitemap}`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
