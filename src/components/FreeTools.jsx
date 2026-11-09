import { useMemo, useState } from "react";
import { FREE_TOOLS } from "../data/index.js";
import { useApp } from "../context/AppContext.jsx";
import { hexToRgba } from "../utils.js";

export default function FreeTools() {
  const { openModal } = useApp();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const cats = useMemo(() => ["All", ...new Set(FREE_TOOLS.map((t) => t.category))], []);
  const term = q.toLowerCase().trim();
  const list = FREE_TOOLS.filter(
    (t) => (cat === "All" || t.category === cat) && (!term || t.name.toLowerCase().includes(term) || t.desc.toLowerCase().includes(term))
  );

  return (
    <section className="free-tools-section" id="free-tools">
      <div className="container">
        <div className="section-header">
          <div className="section-badge" style={{ background: "var(--green-gradient)" }}>
            <i className="fas fa-gift" /> 100% Free
          </div>
          <h2 className="section-title">{FREE_TOOLS.length} Free Online Tools</h2>
          <p className="section-subtitle">Powerful tools that run right in your browser – no signup, nothing uploaded</p>
        </div>

        <div className="free-search">
          <i className="fas fa-search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search free tools..." aria-label="Search free tools" />
        </div>
        <div className="free-filter-tabs">
          {cats.map((c) => (
            <button key={c} className={`free-filter-tab ${c === cat ? "active" : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="free-tools-grid">
          {list.length === 0 && (
            <div className="no-results">
              <i className="fas fa-search" />
              <p>No free tools match that search.</p>
            </div>
          )}
          {list.map((tool) => (
            <div
              key={tool.id}
              className="free-tool-card card-in"
              tabIndex={0}
              role="button"
              onClick={() => openModal({ type: "free", tool })}
              onKeyDown={(e) => e.key === "Enter" && openModal({ type: "free", tool })}
            >
              <div className="free-badge">{tool.badge}</div>
              <div className="free-tool-icon" style={{ background: hexToRgba(tool.color, 0.15), color: tool.color }}>
                {tool.icon}
              </div>
              <div className="free-tool-name">{tool.name}</div>
              <div className="free-tool-desc">{tool.desc}</div>
              <span className="free-tool-category">
                <i className="fas fa-tag" /> {tool.category}
              </span>
              <button
                className="use-tool-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openModal({ type: "free", tool });
                }}
              >
                <i className="fas fa-play-circle" /> Use Tool Free
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
