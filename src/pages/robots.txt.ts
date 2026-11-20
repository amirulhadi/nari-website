import type { APIRoute } from "astro";

// Generated so the sitemap URL follows PUBLIC_SITE_URL (pages.dev now, custom domain later).
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site).href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: /styleguide/\n\nSitemap: ${sitemap}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
