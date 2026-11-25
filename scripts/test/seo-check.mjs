// SEO audit of the built site (run `npm run build` first). Reads dist/ directly.
//   - one unique <title> (10–60 chars) and meta description (70–160 chars) per page
//   - exactly one <h1>, canonical URL, Open Graph tags, theme colours, lang attribute
//   - indexable pages are in the sitemap (new and moved pages included, old redirected paths excluded); noindex pages are not
//   - robots.txt references the sitemap and hides non-pages; structured data is valid JSON
//   - structured data never claims prices, ratings or reviews
// Usage: npm run test:seo

import { readFile } from "node:fs/promises";
import { routes } from "./lib.mjs";

const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);
const titles = new Map();
const descriptions = new Map();

const sitemapIndex = await readFile("dist/sitemap-index.xml", "utf8");
const sitemapFile = sitemapIndex.match(/<loc>([^<]*sitemap-0\.xml)<\/loc>/)?.[1].split("/").pop();
const sitemap = sitemapFile ? await readFile(`dist/${sitemapFile}`, "utf8") : "";
const robots = await readFile("dist/robots.txt", "utf8");
if (!/Sitemap: .*sitemap-index\.xml/.test(robots)) fail("robots.txt", "missing Sitemap line");
if (!/Disallow: \/demos\//.test(robots)) fail("robots.txt", "should disallow /demos/");

const pages = [...(await routes()), "/404"];
for (const route of pages) {
  const file = route === "/404" ? "dist/404.html" : `dist/${route === "/" ? "" : route}index.html`.replace("//", "/");
  const html = await readFile(file, "utf8");
  const get = (re) => html.match(re)?.[1] ?? "";
  const title = get(/<title>([^<]*)<\/title>/);
  const description = get(/<meta name="description" content="([^"]*)"/);
  const noindex = /<meta name="robots" content="noindex/.test(html);
  const internal = route === "/styleguide/" || route === "/404";

  if (title.length < 10 || title.length > 60) fail(route, `title length ${title.length} ("${title}")`);
  if (!internal && (description.length < 70 || description.length > 160)) fail(route, `description length ${description.length}`);
  if (titles.has(title)) fail(route, `duplicate title with ${titles.get(title)}`);
  titles.set(title, route);
  if (!internal) {
    if (descriptions.has(description)) fail(route, `duplicate description with ${descriptions.get(description)}`);
    descriptions.set(description, route);
  }
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(route, "should have exactly one <h1>");
  if (!/<html lang="en"/.test(html)) fail(route, "missing html lang");
  if (!/<link rel="canonical" href="https?:\/\//.test(html)) fail(route, "missing absolute canonical");
  for (const tag of ["og:title", "og:description", "og:url", "og:image", "og:type", "og:site_name"]) {
    if (!html.includes(`property="${tag}"`)) fail(route, `missing ${tag}`);
  }
  if (!html.includes('name="twitter:card"')) fail(route, "missing twitter:card");

  const url = get(/<link rel="canonical" href="([^"]*)"/);
  const inSitemap = sitemap.includes(`<loc>${url}</loc>`);
  if (noindex && inSitemap) fail(route, "noindex page is in the sitemap");
  if (!noindex && !inSitemap) fail(route, `indexable page missing from sitemap (${url})`);
  if (!noindex && internal) fail(route, "internal page should be noindex");

  for (const block of [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])) {
    try {
      const data = JSON.parse(block);
      const text = JSON.stringify(data);
      if (/"(offers|aggregateRating|review|price)"/i.test(text)) fail(route, "structured data must not include offers, ratings, reviews or prices");
      if (!data["@type"]) fail(route, "structured data block without @type");
    } catch {
      fail(route, "invalid JSON-LD");
    }
  }
}

// Per-page structured data expectations.
const read = (f) => readFile(f, "utf8");
const home = await read("dist/index.html");
if (home.includes('"SoftwareApplication"')) fail("/", "the NARI home should not describe one product as the SoftwareApplication");
for (const [route, name] of [["studio", "NARI Studio"], ["campus", "NARI Campus"]]) {
  const html = await read(`dist/${route}/index.html`);
  if (!html.includes('"SoftwareApplication"') || !html.includes(`"name":"${name}"`)) fail(`/${route}/`, `missing SoftwareApplication data for ${name}`);
  if (!html.includes('"BreadcrumbList"')) fail(`/${route}/`, "missing BreadcrumbList data");
}

// New and moved pages are in the sitemap; redirected (old) paths are not.
const sitemapPaths = [...sitemap.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map((m) => m[1]);
for (const route of ["/", "/studio/", "/studio/features/", "/studio/solutions/", "/studio/showcase/", "/studio/beta/", "/campus/", "/pricing/", "/about/", "/contact/", "/early-access/"]) {
  if (!sitemapPaths.includes(route)) fail(route, "missing from the sitemap");
}
for (const path of sitemapPaths) {
  if (/^\/(features|solutions|showcase)(\/|$)/.test(path)) fail(path, "redirected path is in the sitemap");
}
if (!(await read("dist/pricing/index.html")).includes('"FAQPage"')) fail("/pricing/", "missing FAQPage data");

console.log(`SEO checks on ${pages.length} pages; ${titles.size} unique titles.`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  failures.forEach((f) => console.log(" ✗", f));
  process.exit(1);
}
console.log("All checks passed.");
