import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { useApp } from "../context/AppContext.jsx";
import { Area, Btn, CopyBtn, Stat, Field, words } from "./ftui.jsx";
import { md5 } from "../utils/md5.js";
import { renderMarkdown } from "../utils/markdown.js";

/* shared UI lives in ftui.jsx */
/* ---------- TEXT ---------- */
function WordCounter() {
  const [t, setT] = useState("");
  const sentences = t.split(/[.!?]+/).filter((s) => s.trim()).length;
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Paste or type your text here..." rows={8} />
      <div className="ft-stats">
        <Stat value={words(t)} label="Words" />
        <Stat value={t.length} label="Characters" />
        <Stat value={sentences} label="Sentences" />
        <Stat value={t.trim() ? Math.max(1, Math.ceil(words(t) / 200)) : 0} label="Min read" />
      </div>
    </>
  );
}

function CaseConverter() {
  const [t, setT] = useState("");
  const [out, setOut] = useState("");
  const wordsOf = (s) => s.trim().split(/[\s_-]+/).filter(Boolean);
  const modes = {
    UPPERCASE: (s) => s.toUpperCase(),
    lowercase: (s) => s.toLowerCase(),
    "Title Case": (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    "Sentence case": (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase()),
    camelCase: (s) => wordsOf(s).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join(""),
    snake_case: (s) => wordsOf(s).map((w) => w.toLowerCase()).join("_"),
    "kebab-case": (s) => wordsOf(s).map((w) => w.toLowerCase()).join("-"),
  };
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Enter your text here..." rows={4} />
      <div className="ft-row wrap">
        {Object.entries(modes).map(([name, fn]) => (
          <Btn key={name} variant="chip" onClick={() => setOut(fn(t))}>
            {name}
          </Btn>
        ))}
      </div>
      <Area value={out} readOnly placeholder="Result will appear here..." rows={4} />
      <CopyBtn text={out} />
    </>
  );
}

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.".split(
    ". "
  );
function LoremIpsum() {
  const [n, setN] = useState(3);
  const text = useMemo(
    () =>
      Array.from({ length: n }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => LOREM[(i + j) % LOREM.length].replace(/\.$/, "")).join(". ") + "."
      ).join("\n\n"),
    [n]
  );
  return (
    <>
      <Field label={`Paragraphs: ${n}`}>
        <input type="range" min="1" max="10" value={n} onChange={(e) => setN(+e.target.value)} />
      </Field>
      <Area value={text} readOnly rows={9} />
      <CopyBtn text={text} />
    </>
  );
}

function Palindrome() {
  const [t, setT] = useState("");
  const clean = t.toLowerCase().replace(/[^a-z0-9]/g, "");
  const ok = clean.length > 0 && clean === [...clean].reverse().join("");
  return (
    <>
      <input className="ft-input" value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. A man, a plan, a canal: Panama" />
      {clean && (
        <div className={`ft-result ${ok ? "good" : "bad"}`}>
          {ok ? "✅ Yes, it's a palindrome!" : "❌ Not a palindrome."}
        </div>
      )}
    </>
  );
}

function CharCounter() {
  const [t, setT] = useState("");
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Type or paste text here..." rows={6} />
      <div className="ft-stats three">
        <Stat value={t.length} label="With spaces" />
        <Stat value={t.replace(/\s/g, "").length} label="Without spaces" />
        <Stat value={words(t)} label="Words" />
      </div>
      <p className="ft-hint">
        Tweet: <b>{Math.max(0, 280 - t.length)}</b> left · Meta description: <b>{Math.max(0, 160 - t.length)}</b> left · SMS:{" "}
        <b>{Math.max(0, 160 - t.length)}</b> left
      </p>
    </>
  );
}

function TextDiff() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const diff = useMemo(() => {
    const x = a.split("\n");
    const y = b.split("\n");
    // Simple LCS-based line diff
    const dp = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
    for (let i = x.length - 1; i >= 0; i--)
      for (let j = y.length - 1; j >= 0; j--)
        dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = [];
    let i = 0, j = 0;
    while (i < x.length && j < y.length) {
      if (x[i] === y[j]) { out.push(["same", x[i]]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(["del", x[i++]]);
      else out.push(["add", y[j++]]);
    }
    while (i < x.length) out.push(["del", x[i++]]);
    while (j < y.length) out.push(["add", y[j++]]);
    return out;
  }, [a, b]);
  return (
    <>
      <div className="ft-cols">
        <Area value={a} onChange={setA} placeholder="Original text" rows={6} />
        <Area value={b} onChange={setB} placeholder="Modified text" rows={6} />
      </div>
      <div className="ft-diff">
        {!a && !b ? (
          <span className="ft-hint">Enter text on both sides to compare line by line.</span>
        ) : diff.every(([k]) => k === "same") ? (
          <div className="ft-result good">✅ Texts are identical</div>
        ) : (
          diff.map(([k, line], i) => (
            <div key={i} className={`diff-line ${k}`}>
              <span>{k === "add" ? "+" : k === "del" ? "−" : " "}</span>
              {line || " "}
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ---------- SEO ---------- */
function MetaTag() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [kw, setKw] = useState("");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const code = `<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}">${kw ? `\n<meta name="keywords" content="${esc(kw)}">` : ""}`;
  return (
    <>
      <Field label={`Page title (${title.length}/60)`}>
        <input className="ft-input" maxLength={70} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your page title" />
      </Field>
      <Field label={`Meta description (${desc.length}/160)`}>
        <textarea className="ft-input" rows={3} maxLength={180} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe your page for search results" />
      </Field>
      <Field label="Keywords (optional)">
        <input className="ft-input" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="keyword1, keyword2" />
      </Field>
      <div className="serp">
        <div className="serp-title">{title || "Your Page Title"}</div>
        <div className="serp-url">https://yourwebsite.com</div>
        <div className="serp-desc">{desc || "Your meta description will appear here as a snippet in search results."}</div>
      </div>
      <Area value={code} readOnly rows={4} mono />
      <CopyBtn text={code} label="Copy meta tags" />
    </>
  );
}

const STOP = new Set("the and for are but not you all can had her was one our out has have that with this from they will would there their what about which when your said each she how them these than then into more some could other been were being does just also over only very".split(" "));
function KeywordDensity() {
  const [t, setT] = useState("");
  const rows = useMemo(() => {
    const w = t.toLowerCase().replace(/[^a-z0-9\s']/g, " ").split(/\s+/).filter((x) => x.length > 2 && !STOP.has(x));
    const f = {};
    w.forEach((x) => (f[x] = (f[x] || 0) + 1));
    return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, c]) => [k, c, ((c / w.length) * 100).toFixed(1)]);
  }, [t]);
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Paste your content to analyze keyword density..." rows={6} />
      <div className="ft-table">
        {rows.length === 0 ? <span className="ft-hint">Top keywords will appear here (common stop words are ignored).</span> : rows.map(([k, c, p]) => (
          <div className="ft-table-row" key={k}>
            <span>{k}</span>
            <span className="ft-hint">{c}×</span>
            <b>{p}%</b>
          </div>
        ))}
      </div>
    </>
  );
}

function SlugGen() {
  const [t, setT] = useState("");
  const slug = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-");
  return (
    <>
      <input className="ft-input" value={t} onChange={(e) => setT(e.target.value)} placeholder="Enter a title or text..." />
      <div className="ft-result mono good">{slug || "your-slug-here"}</div>
      <CopyBtn text={slug} label="Copy slug" />
    </>
  );
}

function ReadingTime() {
  const [t, setT] = useState("");
  const [wpm, setWpm] = useState(220);
  const w = words(t);
  const mins = w / wpm;
  const label = !w ? "0 sec" : mins < 1 ? `${Math.max(1, Math.round(mins * 60))} sec` : `${Math.ceil(mins)} min`;
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Paste your article..." rows={7} />
      <Field label={`Reading speed: ${wpm} words/min`}>
        <input type="range" min="120" max="400" value={wpm} onChange={(e) => setWpm(+e.target.value)} />
      </Field>
      <div className="ft-stats three">
        <Stat value={w} label="Words" />
        <Stat value={label} label="Reading time" />
        <Stat value={w ? Math.max(1, Math.ceil(w / 130)) + " min" : "0"} label="Speaking time" />
      </div>
    </>
  );
}

/* ---------- DEVELOPER ---------- */
function JsonFormatter() {
  const [t, setT] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const run = (indent) => {
    try {
      setOut(JSON.stringify(JSON.parse(t), null, indent));
      setErr("");
    } catch (e) {
      setErr(e.message);
      setOut("");
    }
  };
  return (
    <>
      <Area value={t} onChange={setT} placeholder='{"key": "value", "list": [1, 2, 3]}' rows={6} mono />
      <div className="ft-row">
        <Btn onClick={() => run(2)}>Format</Btn>
        <Btn variant="ghost" onClick={() => run(0)}>Minify</Btn>
      </div>
      {err && <div className="ft-result bad">❌ Invalid JSON: {err}</div>}
      <Area value={out} readOnly placeholder="Output will appear here..." rows={7} mono />
      <CopyBtn text={out} />
    </>
  );
}

function Base64Tool() {
  const [t, setT] = useState("");
  const [out, setOut] = useState("");
  const enc = () => {
    // Build the binary string in chunks so large inputs don't overflow the call stack.
    const bytes = new TextEncoder().encode(t);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
    setOut(btoa(bin));
  };
  const dec = () => {
    try {
      setOut(new TextDecoder().decode(Uint8Array.from(atob(t.trim()), (c) => c.charCodeAt(0))));
    } catch {
      setOut("Error: input is not valid Base64");
    }
  };
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Enter text to encode or Base64 to decode..." rows={5} />
      <div className="ft-row">
        <Btn onClick={enc}>Encode →</Btn>
        <Btn variant="green" onClick={dec}>← Decode</Btn>
      </div>
      <Area value={out} readOnly placeholder="Result..." rows={5} mono />
      <CopyBtn text={out} />
    </>
  );
}

function UrlTool() {
  const [t, setT] = useState("");
  const [out, setOut] = useState("");
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Enter text or URL..." rows={4} />
      <div className="ft-row">
        <Btn onClick={() => setOut(encodeURIComponent(t))}>Encode →</Btn>
        <Btn variant="green" onClick={() => { try { setOut(decodeURIComponent(t)); } catch { setOut("Error: invalid encoded string"); } }}>← Decode</Btn>
      </div>
      <Area value={out} readOnly placeholder="Result..." rows={4} mono />
      <CopyBtn text={out} />
    </>
  );
}

function UuidGen() {
  const uuid = () =>
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
          (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        );
  const make = (n) => Array.from({ length: n }, uuid).join("\n");
  const [out, setOut] = useState(() => make(1));
  return (
    <>
      <Area value={out} readOnly rows={6} mono />
      <div className="ft-row wrap">
        <Btn onClick={() => setOut(make(1))}>Generate 1</Btn>
        <Btn variant="ghost" onClick={() => setOut(make(5))}>Generate 5</Btn>
        <Btn variant="ghost" onClick={() => setOut(make(20))}>Generate 20</Btn>
        <CopyBtn text={out} />
      </div>
    </>
  );
}

function CssMinifier() {
  const [t, setT] = useState("");
  const out = t
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};:,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
  const saved = t.length ? Math.round((1 - out.length / t.length) * 100) : 0;
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Paste CSS here..." rows={7} mono />
      <Area value={out} readOnly placeholder="Minified CSS..." rows={5} mono />
      {t && <p className="ft-hint">{t.length} → {out.length} characters ({saved}% smaller)</p>}
      <CopyBtn text={out} />
    </>
  );
}

function HtmlEntity() {
  const [t, setT] = useState("");
  const [out, setOut] = useState("");
  const encode = (s) => s.replace(/[&<>"'\u00a0-\u9999]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || `&#${c.charCodeAt(0)};`));
  const decode = (s) => { const d = document.createElement("textarea"); d.innerHTML = s; return d.value; };
  return (
    <>
      <Area value={t} onChange={setT} placeholder='e.g. <p class="x">Café & more</p>' rows={5} />
      <div className="ft-row">
        <Btn onClick={() => setOut(encode(t))}>Encode →</Btn>
        <Btn variant="green" onClick={() => setOut(decode(t))}>← Decode</Btn>
      </div>
      <Area value={out} readOnly rows={5} mono placeholder="Result..." />
      <CopyBtn text={out} />
    </>
  );
}

function RegexTester() {
  const [pattern, setPattern] = useState("\\b\\w{5}\\b");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("Hello world, this is a regex test.");
  const { matches, error } = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      const m = [...text.matchAll(re)].slice(0, 200);
      return { matches: m, error: "" };
    } catch (e) {
      return { matches: [], error: e.message };
    }
  }, [pattern, flags, text]);
  const parts = [];
  let last = 0;
  matches.forEach((m, i) => {
    if (m[0] === "") return;
    parts.push(text.slice(last, m.index));
    parts.push(<mark key={i}>{m[0]}</mark>);
    last = m.index + m[0].length;
  });
  parts.push(text.slice(last));
  return (
    <>
      <div className="ft-row">
        <input className="ft-input mono" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="pattern" />
        <input className="ft-input mono" style={{ maxWidth: 80 }} value={flags} onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))} placeholder="flags" />
      </div>
      <Area value={text} onChange={setText} rows={4} placeholder="Test string" />
      {error ? <div className="ft-result bad">❌ {error}</div> : <div className="ft-result"><b>{matches.length}</b> match{matches.length === 1 ? "" : "es"}</div>}
      <div className="ft-diff regex-out">{parts}</div>
    </>
  );
}

function MarkdownPreview() {
  const [t, setT] = useState("# Hello\n\nWrite **Markdown** on the left.\n\n- Lists\n- `inline code`\n- [Links](https://example.com)");
  return (
    <div className="ft-cols">
      <Area value={t} onChange={setT} rows={12} mono />
      <div className="md-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(t) }} />
    </div>
  );
}

function QrCode() {
  const [t, setT] = useState("https://example.com");
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!t) { setUrl(""); return; }
    QRCode.toDataURL(t, { margin: 1, width: 280 }).then(setUrl).catch(() => setUrl(""));
  }, [t]);
  return (
    <>
      <input className="ft-input" value={t} onChange={(e) => setT(e.target.value)} placeholder="URL or text" />
      <div className="qr-box">{url ? <img src={url} alt="QR code" width="200" height="200" /> : <span className="ft-hint">Enter text to generate a QR code</span>}</div>
      {url && <a className="ft-btn primary" href={url} download="qrcode.png"><i className="fas fa-download" /> Download PNG</a>}
    </>
  );
}

/* ---------- IMAGE / COLOR ---------- */
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return "#" + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function ColorPicker() {
  const { copy } = useApp();
  const [hex, setHex] = useState("#6366f1");
  const rgb = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(rgb);
  const [r, g, b] = rgb.map((x) => x / 255);
  const k = 1 - Math.max(r, g, b);
  const cmyk = k === 1 ? [0, 0, 0, 100] : [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map((x) => Math.round(x * 100));
  const rows = [["HEX", hex.toUpperCase()], ["RGB", `rgb(${rgb.join(", ")})`], ["HSL", `hsl(${h}, ${s}%, ${l}%)`], ["CMYK", `cmyk(${cmyk.join("%, ")}%)`]];
  return (
    <>
      <div className="ft-row">
        <input type="color" className="color-input" value={hex} onChange={(e) => setHex(e.target.value)} aria-label="Pick a color" />
        <div className="swatch-lg" style={{ background: hex }} />
      </div>
      {rows.map(([k2, v]) => (
        <div className="ft-copy-row" key={k2}>
          <span className="ft-hint">{k2}</span>
          <code>{v}</code>
          <Btn variant="ghost" onClick={() => copy(v)} aria-label={`Copy ${k2}`}><i className="fas fa-copy" /></Btn>
        </div>
      ))}
    </>
  );
}

function GradientGen() {
  const [c1, setC1] = useState("#6366f1");
  const [c2, setC2] = useState("#06b6d4");
  const [dir, setDir] = useState("135deg");
  const css = `linear-gradient(${dir}, ${c1}, ${c2})`;
  return (
    <>
      <div className="ft-row wrap">
        <Field label="Color 1"><input type="color" value={c1} onChange={(e) => setC1(e.target.value)} /></Field>
        <Field label="Color 2"><input type="color" value={c2} onChange={(e) => setC2(e.target.value)} /></Field>
        <Field label="Direction">
          <select className="ft-input" value={dir} onChange={(e) => setDir(e.target.value)}>
            <option value="to right">→ Left to right</option>
            <option value="to bottom">↓ Top to bottom</option>
            <option value="135deg">↘ 135°</option>
            <option value="45deg">↗ 45°</option>
          </select>
        </Field>
      </div>
      <div className="gradient-preview" style={{ background: css }} />
      <div className="ft-result mono">background: {css};</div>
      <CopyBtn text={`background: ${css};`} label="Copy CSS" />
    </>
  );
}

function AspectRatio() {
  const [w, setW] = useState(1920);
  const [h, setH] = useState(1080);
  const [nw, setNw] = useState(1280);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const d = w > 0 && h > 0 ? gcd(Math.round(w), Math.round(h)) : 1;
  const nh = w > 0 ? Math.round((nw * h) / w) : 0;
  return (
    <>
      <div className="ft-row">
        <Field label="Width"><input className="ft-input" type="number" value={w} onChange={(e) => setW(+e.target.value)} /></Field>
        <Field label="Height"><input className="ft-input" type="number" value={h} onChange={(e) => setH(+e.target.value)} /></Field>
      </div>
      <div className="ft-stats three">
        <Stat value={`${Math.round(w / d)}:${Math.round(h / d)}`} label="Aspect ratio" />
        <Stat value={h ? (w / h).toFixed(3) : "–"} label="Decimal" />
        <Stat value={w && h ? ((w * h) / 1e6).toFixed(2) + " MP" : "–"} label="Megapixels" />
      </div>
      <Field label="Resize: new width → matching height">
        <div className="ft-row">
          <input className="ft-input" type="number" value={nw} onChange={(e) => setNw(+e.target.value)} />
          <div className="ft-result" style={{ margin: 0 }}>× {nh} px</div>
        </div>
      </Field>
    </>
  );
}

function FaviconGen() {
  const [emoji, setEmoji] = useState("🤖");
  const [bg, setBg] = useState("#6366f1");
  const canvasRef = useRef(null);
  const draw = (size, canvas) => {
    canvas.width = canvas.height = size;
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, size, size);
    c.fillStyle = bg;
    c.beginPath();
    c.roundRect(0, 0, size, size, size * 0.22);
    c.fill();
    c.font = `${size * 0.62}px sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(emoji, size / 2, size / 2 + size * 0.04);
  };
  useEffect(() => { if (canvasRef.current) draw(128, canvasRef.current); }); // eslint-disable-line
  const download = (size) => {
    const cv = document.createElement("canvas");
    draw(size, cv);
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = `favicon-${size}.png`;
    a.click();
  };
  return (
    <>
      <div className="ft-row">
        <Field label="Emoji or letter"><input className="ft-input" maxLength={4} value={emoji} onChange={(e) => setEmoji(e.target.value)} /></Field>
        <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></Field>
      </div>
      <canvas ref={canvasRef} className="favicon-canvas" />
      <div className="ft-row wrap">
        {[16, 32, 48, 180, 512].map((s) => <Btn key={s} variant="ghost" onClick={() => download(s)}>{s}px PNG</Btn>)}
      </div>
    </>
  );
}

function ColorPalette() {
  const { copy } = useApp();
  const [base, setBase] = useState("#6366f1");
  const [h, s, l] = rgbToHsl(hexToRgb(base));
  const sets = {
    Complementary: [0, 180],
    Analogous: [-30, 0, 30],
    Triadic: [0, 120, 240],
    "Split-complementary": [0, 150, 210],
    Tetradic: [0, 90, 180, 270],
  };
  return (
    <>
      <div className="ft-row">
        <input type="color" className="color-input" value={base} onChange={(e) => setBase(e.target.value)} aria-label="Base color" />
        <span className="ft-hint">Click a swatch to copy its HEX code</span>
      </div>
      {Object.entries(sets).map(([name, offs]) => (
        <div key={name} className="palette-set">
          <div className="ft-hint">{name}</div>
          <div className="swatches">
            {offs.map((o) => {
              const c = hslToHex(h + o, s, l);
              return <button key={o} className="swatch" style={{ background: c }} onClick={() => copy(c)} title={c}><span>{c}</span></button>;
            })}
          </div>
        </div>
      ))}
      <div className="palette-set">
        <div className="ft-hint">Shades</div>
        <div className="swatches">
          {[15, 30, 45, 60, 75, 90].map((ll) => {
            const c = hslToHex(h, s, ll);
            return <button key={ll} className="swatch" style={{ background: c }} onClick={() => copy(c)} title={c}><span>{c}</span></button>;
          })}
        </div>
      </div>
    </>
  );
}

/* ---------- MATH ---------- */
function Percentage() {
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [c, setC] = useState(""); const [d, setD] = useState("");
  const [e, setE] = useState(""); const [f, setF] = useState("");
  const fmt = (n) => (Number.isFinite(n) ? +n.toFixed(4) : "–");
  const has = (...v) => v.every((x) => x !== "");
  return (
    <>
      <div className="ft-card">
        <div className="ft-hint">What is X% of Y?</div>
        <div className="ft-row"><input className="ft-input" type="number" placeholder="X %" value={a} onChange={(x) => setA(x.target.value)} /><input className="ft-input" type="number" placeholder="Y" value={b} onChange={(x) => setB(x.target.value)} /><b>= {has(a, b) ? fmt((a / 100) * b) : "?"}</b></div>
      </div>
      <div className="ft-card">
        <div className="ft-hint">X is what % of Y?</div>
        <div className="ft-row"><input className="ft-input" type="number" placeholder="X" value={c} onChange={(x) => setC(x.target.value)} /><input className="ft-input" type="number" placeholder="Y" value={d} onChange={(x) => setD(x.target.value)} /><b>= {has(c, d) ? fmt((c / d) * 100) + "%" : "?"}</b></div>
      </div>
      <div className="ft-card">
        <div className="ft-hint">Percentage change from X to Y</div>
        <div className="ft-row"><input className="ft-input" type="number" placeholder="From" value={e} onChange={(x) => setE(x.target.value)} /><input className="ft-input" type="number" placeholder="To" value={f} onChange={(x) => setF(x.target.value)} /><b>= {has(e, f) ? fmt(((f - e) / Math.abs(e)) * 100) + "%" : "?"}</b></div>
      </div>
    </>
  );
}

const UNITS = {
  Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  Weight: { kg: 1, g: 0.001, mg: 1e-6, lb: 0.45359237, oz: 0.028349523125, t: 1000 },
  Area: { "m²": 1, "km²": 1e6, "ha": 1e4, "ft²": 0.09290304, "acre": 4046.8564224, "mi²": 2589988.110336 },
  Volume: { L: 1, mL: 0.001, "m³": 1000, gal: 3.785411784, qt: 0.946352946, cup: 0.2365882365, "fl oz": 0.0295735295625 },
  Temperature: { "°C": 1, "°F": 1, K: 1 },
};
function UnitConverter() {
  const [cat, setCat] = useState("Length");
  const [val, setVal] = useState(1);
  const units = Object.keys(UNITS[cat]);
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const pick = (c) => { setCat(c); const u = Object.keys(UNITS[c]); setFrom(u[0]); setTo(u[1] || u[0]); };
  let result;
  if (cat === "Temperature") {
    const c = from === "°C" ? val : from === "°F" ? ((val - 32) * 5) / 9 : val - 273.15;
    result = to === "°C" ? c : to === "°F" ? (c * 9) / 5 + 32 : c + 273.15;
  } else result = (val * UNITS[cat][from]) / UNITS[cat][to];
  return (
    <>
      <div className="ft-row wrap">{Object.keys(UNITS).map((c) => <Btn key={c} variant={c === cat ? "primary" : "chip"} onClick={() => pick(c)}>{c}</Btn>)}</div>
      <div className="ft-row">
        <input className="ft-input" type="number" value={val} onChange={(e) => setVal(+e.target.value)} />
        <select className="ft-input" value={from} onChange={(e) => setFrom(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select>
        <span>→</span>
        <select className="ft-input" value={to} onChange={(e) => setTo(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select>
      </div>
      <div className="ft-result good big">{+result.toPrecision(8)} {to}</div>
    </>
  );
}

function BinaryHex() {
  const [v, setV] = useState("255");
  const [base, setBase] = useState(10);
  const n = parseInt(v, base);
  const ok = v.trim() !== "" && !Number.isNaN(n);
  const bigOk = ok && n <= Number.MAX_SAFE_INTEGER;
  return (
    <>
      <div className="ft-row">
        <input className="ft-input mono" value={v} onChange={(e) => setV(e.target.value)} />
        <select className="ft-input" style={{ maxWidth: 140 }} value={base} onChange={(e) => setBase(+e.target.value)}>
          <option value={2}>Binary</option><option value={8}>Octal</option><option value={10}>Decimal</option><option value={16}>Hex</option>
        </select>
      </div>
      {!bigOk && v.trim() && <div className="ft-result bad">Enter a valid number for the selected base.</div>}
      {bigOk && [["Binary", n.toString(2)], ["Octal", n.toString(8)], ["Decimal", n.toString(10)], ["Hex", n.toString(16).toUpperCase()]].map(([k, x]) => (
        <div className="ft-copy-row" key={k}><span className="ft-hint">{k}</span><code>{x}</code><CopyBtn text={x} label="" /></div>
      ))}
    </>
  );
}

function RomanNumeral() {
  const [v, setV] = useState("2026");
  const table = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  const toRoman = (n) => table.reduce((acc, [val, sym]) => { while (n >= val) { acc += sym; n -= val; } return acc; }, "");
  const fromRoman = (s) => {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < s.length; i++) { const cur = map[s[i]], nxt = map[s[i + 1]]; total += nxt > cur ? -cur : cur; }
    return total;
  };
  const t = v.trim().toUpperCase();
  let out = "";
  if (/^\d+$/.test(t)) { const n = +t; out = n >= 1 && n <= 3999 ? toRoman(n) : "Enter a number from 1 to 3999"; }
  else if (/^[IVXLCDM]+$/.test(t)) { const n = fromRoman(t); out = toRoman(n) === t ? String(n) : "Not a valid Roman numeral"; }
  else if (t) out = "Enter digits or a Roman numeral";
  return (
    <>
      <input className="ft-input mono" value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. 2026 or MMXXVI" />
      <div className="ft-result good big">{out || "…"}</div>
    </>
  );
}

/* ---------- SECURITY ---------- */
function PasswordGen() {
  const [len, setLen] = useState(16);
  const [opt, setOpt] = useState({ upper: true, lower: true, nums: true, syms: true });
  const [pw, setPw] = useState("");
  const gen = () => {
    let chars = "";
    if (opt.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (opt.lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (opt.nums) chars += "0123456789";
    if (opt.syms) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";
    // rejection sampling avoids modulo bias
    const limit = 256 - (256 % chars.length);
    let out = "";
    while (out.length < len) {
      const buf = crypto.getRandomValues(new Uint8Array(len * 2));
      for (const b of buf) { if (b < limit && out.length < len) out += chars[b % chars.length]; }
    }
    setPw(out);
  };
  useEffect(gen, [len, opt]); // eslint-disable-line
  const pool = (opt.upper ? 26 : 0) + (opt.lower ? 26 : 0) + (opt.nums ? 10 : 0) + (opt.syms ? 26 : 0) || 26;
  const bits = Math.round(len * Math.log2(pool));
  const strength = bits < 50 ? ["Weak", "#ef4444"] : bits < 80 ? ["Okay", "#f59e0b"] : bits < 110 ? ["Strong", "#3b82f6"] : ["Very strong", "#10b981"];
  return (
    <>
      <Field label={`Length: ${len}`}><input type="range" min="8" max="64" value={len} onChange={(e) => setLen(+e.target.value)} /></Field>
      <div className="ft-row wrap">
        {[["upper", "A-Z"], ["lower", "a-z"], ["nums", "0-9"], ["syms", "!@#"]].map(([k, label]) => (
          <label key={k} className="ft-check"><input type="checkbox" checked={opt[k]} onChange={(e) => setOpt({ ...opt, [k]: e.target.checked })} /> {label}</label>
        ))}
      </div>
      <div className="ft-result mono big" style={{ wordBreak: "break-all" }}>{pw}</div>
      <div className="strength"><div style={{ width: `${Math.min(100, bits)}%`, background: strength[1] }} /></div>
      <p className="ft-hint">{strength[0]} · ~{bits} bits of entropy · generated locally in your browser</p>
      <div className="ft-row"><Btn onClick={gen}><i className="fas fa-sync" /> Regenerate</Btn><CopyBtn text={pw} /></div>
    </>
  );
}

function HashTool({ algo }) {
  const [t, setT] = useState("");
  const [out, setOut] = useState("");
  useEffect(() => {
    let live = true;
    if (algo === "md5") { setOut(md5(t)); return; }
    if (!crypto.subtle) {
      setOut("SHA-256 needs a secure context (https:// or localhost).");
      return;
    }
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then((buf) => {
      if (live) setOut([...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""));
    });
    return () => { live = false; };
  }, [t, algo]);
  return (
    <>
      <Area value={t} onChange={setT} placeholder="Enter text to hash..." rows={4} />
      <div className="ft-result mono" style={{ wordBreak: "break-all" }}>{out}</div>
      <CopyBtn text={out} label="Copy hash" />
      {algo === "md5" && <p className="ft-hint">MD5 is fine for checksums but not secure for passwords.</p>}
    </>
  );
}

/* ---------- PRODUCTIVITY ---------- */
function Pomodoro() {
  const { toast } = useApp();
  const modes = { Focus: 25, "Short break": 5, "Long break": 15 };
  const [mode, setMode] = useState("Focus");
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left <= 0 && running) {
      setRunning(false);
      if (mode === "Focus") setDone((d) => d + 1);
      toast(mode === "Focus" ? "🍅 Focus session complete — take a break!" : "Break over — back to it!");
    }
  }, [left, running, mode, toast]);

  const choose = (m) => { setMode(m); setLeft(modes[m] * 60); setRunning(false); };
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, "0");
  const ss = String(Math.max(0, left % 60)).padStart(2, "0");
  const baseTitle = useRef(typeof document !== "undefined" ? document.title : "");
  useEffect(() => {
    document.title = running ? `${mm}:${ss} · ${mode}` : baseTitle.current;
  }, [mm, ss, running, mode]);
  useEffect(() => {
    const original = baseTitle.current;
    return () => { document.title = original; };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div className="ft-hint" style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>{mode}</div>
      <div className="pomo-time">{mm}:{ss}</div>
      <div className="ft-row" style={{ justifyContent: "center" }}>
        <Btn onClick={() => setRunning((r) => !r)}><i className={`fas ${running ? "fa-pause" : "fa-play"}`} /> {running ? "Pause" : left === modes[mode] * 60 ? "Start" : "Resume"}</Btn>
        <Btn variant="ghost" onClick={() => choose(mode)} aria-label="Reset"><i className="fas fa-redo" /></Btn>
      </div>
      <div className="ft-row wrap" style={{ justifyContent: "center" }}>{Object.keys(modes).map((m) => <Btn key={m} variant={m === mode ? "primary" : "chip"} onClick={() => choose(m)}>{m} {modes[m]}m</Btn>)}</div>
      <p className="ft-hint">Pomodoros completed: {done}</p>
    </div>
  );
}

export const FREE_TOOL_COMPONENTS = {
  wordCounter: WordCounter,
  caseConverter: CaseConverter,
  loremIpsum: LoremIpsum,
  palindrome: Palindrome,
  metaTag: MetaTag,
  keywordDensity: KeywordDensity,
  slugGenerator: SlugGen,
  readingTime: ReadingTime,
  jsonFormatter: JsonFormatter,
  base64: Base64Tool,
  urlEncoder: UrlTool,
  uuid: UuidGen,
  cssMinifier: CssMinifier,
  htmlEntity: HtmlEntity,
  colorPicker: ColorPicker,
  gradientGen: GradientGen,
  aspectRatio: AspectRatio,
  favicon: FaviconGen,
  percentage: Percentage,
  unitConverter: UnitConverter,
  binaryHex: BinaryHex,
  romanNumeral: RomanNumeral,
  passwordGen: PasswordGen,
  md5Hash: () => <HashTool algo="md5" />,
  sha256: () => <HashTool algo="sha256" />,
  pomodoro: Pomodoro,
  charCounter: CharCounter,
  qrCode: QrCode,
  colorPalette: ColorPalette,
  regexTester: RegexTester,
  textDiff: TextDiff,
  markdownPreview: MarkdownPreview,
};
