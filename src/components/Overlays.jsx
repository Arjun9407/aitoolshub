import { useEffect, useRef, useState } from "react";
import { AI_TOOLS, BLOG_POSTS } from "../data/index.js";
import { useApp } from "../context/AppContext.jsx";
import ToolIcon from "./ToolIcon.jsx";
import FreeToolBody from "./FreeToolBody.jsx";
import { renderMarkdown } from "../utils/markdown.js";

const PRICING_CLASS = { free: "pricing-free", paid: "pricing-paid", freemium: "pricing-freemium" };
const PRICING_LABEL = { free: "Free", paid: "Paid", freemium: "Freemium" };

function ToolDetail({ tool }) {
  const { favorites, toggleFavorite, copy, openModal } = useApp();
  const saved = favorites.includes(tool.id);
  const stars = "★".repeat(Math.floor(tool.rating)) + (tool.rating % 1 >= 0.5 ? "½" : "");
  const similar = AI_TOOLS.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 3);

  return (
    <>
      <div className="modal-tool-header">
        <ToolIcon tool={tool} size={64} className="modal-tool-icon" />
        <div>
          <div className="modal-tool-name">{tool.name}</div>
          <div className="modal-tool-cat">
            <i className="fas fa-tag" /> {tool.category} • <span style={{ color: "var(--accent)" }}>{stars} {tool.rating}</span> •{" "}
            <span className={`tool-pricing ${PRICING_CLASS[tool.pricing]}`} style={{ padding: "2px 8px" }}>
              {PRICING_LABEL[tool.pricing]}
            </span>
          </div>
        </div>
      </div>
      <div className="modal-section">
        <h4>About</h4>
        <p>{tool.desc}</p>
      </div>
      <div className="modal-section">
        <h4>Key Features</h4>
        <div className="modal-features">
          {tool.features.map((f) => (
            <span className="modal-feature" key={f}>
              <i className="fas fa-check" style={{ color: "var(--green)", marginRight: 4, fontSize: "0.75rem" }} />
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="modal-section" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <h4>Pricing</h4>
          <p>{tool.price}</p>
        </div>
        <div>
          <h4>Category</h4>
          <p>{tool.category}</p>
        </div>
        <div>
          <h4>Tags</h4>
          <p>{tool.tags.join(", ")}</p>
        </div>
      </div>
      {similar.length > 0 && (
        <div className="modal-section">
          <h4>Similar tools</h4>
          <div className="modal-features">
            {similar.map((s) => (
              <button key={s.id} className="modal-feature as-btn" onClick={() => openModal({ type: "tool", id: s.id })}>
                <ToolIcon tool={s} size={20} /> {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="modal-cta">
        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="modal-visit-btn">
          <i className="fas fa-external-link-alt" /> Visit {tool.name} →
        </a>
        <button
          className={`modal-icon-btn ${saved ? "saved" : ""}`}
          onClick={() => toggleFavorite(tool.id)}
          aria-label={saved ? "Remove from saved" : "Save tool"}
          aria-pressed={saved}
        >
          <i className={saved ? "fas fa-heart" : "far fa-heart"} />
        </button>
        <button className="modal-icon-btn" onClick={() => copy(tool.url, "URL copied")} aria-label="Copy URL">
          <i className="fas fa-copy" />
        </button>
      </div>
    </>
  );
}

function BlogDetail({ post }) {
  const { copy } = useApp();
  const share = () => {
    if (navigator.share) navigator.share({ title: post.title, url: window.location.href }).catch(() => {});
    else copy(window.location.href, "Link copied");
  };
  return (
    <>
      <div style={{ background: post.color, borderRadius: 12, padding: 30, textAlign: "center", marginBottom: 24, fontSize: "3rem" }}>
        {post.emoji}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className="blog-category">
          <i className="fas fa-folder" /> {post.category}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{post.date}</span>
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", lineHeight: 1.3, marginBottom: 16 }}>{post.title}</h2>
      <div className="blog-detail-meta">
        <span>
          <i className="fas fa-user" /> {post.author}
        </span>
        <span>
          <i className="fas fa-clock" /> {post.readTime} read
        </span>
      </div>
      {post.content ? (
        <div className="article-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
      ) : (
        <>
          <p className="blog-detail-p">{post.excerpt}</p>
          <p className="blog-detail-p">
            The full article is coming soon. In the meantime, browse the directory to compare the tools mentioned here.
          </p>
        </>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {post.tags.map((t) => (
          <span className="modal-feature" key={t}>
            #{t}
          </span>
        ))}
      </div>
      <div className="modal-cta">
        <button className="modal-visit-btn" onClick={share}>
          <i className="fas fa-share" /> Share
        </button>
      </div>
    </>
  );
}

export function Modal() {
  const { modal, closeModal } = useApp();
  const cardRef = useRef(null);

  useEffect(() => {
    if (!modal) return;
    const prev = document.activeElement;
    document.body.style.overflow = "hidden";
    cardRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [modal?.type, closeModal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    cardRef.current?.scrollTo?.({ top: 0 });
  }, [modal?.id]);

  let body = null;
  if (modal?.type === "tool") {
    const tool = AI_TOOLS.find((t) => t.id === modal.id);
    body = tool && <ToolDetail tool={tool} />;
  } else if (modal?.type === "blog") {
    const post = BLOG_POSTS.find((p) => p.id === modal.id);
    body = post && <BlogDetail post={post} />;
  } else if (modal?.type === "free") {
    body = <FreeToolBody tool={modal.tool} />;
  }

  return (
    <div
      className={`modal-overlay ${modal ? "open" : ""}`}
      onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
      aria-hidden={!modal}
    >
      <div className="modal-card" role="dialog" aria-modal="true" tabIndex={-1} ref={cardRef}>
        <button className="modal-close" onClick={closeModal} aria-label="Close">
          <i className="fas fa-times" />
        </button>
        {body}
      </div>
    </div>
  );
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openModal, goToDirectory, toggleTheme } = useApp();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  const term = q.toLowerCase().trim();
  const actions = [
    { label: "Toggle light / dark theme", icon: "🌓", run: toggleTheme },
    { label: "Show saved tools", icon: "❤️", run: () => goToDirectory({ favoritesOnly: true, category: "All", query: "" }) },
    { label: "Jump to Free Tools", icon: "🎁", run: () => document.getElementById("free-tools")?.scrollIntoView({ behavior: "smooth" }) },
  ].filter((a) => !term || a.label.toLowerCase().includes(term));

  const tools = (term
    ? AI_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term) ||
          t.tags.some((g) => g.toLowerCase().includes(term))
      )
    : AI_TOOLS.filter((t) => t.featured)
  ).slice(0, 8);

  const items = [
    ...tools.map((t) => ({ key: `t${t.id}`, label: t.name, sub: t.category, tool: t, run: () => openModal({ type: "tool", id: t.id }) })),
    ...actions.map((a) => ({ key: a.label, label: a.label, sub: "Action", icon: a.icon, run: a.run })),
  ];

  const choose = (item) => {
    setPaletteOpen(false);
    item?.run();
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(items[idx]);
    }
  };

  if (!paletteOpen) return null;
  return (
    <div className="palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && setPaletteOpen(false)}>
      <div className="palette" role="dialog" aria-label="Quick search">
        <div className="palette-input">
          <i className="fas fa-search" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={onKey}
            placeholder="Search tools or run an action…"
            aria-label="Quick search"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" role="listbox">
          {items.length === 0 && <div className="palette-empty">No matches</div>}
          {items.map((it, i) => (
            <div
              key={it.key}
              role="option"
              aria-selected={i === idx}
              className={`palette-item ${i === idx ? "active" : ""}`}
              onMouseEnter={() => setIdx(i)}
              onMouseDown={() => choose(it)}
            >
              <span className="palette-icon">{it.tool ? <ToolIcon tool={it.tool} size={28} /> : it.icon}</span>
              <span className="palette-label">{it.label}</span>
              <span className="palette-sub">{it.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Toast() {
  const { toastMsg } = useApp();
  return (
    <div className={`toast ${toastMsg ? "show" : ""}`} role="status" aria-live="polite">
      <i className="fas fa-check-circle" /> {toastMsg}
    </div>
  );
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      className={`back-to-top ${visible ? "visible" : ""}`}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <i className="fas fa-chevron-up" />
    </button>
  );
}

export function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem("aith-cookies");
    } catch {
      /* ignore */
    }
    if (seen) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const answer = (v) => {
    try {
      localStorage.setItem("aith-cookies", v);
    } catch {
      /* ignore */
    }
    setShow(false);
  };
  return (
    <div className={`cookie-notice ${show ? "visible" : ""}`} role="region" aria-label="Cookie notice">
      <div className="cookie-content">
        <i className="fas fa-cookie-bite" />
        <p>We use cookies to enhance your experience and analyze site traffic.</p>
        <div className="cookie-buttons">
          <button onClick={() => answer("accepted")} className="cookie-accept">
            Accept All
          </button>
          <button onClick={() => answer("declined")} className="cookie-decline">
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
