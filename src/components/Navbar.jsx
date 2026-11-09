import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";

const LINKS = [
  ["home", "Home"],
  ["categories", "Categories"],
  ["ai-tools", "AI Tools"],
  ["free-tools", "Free Tools"],
  ["blog", "Blog"],
];

export default function Navbar() {
  const { theme, toggleTheme, favorites, setPaletteOpen, goToDirectory } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      let current = "home";
      LINKS.forEach(([id]) => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) current = id;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <a href="#home" className="nav-logo">
          <span className="logo-icon">
            <i className="fas fa-robot" />
          </span>
          <span className="logo-text">
            AI<span className="accent">Tools</span>Hub
          </span>
        </a>

        <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main">
          {LINKS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={`nav-link ${active === id ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <a href="#newsletter" className="nav-link nav-cta" onClick={() => setOpen(false)}>
            Subscribe
          </a>
        </nav>

        <div className="nav-actions">
          <button className="icon-btn search-trigger" onClick={() => setPaletteOpen(true)} aria-label="Quick search">
            <i className="fas fa-search" />
            <kbd>Ctrl K</kbd>
          </button>
          <button
            className="icon-btn"
            onClick={() => goToDirectory({ favoritesOnly: true, category: "All", query: "" })}
            aria-label={`Saved tools (${favorites.length})`}
            title="Saved tools"
          >
            <i className="fas fa-heart" />
            {favorites.length > 0 && <span className="badge-count">{favorites.length}</span>}
          </button>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <i className={theme === "dark" ? "fas fa-sun" : "fas fa-moon"} />
          </button>
          <button
            className={`hamburger ${open ? "is-open" : ""}`}
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
