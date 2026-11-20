// Shared helpers for the site tests: a static server for dist/ that applies the
// production headers from public/_headers (so the CSP is enforced), and page discovery.

import http from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

export const DIST = path.resolve("dist");

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".avif": "image/avif", ".webp": "image/webp",
  ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml",
};

async function productionHeaders() {
  const text = (await readFile("public/_headers", "utf8")).replace(/\r\n/g, "\n");
  const block = text.split(/\n\n/).find((b) => b.split("\n").includes("/*")) ?? "";
  const lines = block.split("\n");
  const headers = Object.fromEntries(
    lines.slice(lines.indexOf("/*") + 1).map((l) => l.trim()).filter(Boolean)
      .map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 1).trim()]),
  );
  delete headers["Strict-Transport-Security"]; // plain http on localhost
  headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace("; upgrade-insecure-requests", "");
  return headers;
}

/** Starts the server; returns { base, close }. */
export async function startServer(port) {
  const headers = await productionHeaders();
  const server = http.createServer(async (req, res) => {
    const p = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(DIST, p);
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", ...headers });
      res.end(body);
    } catch {
      const notFound = await readFile(path.join(DIST, "404.html")).catch(() => Buffer.from("Not found"));
      res.writeHead(404, { "content-type": "text/html", ...headers });
      res.end(notFound);
    }
  });
  await new Promise((resolve) => server.listen(port, resolve));
  return { base: `http://localhost:${port}`, close: () => new Promise((r) => server.close(r)) };
}

async function pagesIn(dir, prefix = "") {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["_astro", "demos", "js", "og", "brand"].includes(entry.name) && !prefix) continue;
      out.push(...(await pagesIn(path.join(dir, entry.name), `${prefix}/${entry.name}`)));
    } else if (entry.name === "index.html") out.push(prefix || "/");
  }
  return out;
}

/** Every built page route ("/", "/features/", …). */
export async function routes() {
  return (await pagesIn(DIST)).map((r) => (r === "/" ? "/" : `${r}/`)).sort();
}

export const launch = () => chromium.launch({ channel: process.env.CAPTURE_BROWSER ?? "msedge" });
