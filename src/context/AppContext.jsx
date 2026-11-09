import { applyHead, metaFor, modalForRoute, parseRoute, routeForModal, routePath } from "../seo.js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable – ignore */
  }
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = readStorage("aith-theme", null);
    if (saved) return saved;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  const [favorites, setFavorites] = useState(() => readStorage("aith-favorites", []));
  const [modal, setModal] = useState(null); // {type:'tool'|'free'|'blog', id|tool}
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef(null);

  // Directory filter state lives here so the hero, categories and footer can drive it.
  const [filters, setFilters] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      category: p.get("category") || "All",
      query: p.get("search") || "",
      pricing: p.get("pricing") || "all",
      sort: p.get("sort") || "featured",
      favoritesOnly: false,
    };
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writeStorage("aith-theme", theme);
  }, [theme]);

  useEffect(() => writeStorage("aith-favorites", favorites), [favorites]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 3000);
  }, []);

  const toggleFavorite = useCallback(
    (id) => {
      setFavorites((prev) => {
        const has = prev.includes(id);
        toast(has ? "Removed from saved tools" : "Saved! Find it under “Saved” in the directory");
        return has ? prev.filter((x) => x !== id) : [...prev, id];
      });
    },
    [toast]
  );

  const copy = useCallback(
    (text, msg = "Copied to clipboard") => {
      navigator.clipboard
        ?.writeText(text)
        .then(() => toast(msg))
        .catch(() => toast("Copy failed – select and copy manually"));
    },
    [toast]
  );

  const scrollToDirectory = useCallback(() => {
    document.getElementById("ai-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ----- real URLs: each tool / category / article has its own address -----
  const pushPath = useCallback((path) => {
    if (path && window.location.pathname !== path) window.history.pushState({}, "", path + window.location.search);
  }, []);

  const applyRoute = useCallback((r) => {
    const m = modalForRoute(r);
    setModal(m);
    if (m) return;
    if (r.type === "category") setFilters((f) => ({ ...f, category: r.item.name, query: "", favoritesOnly: false }));
    const target = r.type === "freeHub" ? "free-tools" : r.type === "aiHub" || r.type === "category" ? "ai-tools" : null;
    if (target) setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }, []);

  const openModal = useCallback((m) => {
    setModal(m);
    const r = routeForModal(m);
    if (r) pushPath(routePath(r));
  }, [pushPath]);

  const closeModal = useCallback(() => {
    setModal(null);
    pushPath("/");
  }, [pushPath]);

  // Open a page by address (used by the crawlable link lists), without a full reload.
  const openPath = useCallback((path) => {
    const r = parseRoute(path);
    if (r.type === "notfound") return;
    pushPath(path);
    applyRoute(r);
  }, [pushPath, applyRoute]);

  // On first load and on back/forward, show whatever the address says.
  useEffect(() => {
    const sync = () => applyRoute(parseRoute(window.location.pathname));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [applyRoute]);

  // Keep the tab title, description and canonical link matching what is on screen.
  useEffect(() => {
    const r = routeForModal(modal) || parseRoute(window.location.pathname);
    applyHead(metaFor(r));
  }, [modal]);

  const goToDirectory = useCallback(
    (patch = {}) => {
      setFilters((f) => ({ ...f, ...patch }));
      setTimeout(scrollToDirectory, 50);
    },
    [scrollToDirectory]
  );

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      favorites,
      toggleFavorite,
      modal,
      openModal,
      closeModal,
      openPath,
      paletteOpen,
      setPaletteOpen,
      toast,
      toastMsg,
      copy,
      filters,
      setFilters,
      goToDirectory,
    }),
    [theme, favorites, toggleFavorite, modal, openModal, closeModal, openPath, paletteOpen, toast, toastMsg, copy, filters, goToDirectory]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
