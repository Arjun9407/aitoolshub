// Validates every AI tool / free tool in src/content. Runs automatically before `npm run build`.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { AI_DIR, FREE_DIR, PRICING, ROOT, readJsonDir } from "./lib.mjs";

const errors = [];
const warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const base = await import(pathToFileURL(path.join(ROOT, "src/data/baseData.js")).href);
const baseNames = new Set(base.AI_TOOLS.map((t) => t.name.toLowerCase()));
const baseFreeNames = new Set(base.FREE_TOOLS.map((t) => t.name.toLowerCase()));
const baseCats = new Set(base.CATEGORIES.map((c) => c.name));
const baseFreeActions = new Set(base.FREE_TOOLS.map((t) => t.action));

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isHttps = (v) => { try { return new URL(v).protocol === "https:"; } catch { return false; } };

// ---------- AI tools ----------
const names = new Map();
let aiCount = 0;
for (const { file, path: p } of readJsonDir(AI_DIR)) {
  const f = `ai-tools/${file}`;
  let d;
  try { d = JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { err(f, `invalid JSON (${e.message})`); continue; }
  aiCount++;
  for (const k of ["name", "category", "desc", "url"]) if (!isStr(d[k])) err(f, `"${k}" is required (text)`);
  if (!PRICING.includes(d.pricing)) err(f, `"pricing" must be one of ${PRICING.join(", ")}`);
  if (typeof d.rating !== "number" || d.rating < 0 || d.rating > 5) err(f, `"rating" must be a number from 0 to 5`);
  if (isStr(d.url) && !isHttps(d.url)) err(f, `"url" must be a full https:// link`);
  if (d.color && !/^#[0-9a-f]{6}$/i.test(d.color)) err(f, `"color" must look like #6366f1`);
  if (d.logo !== undefined && !(isStr(d.logo) && (isHttps(d.logo) || d.logo.startsWith("/")))) err(f, `"logo" must be an https:// link or a path like /logos/name.svg`);
  if (d.logo?.startsWith("/") && !fs.existsSync(path.join(ROOT, "public", d.logo))) err(f, `logo file not found: public${d.logo}`);
  if (d.domain !== undefined && !(isStr(d.domain) && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d.domain))) err(f, `"domain" must be a bare domain like example.com`);
  for (const k of ["tags", "features"]) if (d[k] !== undefined && (!Array.isArray(d[k]) || d[k].some((x) => !isStr(x)))) err(f, `"${k}" must be a list of text`);
  if (isStr(d.desc) && d.desc.length > 220) warn(f, `"desc" is ${d.desc.length} characters; aim for under 160 so cards stay tidy`);
  if (isStr(d.desc) && d.desc.length < 40) warn(f, `"desc" is very short; write a useful sentence or two`);
  if (!d.tags?.length) warn(f, `no "tags"`);
  if (!d.features?.length) warn(f, `no "features" (shown in the detail pop-up)`);
  if (isStr(d.category) && !baseCats.has(d.category)) warn(f, `new category "${d.category}" will be created automatically`);
  if (isStr(d.name)) {
    const key = d.name.toLowerCase();
    if (baseNames.has(key)) err(f, `a tool named "${d.name}" already exists in the original data`);
    if (names.has(key)) err(f, `duplicate name, also used in ${names.get(key)}`);
    names.set(key, f);
  }
}

// ---------- Free tools ----------
const freeSlugs = new Set();
let freeCount = 0;
for (const { file, path: p } of readJsonDir(FREE_DIR, ".meta.json")) {
  const slug = file.replace(/\.meta\.json$/, "");
  const f = `free-tools/${file}`;
  freeSlugs.add(slug);
  let d;
  try { d = JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { err(f, `invalid JSON (${e.message})`); continue; }
  freeCount++;
  for (const k of ["name", "desc", "category"]) if (!isStr(d[k])) err(f, `"${k}" is required (text)`);
  if (d.color && !/^#[0-9a-f]{6}$/i.test(d.color)) err(f, `"color" must look like #10b981`);
  if (!fs.existsSync(path.join(FREE_DIR, `${slug}.jsx`))) err(f, `missing component file free-tools/${slug}.jsx`);
  if (baseFreeActions.has(slug)) err(f, `"${slug}" clashes with a built-in free tool`);
  if (isStr(d.name) && baseFreeNames.has(d.name.toLowerCase())) err(f, `a free tool named "${d.name}" already exists`);
  if (!isStr(d.seoTitle)) warn(f, `no "seoTitle" - Google will use a generic title (aim for 30-48 characters)`);
  else if (d.seoTitle.length > 48) warn(f, `"seoTitle" is ${d.seoTitle.length} characters; keep it under ~48 so the title is not cut off`);
  if (!isStr(d.seoDescription)) warn(f, `no "seoDescription" (aim for 120-160 characters)`);
  else if (d.seoDescription.length < 110 || d.seoDescription.length > 165) warn(f, `"seoDescription" is ${d.seoDescription.length} characters; aim for 120-160`);
  if (!Array.isArray(d.faq) || d.faq.length < 2) warn(f, `add at least 2 "faq" items (question + answer) - they become the FAQ on the page`);
  if (isStr(d.desc) && d.desc.length > 140) warn(f, `"desc" is ${d.desc.length} characters; aim for under 100`);
}
for (const { file, path: p } of readJsonDir(FREE_DIR, ".jsx")) {
  const slug = file.replace(/\.jsx$/, "");
  if (!freeSlugs.has(slug)) err(`free-tools/${file}`, `no matching ${slug}.meta.json (the tool won't show up without it)`);
  const src = fs.readFileSync(p, "utf8");
  if (!/export\s+default/.test(src)) err(`free-tools/${file}`, `must have a default export (the React component)`);
}

console.log(`Checked ${aiCount} AI tool file(s) and ${freeCount} free tool file(s).`);
warnings.forEach((w) => console.log(`  warning  ${w}`));
if (errors.length) {
  errors.forEach((e) => console.log(`  ERROR    ${e}`));
  console.log(`\n${errors.length} error(s). Fix them and run again.`);
  process.exit(1);
}
console.log("Content OK");
