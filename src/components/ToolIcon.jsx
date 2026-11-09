import { useState } from "react";
import { hexToRgba } from "../utils.js";

// Real brand logo for a tool, with an emoji fallback.
//
// Order tried:
//   1. tool.logo         – your own file or URL (e.g. "/logos/foo.svg"): best quality, add it for important tools
//   2. Google favicon service for the tool's website (or tool.domain if you set one)
//   3. DuckDuckGo icon service
//   4. the tool's emoji icon
//
// Logos are fetched live by each visitor's browser, so Google/DuckDuckGo see which tool domains are shown on
// the page (not who the visitor is beyond a normal image request). To avoid third parties entirely, put the
// files in /public/logos and set "logo" on each tool.

const stageByKey = new Map(); // remembers which source worked, so re-renders don't flicker

function hostOf(tool) {
  try {
    return new URL(tool.domain ? `https://${tool.domain}` : tool.url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sources(tool) {
  const host = hostOf(tool);
  const list = [];
  if (tool.logo) list.push(tool.logo);
  if (host) {
    list.push(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url=https://${host}&size=128`);
    list.push(`https://icons.duckduckgo.com/ip3/${host}.ico`);
  }
  return list;
}

export default function ToolIcon({ tool, size = 56, className = "", style }) {
  const key = tool.id ?? tool.name;
  const srcs = sources(tool);
  const [stage, setStage] = useState(() => stageByKey.get(key) ?? 0);
  const failed = stage >= srcs.length;

  const next = () => {
    stageByKey.set(key, stage + 1);
    setStage(stage + 1);
  };

  const box = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.22),
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...style,
  };

  if (failed) {
    return (
      <span
        className={`tool-emoji ${className}`}
        style={{ ...box, background: hexToRgba(tool.color, 0.15), color: tool.color, fontSize: size * 0.5 }}
        aria-hidden="true"
      >
        {tool.icon}
      </span>
    );
  }

  return (
    <span className={`tool-logo ${className}`} style={{ ...box, padding: Math.round(size * 0.14) }}>
      <img
        key={stage}
        src={srcs[stage]}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          // Services sometimes return a tiny generic placeholder instead of a 404.
          if (e.currentTarget.naturalWidth < 24 && !tool.logo) next();
        }}
        onError={next}
      />
    </span>
  );
}
