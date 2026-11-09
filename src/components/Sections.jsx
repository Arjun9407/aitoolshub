import { useState } from "react";
import { AI_TOOLS, CATEGORIES, COMPARISON_DATA, TESTIMONIALS, FAQ_DATA, BLOG_POSTS, FREE_TOOLS } from "../data/index.js";
import { paths } from "../seo.js";
import { useApp } from "../context/AppContext.jsx";
import ToolCard from "./ToolCard.jsx";
import ToolIcon from "./ToolIcon.jsx";
import { hexToRgba } from "../utils.js";

export function Ticker() {
  const names = AI_TOOLS.filter((t) => t.featured).map((t) => t.name);
  const items = [...names, ...names];
  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div className="ticker">
        {items.map((n, i) => (
          <span key={i}>
            <i className="fas fa-star" /> {n}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Featured() {
  const featured = AI_TOOLS.filter((t) => t.featured).slice(0, 8);
  return (
    <section className="featured-section" id="featured">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-fire" /> Trending
          </div>
          <h2 className="section-title">Featured AI Tools</h2>
          <p className="section-subtitle">Hand-picked top AI tools making waves right now</p>
        </div>
        <div className="featured-grid">
          {featured.map((t) => (
            <ToolCard key={t.id} tool={t} featured />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Categories() {
  const { goToDirectory } = useApp();
  return (
    <section className="categories-section" id="categories">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-th-large" /> Browse
          </div>
          <h2 className="section-title">Explore by Category</h2>
          <p className="section-subtitle">Find the perfect AI tool for every use case</p>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => {
            const count = AI_TOOLS.filter((t) => t.category === cat.name).length;
            return (
              <button
                key={cat.name}
                className="cat-card card-in"
                onClick={() => goToDirectory({ category: cat.name, query: "", favoritesOnly: false })}
              >
                <div className="cat-icon" style={{ background: cat.bg, color: cat.color, fontSize: "1.5rem" }}>
                  {cat.icon}
                </div>
                <div className="cat-name">{cat.name}</div>
                <div className="cat-count">{count} tools</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CompareTable() {
  return (
    <section className="compare-section" id="compare">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-balance-scale" /> Compare
          </div>
          <h2 className="section-title">Top AI Tools Comparison</h2>
          <p className="section-subtitle">Side-by-side comparison of the most popular AI tools</p>
        </div>
        <div className="table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Category</th>
                <th>Free Tier</th>
                <th>Pricing</th>
                <th>Rating</th>
                <th>Best For</th>
                <th>Visit</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_DATA.map((row) => (
                <tr key={row.name}>
                  <td data-label="Tool">
                    <div className="tool-cell">
                      <ToolIcon tool={row} size={36} />
                      <div className="tool-cell-name">{row.name}</div>
                    </div>
                  </td>
                  <td data-label="Category">{row.category}</td>
                  <td data-label="Free tier" className={row.free.includes("✅") ? "free-tag" : "paid-tag"}>{row.free}</td>
                  <td data-label="Pricing">{row.pricing}</td>
                  <td data-label="Rating" className="stars">★ {row.rating}</td>
                  <td data-label="Best for" style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{row.bestFor}</td>
                  <td data-label="Visit">
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="visit-link">
                      <i className="fas fa-external-link-alt" /> Visit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function Blog() {
  const { openModal, toast } = useApp();
  const [cat, setCat] = useState("All");
  const cats = ["All", ...new Set(BLOG_POSTS.map((b) => b.category))];
  const posts = BLOG_POSTS.filter((p) => cat === "All" || p.category === cat);

  const subscribe = (e) => {
    e.preventDefault();
    toast("🎉 Thanks for subscribing! Check your inbox.");
    e.target.reset();
  };

  return (
    <section className="blog-section" id="blog">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-newspaper" /> Blog
          </div>
          <h2 className="section-title">AI Tools Blog &amp; Guides</h2>
          <p className="section-subtitle">
            In-depth articles, tutorials, and comparisons to help you get the most from AI
          </p>
        </div>
        <div className="blog-filter">
          {cats.map((c) => (
            <button key={c} className={`blog-filter-btn ${c === cat ? "active" : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="blog-grid">
          {posts.map((post) => (
            <article
              key={post.id}
              className="blog-card card-in"
              tabIndex={0}
              onClick={() => openModal({ type: "blog", id: post.id })}
              onKeyDown={(e) => e.key === "Enter" && openModal({ type: "blog", id: post.id })}
            >
              <div className="blog-card-image" style={{ background: post.color }}>
                <span style={{ position: "relative", zIndex: 1, fontSize: "3.5rem" }}>{post.emoji}</span>
                <div className="blog-img-overlay" />
              </div>
              <div className="blog-card-body">
                <span className="blog-category">
                  <i className="fas fa-folder" /> {post.category}
                </span>
                <h3 className="blog-title">{post.title}</h3>
                <p className="blog-excerpt">{post.excerpt}</p>
                <div className="blog-meta">
                  <div className="blog-meta-left">
                    <span>
                      <i className="fas fa-user" style={{ color: "var(--primary-light)" }} /> {post.author}
                    </span>
                    <span className="blog-read-time">
                      <i className="fas fa-clock" /> {post.readTime} read
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="blog-newsletter">
          <div className="newsletter-card" id="newsletter">
            <div className="newsletter-icon">
              <i className="fas fa-envelope-open-text" />
            </div>
            <h3>Get Weekly AI Tools Updates</h3>
            <p>Get the latest AI tools news, reviews and tutorials in your inbox every week.</p>
            <form className="newsletter-form" onSubmit={subscribe}>
              <input type="email" placeholder="Enter your email address..." required aria-label="Email address" />
              <button type="submit">
                <i className="fas fa-paper-plane" /> Subscribe Free
              </button>
            </form>
            <p className="newsletter-note">
              <i className="fas fa-lock" /> No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-heart" /> Reviews
          </div>
          <h2 className="section-title">What Users Say</h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div className="testimonial-card" key={t.name}>
              <div className="testimonial-stars">{"★".repeat(t.stars)}</div>
              <p className="testimonial-text">“{t.text}”</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.avatar}</div>
                <div>
                  <div className="author-name">{t.name}</div>
                  <div className="author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-question-circle" /> FAQ
          </div>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div className="faq-grid">
          {FAQ_DATA.map((item, i) => (
            <div className={`faq-item ${open === i ? "active" : ""}`} key={item.q}>
              <button
                className="faq-question"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{item.q}</span>
                <i className="fas fa-chevron-down faq-icon" />
              </button>
              <div className="faq-answer">
                <div className="faq-answer-inner">{item.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Plain links to every page, so search engines (and people without JavaScript) can reach all of them.
export function SiteIndex() {
  const { openPath } = useApp();
  const go = (path) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openPath(path);
  };
  const cats = CATEGORIES.filter((c) => AI_TOOLS.some((t) => t.category === c.name));
  return (
    <section className="site-index" aria-label="All tools">
      <div className="container">
        <details>
          <summary>All free tools ({FREE_TOOLS.length})</summary>
          <ul className="index-list">
            {FREE_TOOLS.map((t) => (
              <li key={t.id}><a href={paths.free(t)} onClick={go(paths.free(t))}>{t.name}</a></li>
            ))}
          </ul>
        </details>
        <details>
          <summary>AI tools by category ({cats.length})</summary>
          <ul className="index-list">
            {cats.map((c) => (
              <li key={c.name}><a href={paths.category(c.name)} onClick={go(paths.category(c.name))}>{c.name} AI tools</a></li>
            ))}
          </ul>
        </details>
        <details>
          <summary>All AI tools A to Z ({AI_TOOLS.length})</summary>
          <ul className="index-list">
            {[...AI_TOOLS].sort((a, b) => a.name.localeCompare(b.name)).map((t) => (
              <li key={t.id}><a href={paths.ai(t)} onClick={go(paths.ai(t))}>{t.name}</a></li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}

export function Footer() {
  const { goToDirectory } = useApp();
  const link = (cat, label) => (
    <li>
      <a
        href="#ai-tools"
        onClick={(e) => {
          e.preventDefault();
          goToDirectory({ category: cat, query: "", favoritesOnly: false });
        }}
      >
        {label}
      </a>
    </li>
  );
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">
                <i className="fas fa-robot" />
              </span>
              <span>
                AI<span className="accent">Tools</span>Hub
              </span>
            </div>
            <p>Your destination for discovering the best AI tools and free online tools.</p>
          </div>
          <div className="footer-links-group">
            <h4>AI Tools</h4>
            <ul>
              {link("All", "All AI Tools")}
              {link("Writing", "Writing Tools")}
              {link("Image", "Image Tools")}
              {link("Coding", "Coding Tools")}
              {link("Video", "Video Tools")}
            </ul>
          </div>
          <div className="footer-links-group">
            <h4>Free Tools</h4>
            <ul>
              <li>
                <a href="#free-tools">All Free Tools</a>
              </li>
            </ul>
          </div>
          <div className="footer-links-group">
            <h4>Resources</h4>
            <ul>
              <li>
                <a href="#blog">Blog</a>
              </li>
              <li>
                <a href="#compare">Compare Tools</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
              <li>
                <a href="#newsletter">Newsletter</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AIToolsHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
