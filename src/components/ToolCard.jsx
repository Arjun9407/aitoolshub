import { memo } from "react";
import { useApp } from "../context/AppContext.jsx";
import ToolIcon from "./ToolIcon.jsx";

const PRICING_CLASS = { free: "pricing-free", paid: "pricing-paid", freemium: "pricing-freemium" };
const PRICING_LABEL = { free: "Free", paid: "Paid", freemium: "Freemium" };

function ToolCard({ tool, featured = false }) {
  const { openModal, favorites, toggleFavorite } = useApp();
  const saved = favorites.includes(tool.id);
  const stars = "★".repeat(Math.floor(tool.rating)) + (tool.rating % 1 >= 0.5 ? "½" : "");

  return (
    <article
      className="featured-card card-in"
      tabIndex={0}
      role="button"
      aria-label={`Open details for ${tool.name}`}
      onClick={() => openModal({ type: "tool", id: tool.id })}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          openModal({ type: "tool", id: tool.id });
        }
      }}
    >
      {featured && <div className="featured-badge">🔥 Featured</div>}
      <button
        className={`fav-btn ${saved ? "saved" : ""}`}
        aria-label={saved ? `Remove ${tool.name} from saved` : `Save ${tool.name}`}
        aria-pressed={saved}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(tool.id);
        }}
      >
        <i className={saved ? "fas fa-heart" : "far fa-heart"} />
      </button>

      <ToolIcon tool={tool} size={56} className="tool-icon-wrap" />
      <div className="tool-meta">
        <div className="tool-name">{tool.name}</div>
        <div className="tool-desc">{tool.desc}</div>
        <div className="tool-tags">
          {tool.tags.map((tag) => (
            <span className="tool-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="tool-footer">
          <div className="tool-rating">
            <span>{stars}</span> {tool.rating}
          </div>
          <span className={`tool-pricing ${PRICING_CLASS[tool.pricing] || "pricing-freemium"}`}>
            {PRICING_LABEL[tool.pricing] || "Freemium"}
          </span>
        </div>
        <a
          className="tool-visit-btn"
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-external-link-alt" /> Visit {tool.name}
        </a>
      </div>
    </article>
  );
}

export default memo(ToolCard);
