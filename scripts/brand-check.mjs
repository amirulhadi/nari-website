#!/usr/bin/env node
/* NARI brand drift check. Dependency-free; copied into each product repo (scripts/brand-check.mjs).
 * Reads brand.lock.json (pinned @nari/brand tokens, generated) and brand.rules.json (what to verify in this repo).
 * Rules:
 *   { "kind": "nari-vars", "file": "path.css" }
 *       every --nari-<colour> declaration must equal the pinned light or dark value; every pinned colour must be declared.
 *   { "kind": "map", "file": "path.css", "scope": "[data-chrome=\"dark\"]", "theme": "dark", "map": { "--color-slate-950": "paper" } }
 *       inside the block whose selector contains `scope`, each variable must equal the pinned token of that theme.
 *   { "kind": "same-as-package", "file": "path.css", "package": "path/to/nari-tokens.css" }  (brand repo checkout only; skipped if absent)
 * Exit code 1 on any mismatch. */
import { readFileSync, existsSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");
const lock = JSON.parse(read("brand.lock.json"));
const rules = JSON.parse(read("brand.rules.json")).rules;
const norm = (v) => v.trim().toLowerCase().replace(/\s+/g, " ");
const problems = [];
const bad = (file, msg) => problems.push(`${file}: ${msg}`);

function block(css, scope) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) if (m[1].includes(scope)) out.push(m[2]);
  return out.join("\n");
}

for (const r of rules) {
  if (!existsSync(r.file)) { bad(r.file, "file not found"); continue; }
  const css = readFileSync(r.file, "utf8");
  if (r.kind === "nari-vars") {
    const seen = new Set();
    for (const [, name, val] of css.matchAll(/--nari-([a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g)) {
      const lt = lock.tokens.light[name], dk = lock.tokens.dark[name];
      if (lt === undefined) continue; // fonts, radii and other non-colour tokens
      seen.add(name);
      if (![lt, dk].some((x) => norm(x) === norm(val))) bad(r.file, `--nari-${name}: ${val.trim()} is not a pinned value (light ${lt}, dark ${dk})`);
    }
    for (const name of Object.keys(lock.tokens.light)) if (!seen.has(name)) bad(r.file, `--nari-${name} is not declared`);
  } else if (r.kind === "map") {
    const body = block(css, r.scope);
    if (!body) { bad(r.file, `no block found for ${r.scope}`); continue; }
    for (const [v, token] of Object.entries(r.map)) {
      const want = lock.tokens[r.theme][token];
      const m = body.match(new RegExp(v.replace(/[-]/g, "\-") + "\s*:\s*([^;]+);"));
      if (!m) bad(r.file, `${v} missing in ${r.scope}`);
      else if (norm(m[1]) !== norm(want)) bad(r.file, `${v}: ${m[1].trim()} should be ${want} (${r.theme} ${token}) in ${r.scope}`);
    }
  } else if (r.kind === "same-as-package") {
    if (!existsSync(r.package)) continue;
    const a = css.replace(/\r\n/g, "\n"), b = readFileSync(r.package, "utf8").replace(/\r\n/g, "\n");
    if (a !== b) bad(r.file, `differs from ${r.package}`);
  } else bad(r.file, `unknown rule kind ${r.kind}`);
}

if (problems.length) {
  console.error(`Brand check failed against @nari/brand ${lock.version}:\n` + problems.map((p) => " ✗ " + p).join("\n"));
  console.error("\nUpgrade or fix: see 'Brand package' in README.md.");
  process.exit(1);
}
console.log(`Brand check OK against @nari/brand ${lock.version} (${rules.length} rules).`);
