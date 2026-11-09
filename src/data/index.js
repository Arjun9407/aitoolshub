import { lazy } from "react";
import {
  AI_TOOLS as BASE_TOOLS,
  FREE_TOOLS,
  CATEGORIES as BASE_CATEGORIES,
  BLOG_POSTS,
  COMPARISON_DATA,
  TESTIMONIALS,
  FAQ_DATA,
} from "./baseData.js";
import { NEW_ARTICLES } from "./articles.js";
import { slugify } from "../utils.js";

// Every item gets a URL slug: its file name (for file-based content) or a slug of its name/title.
function withSlugs(list, key = "name") {
  const used = new Set();
  return list.map((t) => {
    const root = t.slug || (typeof t.id === "string" ? t.id : slugify(t[key]));
    let slug = root;
    for (let i = 2; used.has(slug); i++) slug = `${root}-${i}`;
    used.add(slug);
    return { ...t, slug };
  });
}

// ---------------------------------------------------------------------------
// CONTENT SYSTEM: every file in src/content/ai-tools/*.json becomes a tool.
// See CONTENT.md. Add a file (or run `npm run new:tool`) and it appears on the site.
// ---------------------------------------------------------------------------
const PRICE_LABEL = { free: "Free", freemium: "Free / Paid", paid: "Paid" };
const aiToolFiles = import.meta.glob("../content/ai-tools/*.json", { eager: true });
const FILE_TOOLS = Object.entries(aiToolFiles)
  .map(([path, mod]) => {
    const data = mod.default ?? mod;
    const slug = path.split("/").pop().replace(/\.json$/, "");
    return {
      id: slug,
      icon: "🛠️",
      color: "#6366f1",
      price: PRICE_LABEL[data.pricing] || "",
      featured: false,
      tags: [],
      features: [],
      ...data,
    };
  })
  .filter((t) => !t.draft)
  .sort((a, b) => a.name.localeCompare(b.name));

// Merge and de-duplicate by name (the original list had "Murf AI" twice).
const seen = new Set();
const DEDUPED_TOOLS = [...BASE_TOOLS, ...FILE_TOOLS].filter((t) => {
  const key = t.name.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
export const AI_TOOLS = withSlugs(DEDUPED_TOOLS);

// Make sure every tool category has a category card.
const known = new Set(BASE_CATEGORIES.map((c) => c.name));
export const CATEGORIES = [...BASE_CATEGORIES];
AI_TOOLS.forEach((t) => {
  if (!known.has(t.category)) {
    known.add(t.category);
    CATEGORIES.push({ name: t.category, icon: "✨", color: "#6366f1", bg: "rgba(99,102,241,0.15)" });
  }
});

// Newest articles first. Original posts (excerpt only) follow the full-length ones.
const BLOG = withSlugs([...NEW_ARTICLES, ...BLOG_POSTS], "title");

// Free tools: base list + every src/content/free-tools/<slug>.meta.json (paired with <slug>.jsx).
const freeMetaFiles = import.meta.glob("../content/free-tools/*.meta.json", { eager: true });
const freeComponentFiles = import.meta.glob("../content/free-tools/*.jsx"); // lazy: heavy libraries load only when a tool is opened
const FILE_FREE_TOOLS = Object.entries(freeMetaFiles)
  .map(([path, mod]) => {
    const data = mod.default ?? mod;
    const slug = path.split("/").pop().replace(/\.meta\.json$/, "");
    return { id: slug, action: slug, badge: "FREE", color: "#10b981", icon: "🧰", ...data };
  })
  .filter((t) => !t.draft)
  .sort((a, b) => a.name.localeCompare(b.name));
export const ALL_FREE_TOOLS = withSlugs([...FREE_TOOLS, ...FILE_FREE_TOOLS]);
export const FILE_FREE_TOOL_COMPONENTS = Object.fromEntries(
  Object.entries(freeComponentFiles).map(([path, load]) => [path.split("/").pop().replace(/\.jsx$/, ""), lazy(load)])
);

export { ALL_FREE_TOOLS as FREE_TOOLS, BLOG as BLOG_POSTS, COMPARISON_DATA, TESTIMONIALS, FAQ_DATA };
