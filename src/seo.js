import { AI_TOOLS, BLOG_POSTS, CATEGORIES, FREE_TOOLS } from "./data/index.js";
import { slugify } from "./utils.js";

// ---------------------------------------------------------------------------
// One place that decides every page's URL, title, description and structured data.
// Used by the browser (to update the tab title / URL as people click around) and by
// scripts/prerender.mjs (to write real HTML for every page so Google can read it).
// ---------------------------------------------------------------------------

export const BRAND = "AIToolsHub";

export const paths = {
  home: "/",
  freeHub: "/free-tools/",
  aiHub: "/ai-tools/",
  free: (t) => `/free-tools/${t.slug}/`,
  ai: (t) => `/ai-tools/${t.slug}/`,
  category: (name) => `/category/${slugify(name)}/`,
  blog: (p) => `/blog/${p.slug}/`,
};

const trunc = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");
const withBrand = (t) => `${t} | ${BRAND}`;
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// ---------- routes ----------
export function routePath(r) {
  switch (r.type) {
    case "home": return paths.home;
    case "freeHub": return paths.freeHub;
    case "aiHub": return paths.aiHub;
    case "free": return paths.free(r.item);
    case "ai": return paths.ai(r.item);
    case "category": return paths.category(r.item.name);
    case "blog": return paths.blog(r.item);
    default: return "/";
  }
}

export function routeForModal(m) {
  if (!m) return null;
  if (m.type === "tool") { const t = AI_TOOLS.find((x) => x.id === m.id); return t ? { type: "ai", item: t } : null; }
  if (m.type === "free") { const t = FREE_TOOLS.find((x) => x.id === m.tool.id) || m.tool; return { type: "free", item: t }; }
  if (m.type === "blog") { const p = BLOG_POSTS.find((x) => x.id === m.id); return p ? { type: "blog", item: p } : null; }
  return null;
}

export function modalForRoute(r) {
  if (r.type === "ai") return { type: "tool", id: r.item.id };
  if (r.type === "free") return { type: "free", tool: r.item };
  if (r.type === "blog") return { type: "blog", id: r.item.id };
  return null;
}

export function parseRoute(pathname) {
  const [a, b] = pathname.split("/").filter(Boolean);
  if (!a) return { type: "home" };
  if (a === "free-tools") {
    if (!b) return { type: "freeHub" };
    const item = FREE_TOOLS.find((x) => x.slug === b);
    return item ? { type: "free", item } : { type: "notfound" };
  }
  if (a === "ai-tools") {
    if (!b) return { type: "aiHub" };
    const item = AI_TOOLS.find((x) => x.slug === b);
    return item ? { type: "ai", item } : { type: "notfound" };
  }
  if (a === "category" && b) {
    const item = CATEGORIES.find((c) => slugify(c.name) === b);
    return item ? { type: "category", item } : { type: "notfound" };
  }
  if (a === "blog" && b) {
    const item = BLOG_POSTS.find((p) => p.slug === b);
    return item ? { type: "blog", item } : { type: "notfound" };
  }
  return { type: "notfound" };
}

// All pages that should exist as real, indexable URLs.
export function allRoutes() {
  return [
    { type: "home" },
    { type: "freeHub" },
    { type: "aiHub" },
    ...CATEGORIES.filter((c) => AI_TOOLS.some((t) => t.category === c.name)).map((item) => ({ type: "category", item })),
    ...FREE_TOOLS.map((item) => ({ type: "free", item })),
    ...AI_TOOLS.map((item) => ({ type: "ai", item })),
    // Articles without a body are only excerpts (thin content), so they get no page of their own.
    ...BLOG_POSTS.filter((p) => p.content).map((item) => ({ type: "blog", item })),
  ];
}

const APP_CATEGORY = {
  Developer: "DeveloperApplication", Image: "MultimediaApplication", PDF: "BusinessApplication",
  Barcode: "BusinessApplication", SEO: "BusinessApplication", Security: "SecurityApplication",
  Productivity: "BusinessApplication", Math: "UtilitiesApplication", Text: "UtilitiesApplication",
};

function isoDate(str) {
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

// ---------- page metadata ----------
// base = "https://yoursite.com" (no trailing slash). Empty in the browser: URLs stay relative there.
export function metaFor(route, base = "") {
  const abs = (p) => base + p;
  const crumbs = (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })),
  });
  const home = { name: "Home", path: "/" };
  const freeTools = FREE_TOOLS;
  const base0 = { path: routePath(route), noindex: false, breadcrumbs: [home], sections: [], faq: [], related: [], jsonld: [] };

  switch (route.type) {
    case "free": {
      const f = route.item;
      const title = withBrand(f.seoTitle || `${f.name}: Free Online Tool`);
      const description =
        f.seoDescription ||
        trunc(`${f.desc.replace(/\.$/, "")}. Free online ${f.name.toLowerCase()} that works in your browser. No signup.`, 160);
      const lead =
        f.intro ||
        `${f.desc.replace(/\.$/, "")}. This free ${f.name.toLowerCase()} runs entirely in your browser, so nothing you enter is uploaded, and there is nothing to install or sign up for.`;
      const same = freeTools.filter((t) => t.category === f.category && t.id !== f.id).slice(0, 6);
      const bc = [home, { name: "Free tools", path: paths.freeHub }, { name: f.name, path: paths.free(f) }];
      const sections = [];
      if (f.steps?.length) sections.push({ h2: `How to use ${f.name}`, ol: f.steps });
      return {
        ...base0, title, description, h1: f.name, lead, sections, faq: f.faq || [],
        breadcrumbs: bc,
        related: same.map((t) => ({ href: paths.free(t), label: t.name, note: t.desc })),
        jsonld: [
          {
            "@context": "https://schema.org", "@type": "WebApplication", name: f.name, description, url: abs(paths.free(f)),
            applicationCategory: APP_CATEGORY[f.category] || "UtilitiesApplication", operatingSystem: "Any (web browser)",
            isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@type": "Organization", name: BRAND },
          },
          crumbs(bc),
          ...(f.faq?.length ? [{
            "@context": "https://schema.org", "@type": "FAQPage",
            mainEntity: f.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
          }] : []),
        ],
      };
    }

    case "ai": {
      const t = route.item;
      const long = withBrand(`${t.name}: Features, Pricing & Alternatives`);
      const mid = withBrand(`${t.name}: Features & Pricing`);
      const title = long.length <= 62 ? long : mid.length <= 62 ? mid : withBrand(trunc(t.name, 40));
      const description = trunc(`${t.desc.replace(/\.$/, "")}. ${t.price ? `Pricing: ${t.price}. ` : ""}See features and similar ${t.category.toLowerCase()} AI tools.`, 160);
      const same = AI_TOOLS.filter((x) => x.category === t.category && x.id !== t.id).slice(0, 6);
      const bc = [home, { name: "AI tools", path: paths.aiHub }, { name: t.category, path: paths.category(t.category) }, { name: t.name, path: paths.ai(t) }];
      const sections = [];
      if (t.features?.length) sections.push({ h2: `Key features of ${t.name}`, ul: t.features });
      sections.push({
        h2: `${t.name} pricing and rating`,
        p: `${t.price ? `Pricing: ${t.price}. ` : ""}Plans change often, so check the official site for the latest details. Our editorial rating is ${t.rating} out of 5.`,
      });
      return {
        ...base0, title, description, h1: t.name, lead: t.desc, sections, breadcrumbs: bc,
        related: same.map((x) => ({ href: paths.ai(x), label: x.name, note: x.desc })),
        externalLink: { href: t.url, label: `Visit ${t.name}` },
        jsonld: [
          {
            "@context": "https://schema.org", "@type": "SoftwareApplication", name: t.name, description: t.desc,
            url: abs(paths.ai(t)), applicationCategory: "BusinessApplication", operatingSystem: "Web",
          },
          crumbs(bc),
        ],
      };
    }

    case "category": {
      const c = route.item;
      const list = AI_TOOLS.filter((t) => t.category === c.name);
      const title = withBrand(`Best ${c.name} AI Tools (${list.length} Compared)`);
      const names = list.slice(0, 3).map((t) => t.name).join(", ");
      const description = trunc(`Compare ${list.length} ${c.name.toLowerCase()} AI tools including ${names}. See features, pricing and ratings, and find the right one.`, 160);
      const bc = [home, { name: "AI tools", path: paths.aiHub }, { name: c.name, path: paths.category(c.name) }];
      return {
        ...base0, title, description, h1: `Best ${c.name} AI Tools`,
        lead: `${list.length} ${c.name.toLowerCase()} AI tools, compared by features, pricing and rating. Open any tool for details and similar alternatives.`,
        breadcrumbs: bc,
        related: list.map((x) => ({ href: paths.ai(x), label: x.name, note: x.desc })),
        jsonld: [
          {
            "@context": "https://schema.org", "@type": "CollectionPage", name: `Best ${c.name} AI Tools`, description, url: abs(paths.category(c.name)),
            mainEntity: { "@type": "ItemList", itemListElement: list.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, url: abs(paths.ai(x)) })) },
          },
          crumbs(bc),
        ],
      };
    }

    case "freeHub": {
      const title = withBrand("Free Online Tools: PDF, Image, Barcode & Text");
      const description = trunc(`${FREE_TOOLS.length} free online tools that run in your browser: merge PDFs, compress images, make barcodes and QR codes, and more. No signup.`, 160);
      const bc = [home, { name: "Free tools", path: paths.freeHub }];
      return {
        ...base0, title, description, h1: "Free Online Tools",
        lead: "Every tool here runs in your browser, so your files and text are never uploaded. No signup, no watermarks.",
        breadcrumbs: bc, related: FREE_TOOLS.map((t) => ({ href: paths.free(t), label: t.name, note: t.desc })),
        jsonld: [crumbs(bc)],
      };
    }

    case "aiHub": {
      const title = withBrand(`AI Tools Directory: ${AI_TOOLS.length}+ Tools Compared`);
      const description = trunc(`Browse ${AI_TOOLS.length}+ AI tools for writing, images, coding, video and more. Compare features, pricing and ratings, and save your favourites.`, 160);
      const bc = [home, { name: "AI tools", path: paths.aiHub }];
      return {
        ...base0, title, description, h1: "AI Tools Directory",
        lead: `${AI_TOOLS.length} AI tools in ${CATEGORIES.length} categories, with features, pricing and ratings.`,
        breadcrumbs: bc, related: CATEGORIES.filter((c) => AI_TOOLS.some((t) => t.category === c.name)).map((c) => ({ href: paths.category(c.name), label: `${c.name} AI tools`, note: `${AI_TOOLS.filter((t) => t.category === c.name).length} tools` })),
        jsonld: [crumbs(bc)],
      };
    }

    case "blog": {
      const p = route.item;
      const title = withBrand(trunc(p.title, 60));
      const description = trunc(p.excerpt, 160);
      const bc = [home, { name: "Blog", path: "/#blog" }, { name: p.title, path: paths.blog(p) }];
      return {
        ...base0, title, description, h1: p.title, lead: p.excerpt, article: p.content, breadcrumbs: bc,
        jsonld: [
          {
            "@context": "https://schema.org", "@type": "Article", headline: p.title, description,
            ...(isoDate(p.date) ? { datePublished: isoDate(p.date) } : {}),
            author: { "@type": "Organization", name: p.author || BRAND }, publisher: { "@type": "Organization", name: BRAND },
            mainEntityOfPage: abs(paths.blog(p)),
          },
          crumbs(bc),
        ],
      };
    }

    case "notfound":
      return { ...base0, path: "/", title: withBrand("Page not found"), description: "This page could not be found.", h1: "Page not found", lead: "That page doesn't exist. Try the home page.", noindex: true, jsonld: [] };

    default: {
      const title = withBrand("Free PDF, Image & Barcode Tools + AI Tools Directory");
      const description = trunc(`Free online PDF, image, barcode and text tools that run in your browser, plus a directory of ${AI_TOOLS.length}+ AI tools with pricing and features. No signup.`, 160);
      return {
        ...base0, title, description, h1: "Free Online Tools & AI Tools Directory",
        lead: `Merge and split PDFs, compress and resize images, make barcodes and QR codes, and explore ${AI_TOOLS.length}+ AI tools with pricing and features. The free tools run in your browser, so your files stay private.`,
        jsonld: [
          {
            "@context": "https://schema.org", "@type": "WebSite", name: BRAND, url: abs("/"), description,
            potentialAction: { "@type": "SearchAction", target: `${abs("/")}?search={search_term_string}`, "query-input": "required name=search_term_string" },
          },
          { "@context": "https://schema.org", "@type": "Organization", name: BRAND, url: abs("/") },
        ],
      };
    }
  }
}

// ---------- browser: keep the tab title / description / canonical in step with what's on screen ----------
export function applyHead(meta) {
  if (typeof document === "undefined") return;
  const setMeta = (attr, key, value) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", value);
  };
  const url = window.location.origin + meta.path;
  document.title = meta.title;
  setMeta("name", "description", meta.description);
  setMeta("property", "og:title", meta.title);
  setMeta("property", "og:description", meta.description);
  setMeta("property", "og:url", url);
  setMeta("name", "twitter:title", meta.title);
  setMeta("name", "twitter:description", meta.description);
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
  link.href = url;
}
