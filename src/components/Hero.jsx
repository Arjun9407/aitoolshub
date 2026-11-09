import { useEffect, useRef, useState } from "react";
import { AI_TOOLS, CATEGORIES, FREE_TOOLS } from "../data/index.js";
import { useApp } from "../context/AppContext.jsx";
import ToolIcon from "./ToolIcon.jsx";

function Counter({ target, suffix, label }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / 1600, 1);
          setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);

  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-line">
        <span className="stat-number">{value}</span>
        <span>{suffix}</span>
      </div>
      <p>{label}</p>
    </div>
  );
}

const QUICK_TAGS = [
  ["Writing", "fa-pen"],
  ["Image", "fa-image"],
  ["Coding", "fa-code"],
  ["SEO", "fa-chart-line"],
  ["Video", "fa-video"],
  ["Chatbot", "fa-comments"],
];

export default function Hero() {
  const { openModal, goToDirectory } = useApp();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [idx, setIdx] = useState(-1);
  const wrapRef = useRef(null);

  const term = q.toLowerCase().trim();
  const matches = term
    ? AI_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term) ||
          t.tags.some((g) => g.toLowerCase().includes(term))
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setFocus(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const submit = () => {
    if (!q.trim()) return;
    goToDirectory({ query: q.trim(), category: "All", favoritesOnly: false });
    setFocus(false);
  };

  const pick = (tool) => {
    setFocus(false);
    setQ("");
    openModal({ type: "tool", id: tool.id });
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (idx >= 0 && matches[idx]) pick(matches[idx]);
      else submit();
    } else if (e.key === "Escape") setFocus(false);
  };

  return (
    <section className="hero" id="home">
      <div className="hero-bg">
        <div className="hero-grid" />
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />
        <div className="hero-orb orb-3" />
      </div>
      <div className="hero-content">
        <div className="hero-badge">
          <i className="fas fa-bolt" /> Your hub for the best AI tools
        </div>
        <h1 className="hero-title">
          Discover the Best <span className="gradient-text">AI Tools</span> &amp;{" "}
          <span className="gradient-text-2">Free Tools</span>
        </h1>
        <p className="hero-subtitle">
          Explore {AI_TOOLS.length}+ AI-powered tools and {FREE_TOOLS.length} free browser-based utilities for writing, design,
          coding, SEO, video, productivity, and more. Save your favorites and compare in seconds.
        </p>

        <div className="hero-search" ref={wrapRef}>
          <div className="search-wrapper">
            <i className="fas fa-search search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search AI tools, categories, use cases..."
              autoComplete="off"
              aria-label="Search AI tools"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setIdx(-1);
                setFocus(true);
              }}
              onFocus={() => setFocus(true)}
              onKeyDown={onKey}
            />
            <button className="search-btn" onClick={submit}>
              Search
            </button>
          </div>
          {focus && matches.length > 0 && (
            <div className="search-suggestions" style={{ display: "block" }} role="listbox">
              {matches.map((t, i) => (
                <div
                  key={t.id}
                  role="option"
                  aria-selected={i === idx}
                  className={`suggestion-item ${i === idx ? "highlight" : ""}`}
                  onMouseDown={() => pick(t)}
                >
                  <ToolIcon tool={t} size={32} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {t.category} • {t.pricing}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hero-stats">
          <Counter target={AI_TOOLS.length} suffix="+" label="AI Tools" />
          <Counter target={FREE_TOOLS.length} suffix="" label="Free Tools" />
          <Counter target={CATEGORIES.length} suffix="+" label="Categories" />
        </div>

        <div className="hero-tags">
          {QUICK_TAGS.map(([name, icon]) => (
            <button
              key={name}
              className="tag"
              onClick={() => goToDirectory({ category: name, query: "", favoritesOnly: false })}
            >
              <i className={`fas ${icon}`} /> {name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
