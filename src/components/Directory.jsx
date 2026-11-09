import { useEffect, useMemo, useRef, useState } from "react";
import { AI_TOOLS } from "../data/index.js";
import { useApp } from "../context/AppContext.jsx";
import ToolCard from "./ToolCard.jsx";
import { paths } from "../seo.js";

const PAGE = 12;

export default function Directory() {
  const { filters, setFilters, favorites } = useApp();
  const { category, query, pricing, sort, favoritesOnly } = filters;
  const [shown, setShown] = useState(PAGE);
  const [localQuery, setLocalQuery] = useState(query);

  const pushed = useRef(query);

  // Keep the input in sync only when something else (hero, categories, reset) changes the query.
  useEffect(() => {
    if (query !== pushed.current) {
      pushed.current = query;
      setLocalQuery(query);
    }
  }, [query]);

  // Debounce typing into the global filter.
  useEffect(() => {
    const t = setTimeout(() => {
      if (localQuery !== pushed.current) {
        pushed.current = localQuery;
        setFilters((f) => ({ ...f, query: localQuery }));
      }
    }, 200);
    return () => clearTimeout(t);
  }, [localQuery, setFilters]);

  // Reset pagination whenever filters change.
  useEffect(() => setShown(PAGE), [category, query, pricing, sort, favoritesOnly]);

  // Reflect filters in the URL so views are shareable (a category alone gets its own page address).
  const lastUrlKey = useRef(JSON.stringify([category, query, pricing, sort]));
  useEffect(() => {
    const key = JSON.stringify([category, query, pricing, sort]);
    if (key === lastUrlKey.current) return; // nothing changed: leave tool / article addresses alone
    lastUrlKey.current = key;
    const p = new URLSearchParams();
    if (query) p.set("search", query);
    if (pricing !== "all") p.set("pricing", pricing);
    if (sort !== "featured") p.set("sort", sort);
    const onCategoryPath = category !== "All" && !query;
    if (category !== "All" && !onCategoryPath) p.set("category", category);
    const qs = p.toString();
    const path = onCategoryPath ? paths.category(category) : "/";
    window.history.replaceState(null, "", path + (qs ? `?${qs}` : "") + window.location.hash);
  }, [category, query, pricing, sort]);

  const categories = useMemo(() => ["All", ...new Set(AI_TOOLS.map((t) => t.category))], []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = AI_TOOLS.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (pricing !== "all" && t.pricing !== pricing) return false;
      if (favoritesOnly && !favorites.includes(t.id)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((g) => g.toLowerCase().includes(q))
      );
    });
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === "free") sorted.sort((a, b) => (b.pricing === "free") - (a.pricing === "free"));
    else sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return sorted;
  }, [category, query, pricing, sort, favoritesOnly, favorites]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const hasFilters = category !== "All" || query || pricing !== "all" || favoritesOnly;
  const reset = () => {
    setLocalQuery("");
    setFilters({ category: "All", query: "", pricing: "all", sort: "featured", favoritesOnly: false });
  };

  return (
    <section className="tools-section" id="ai-tools">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-robot" /> AI Tools
          </div>
          <h2 className="section-title">{AI_TOOLS.length}+ Best AI Tools</h2>
          <p className="section-subtitle">The most comprehensive AI tools directory – search, filter and save your favorites</p>
        </div>

        <div className="filter-bar">
          <div className="filter-search">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search AI tools..."
              aria-label="Search directory"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
            {localQuery && (
              <button className="clear-btn" aria-label="Clear search" onClick={() => setLocalQuery("")}>
                <i className="fas fa-times" />
              </button>
            )}
          </div>
          <div className="filter-sort">
            <select value={pricing} onChange={(e) => set({ pricing: e.target.value })} aria-label="Filter by pricing">
              <option value="all">Any pricing</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="filter-sort">
            <select value={sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort tools">
              <option value="featured">Featured</option>
              <option value="name">A–Z</option>
              <option value="rating">Top Rated</option>
              <option value="free">Free First</option>
            </select>
          </div>
          <button
            className={`saved-toggle ${favoritesOnly ? "active" : ""}`}
            aria-pressed={favoritesOnly}
            onClick={() => set({ favoritesOnly: !favoritesOnly })}
          >
            <i className="fas fa-heart" /> Saved ({favorites.length})
          </button>
        </div>

        <div className="chip-row" role="tablist" aria-label="Categories">
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={c === category}
              className={`filter-tab ${c === category ? "active" : ""}`}
              onClick={() => set({ category: c })}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="results-bar" aria-live="polite">
          <span>
            Showing <strong>{Math.min(shown, results.length)}</strong> of <strong>{results.length}</strong> tools
          </span>
          {hasFilters && (
            <button className="link-btn" onClick={reset}>
              <i className="fas fa-undo" /> Reset filters
            </button>
          )}
        </div>

        <div className="tools-grid">
          {results.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search" />
              <p>
                {favoritesOnly && favorites.length === 0
                  ? "You haven't saved any tools yet. Tap the heart on a card to save it."
                  : "No tools found. Try a different search or category."}
              </p>
              {hasFilters && (
                <button className="load-more-btn" style={{ marginTop: 16 }} onClick={reset}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            results.slice(0, shown).map((t) => <ToolCard key={t.id} tool={t} />)
          )}
        </div>

        {results.length > shown && (
          <div className="load-more-wrap">
            <button className="load-more-btn" onClick={() => setShown((s) => s + PAGE)}>
              <i className="fas fa-plus" /> Load More ({results.length - shown} remaining)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
