// Runs after `vite build`. Writes a real HTML page (title, description, structured data and readable
// content) for every tool, category and article, plus sitemap.xml and robots.txt.
// Without this, a single-page app gives Google only ONE page to rank.
import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
import { ROOT } from "./lib.mjs";

const DIST = path.join(ROOT, "dist");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const SITE = (process.env.SITE_URL || cfg.url).replace(/\/+$/, "");
const placeholder = /your-domain-here|example\.(com|org)/.test(SITE);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

const vite = await createServer({ root: ROOT, server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const seo = await vite.ssrLoadModule("/src/seo.js");
const data = await vite.ssrLoadModule("/src/data/index.js");
const { renderMarkdown } = await vite.ssrLoadModule("/src/utils/markdown.js");

const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const stripped = template
  .replace(/<title>[\s\S]*?<\/title>/i, "")
  .replace(/<meta\s+(?:name|property)="(?:description|keywords|robots|og:[a-z:_]+|twitter:[a-z:_]+)"[^>]*>/gi, "")
  .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");

function relatedTitle(type, m) {
  return { free: "More free tools", ai: "Similar AI tools", category: "AI tools in this category", freeHub: "All free tools", aiHub: "Browse by category" }[type];
}

function bodyHtml(route, m) {
  const out = [];
  if (m.breadcrumbs?.length > 1)
    out.push(`<nav aria-label="Breadcrumb">${m.breadcrumbs.map((c, i, a) => (i < a.length - 1 ? `<a href="${esc(c.path)}">${esc(c.name)}</a> / ` : `<span>${esc(c.name)}</span>`)).join("")}</nav>`);
  out.push(`<h1>${esc(m.h1)}</h1>`, `<p>${esc(m.lead)}</p>`);
  if (m.article) out.push(renderMarkdown(m.article));
  for (const s of m.sections || []) {
    out.push(`<h2>${esc(s.h2)}</h2>`);
    if (s.p) out.push(`<p>${esc(s.p)}</p>`);
    if (s.ul) out.push(`<ul>${s.ul.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`);
    if (s.ol) out.push(`<ol>${s.ol.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`);
  }
  if (m.faq?.length) out.push(`<h2>Frequently asked questions</h2>`, ...m.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`));
  if (m.externalLink) out.push(`<p><a href="${esc(m.externalLink.href)}" rel="noopener nofollow">${esc(m.externalLink.label)}</a></p>`);
  if (route.type === "home") {
    out.push(`<h2>Free online tools</h2><ul>${data.FREE_TOOLS.map((t) => `<li><a href="${seo.paths.free(t)}">${esc(t.name)}</a>: ${esc(t.desc)}</li>`).join("")}</ul>`);
    const cats = data.CATEGORIES.filter((c) => data.AI_TOOLS.some((t) => t.category === c.name));
    out.push(`<h2>AI tools by category</h2><ul>${cats.map((c) => `<li><a href="${seo.paths.category(c.name)}">${esc(c.name)} AI tools</a></li>`).join("")}</ul>`);
    out.push(`<h2>Featured AI tools</h2><ul>${data.AI_TOOLS.filter((t) => t.featured).map((t) => `<li><a href="${seo.paths.ai(t)}">${esc(t.name)}</a>: ${esc(t.desc)}</li>`).join("")}</ul>`);
  } else if (m.related?.length) {
    out.push(`<h2>${relatedTitle(route.type, m)}</h2><ul>${m.related.map((r) => `<li><a href="${esc(r.href)}">${esc(r.label)}</a>${r.note ? `: ${esc(r.note)}` : ""}</li>`).join("")}</ul>`);
  }
  if (route.type !== "home") out.push(`<p><a href="/">Home</a> · <a href="${seo.paths.freeHub}">Free tools</a> · <a href="${seo.paths.aiHub}">AI tools directory</a></p>`);
  return `<div class="seo-static">${out.join("\n")}</div>`;
}

function page(route) {
  const m = seo.metaFor(route, SITE);
  const url = SITE + m.path;
  const head = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="robots" content="${m.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${route.type === "blog" ? "article" : "website"}" />`,
    `<meta property="og:site_name" content="${esc(seo.BRAND)}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    ...m.jsonld.map(ld),
  ].join("\n    ");
  const html = stripped
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml(route, m)}</div>`);
  return { m, html, url };
}

const routes = seo.allRoutes();
const seenTitle = new Map();
const seenDesc = new Map();
const warnings = [];
const urls = [];

for (const route of routes) {
  const { m, html, url } = page(route);
  const file = route.type === "home" ? path.join(DIST, "index.html") : path.join(DIST, m.path, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  urls.push(url);
  const label = m.path;
  if (seenTitle.has(m.title)) warnings.push(`duplicate title on ${label} and ${seenTitle.get(m.title)}`);
  if (seenDesc.has(m.description)) warnings.push(`duplicate description on ${label} and ${seenDesc.get(m.description)}`);
  seenTitle.set(m.title, label);
  seenDesc.set(m.description, label);
  if (m.title.length > 65) warnings.push(`title is ${m.title.length} chars on ${label} (aim for 60 or less)`);
  if (m.description.length > 160) warnings.push(`description is ${m.description.length} chars on ${label}`);
  if (m.description.length < 70) warnings.push(`description is short (${m.description.length}) on ${label}`);
}

// 404 page: same app shell, but told not to be indexed
fs.writeFileSync(path.join(DIST, "404.html"), page({ type: "notfound" }).html);

const today = new Date().toISOString().slice(0, 10);
const prio = (u) => (u === SITE + "/" ? "1.0" : /\/(free-tools|ai-tools)\/$/.test(u) ? "0.9" : /\/category\//.test(u) ? "0.8" : /\/free-tools\//.test(u) ? "0.8" : "0.6");
fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod><priority>${prio(u)}</priority></url>`)
    .join("\n")}\n</urlset>\n`
);
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

await vite.close();

console.log(`Prerendered ${urls.length} pages + 404.html, sitemap.xml and robots.txt  (site: ${SITE})`);
warnings.forEach((w) => console.log(`  warning  ${w}`));
if (placeholder) {
  console.log("\n  !! SITE URL NOT SET. Pages were written with a placeholder address.");
  console.log("  !! Before deploying, set your real domain in site.config.json (or run with SITE_URL=https://yourdomain.com).");
}
