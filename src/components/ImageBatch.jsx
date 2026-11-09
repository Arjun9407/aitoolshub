import { useEffect, useRef, useState } from "react";
import { Btn, Field } from "./ftui.jsx";
import { DropZone, PrivacyNote, baseName, canvasToBlob, download, downloadZip, fmtBytes, loadImage } from "./ftfiles.jsx";

// One engine for three tools: "compress", "resize" and "convert". Handles many images at once.
const MAX_FILES = 100;
const TYPES = { jpeg: ["image/jpeg", "jpg"], png: ["image/png", "png"], webp: ["image/webp", "webp"] };
const typeKeyOf = (mime) => (mime === "image/jpeg" ? "jpeg" : mime === "image/webp" ? "webp" : "png");

let uid = 0;

export default function ImageBatch({ mode }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [s, setS] = useState({
    quality: 0.78,
    format: mode === "convert" ? "webp" : "same",
    maxWidth: 0,
    resizeBy: "width", // width | height | percent | exact
    width: 1280,
    height: 720,
    percent: 50,
    background: "#ffffff",
  });
  const set = (patch) => setS((o) => ({ ...o, ...patch }));
  const urls = useRef(new Set());

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const add = (files, rejected) => {
    const room = MAX_FILES - items.length;
    const next = files.slice(0, room).map((file) => {
      const thumb = URL.createObjectURL(file);
      urls.current.add(thumb);
      return { id: ++uid, file, thumb, status: "ready" };
    });
    setItems((o) => [...o, ...next]);
    setNote([rejected ? `${rejected} file(s) skipped (not images).` : "", files.length > room ? `Limit is ${MAX_FILES} images at a time.` : ""].filter(Boolean).join(" "));
  };

  const remove = (id) => setItems((o) => o.filter((x) => x.id !== id));
  const clear = () => { setItems([]); setNote(""); };

  async function processOne(it) {
    const img = await loadImage(it.file);
    let w = img.naturalWidth, h = img.naturalHeight;
    if (mode === "resize") {
      if (s.resizeBy === "percent") { w = Math.round(w * s.percent / 100); h = Math.round(h * s.percent / 100); }
      else if (s.resizeBy === "width") { h = Math.round(h * s.width / w); w = s.width; }
      else if (s.resizeBy === "height") { w = Math.round(w * s.height / h); h = s.height; }
      else { w = s.width; h = s.height; }
    } else if (mode === "compress" && s.maxWidth > 0 && w > s.maxWidth) {
      h = Math.round(h * s.maxWidth / w); w = s.maxWidth;
    }
    w = Math.max(1, Math.min(w, 16384)); h = Math.max(1, Math.min(h, 16384));

    const key = s.format === "same" ? typeKeyOf(it.file.type) : s.format;
    const [mime, ext] = TYPES[key];
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (key === "jpeg") { ctx.fillStyle = s.background; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, mime, key === "png" ? undefined : s.quality);

    const suffix = mode === "compress" ? "-compressed" : mode === "resize" ? `-${w}x${h}` : "";
    // Never hand back a bigger file when the user only asked to compress.
    const keepOriginal = mode === "compress" && blob.size >= it.file.size && w === img.naturalWidth && key === typeKeyOf(it.file.type);
    return {
      status: "done",
      out: keepOriginal ? it.file : blob,
      outName: keepOriginal ? it.file.name : `${baseName(it.file.name)}${suffix}.${ext}`,
      dims: `${w}×${h}`,
      already: keepOriginal,
    };
  }

  const run = async () => {
    setBusy(true); setProgress(0);
    const snapshot = items;
    const results = [];
    for (let i = 0; i < snapshot.length; i++) {
      try { results.push(await processOne(snapshot[i])); }
      catch (e) { results.push({ status: "error", error: e.message }); }
      setProgress(Math.round(((i + 1) / snapshot.length) * 100));
      await new Promise((r) => setTimeout(r)); // let the page breathe
    }
    setItems((o) => o.map((it) => { const idx = snapshot.findIndex((x) => x.id === it.id); return idx >= 0 ? { ...it, ...results[idx] } : it; }));
    setBusy(false);
  };

  const done = items.filter((i) => i.status === "done");
  const totalIn = done.reduce((a, i) => a + i.file.size, 0);
  const totalOut = done.reduce((a, i) => a + i.out.size, 0);
  const zip = () => downloadZip(done.map((i) => ({ name: i.outName, blob: i.out })), `${mode}-images.zip`);

  const showQuality = s.format !== "png" && !(s.format === "same" && false);
  return (
    <>
      <DropZone accept="image/*" onFiles={add} label="Drop images here or click to choose" hint={`JPG, PNG, WebP, GIF, BMP · up to ${MAX_FILES} at once`} />
      {note && <div className="ft-hint">{note}</div>}

      <div className="ft-card">
        {mode === "resize" && (
          <>
            <Field label="Resize by">
              <select className="ft-input" value={s.resizeBy} onChange={(e) => set({ resizeBy: e.target.value })}>
                <option value="width">Width (keep proportions)</option>
                <option value="height">Height (keep proportions)</option>
                <option value="percent">Percentage</option>
                <option value="exact">Exact width × height (may stretch)</option>
              </select>
            </Field>
            <div className="ft-row wrap">
              {(s.resizeBy === "width" || s.resizeBy === "exact") && <Field label="Width (px)"><input className="ft-input" type="number" min="1" value={s.width} onChange={(e) => set({ width: Math.max(1, +e.target.value || 1) })} /></Field>}
              {(s.resizeBy === "height" || s.resizeBy === "exact") && <Field label="Height (px)"><input className="ft-input" type="number" min="1" value={s.height} onChange={(e) => set({ height: Math.max(1, +e.target.value || 1) })} /></Field>}
              {s.resizeBy === "percent" && <Field label={`Scale: ${s.percent}%`}><input type="range" min="5" max="200" value={s.percent} onChange={(e) => set({ percent: +e.target.value })} /></Field>}
            </div>
          </>
        )}
        {mode === "compress" && (
          <Field label="Shrink large images to a maximum width (0 = keep size)">
            <input className="ft-input" type="number" min="0" value={s.maxWidth} onChange={(e) => set({ maxWidth: Math.max(0, +e.target.value || 0) })} />
          </Field>
        )}
        <Field label={mode === "convert" ? "Convert to" : "Output format"}>
          <select className="ft-input" value={s.format} onChange={(e) => set({ format: e.target.value })}>
            {mode !== "convert" && <option value="same">Same as original</option>}
            <option value="jpeg">JPG</option><option value="png">PNG</option><option value="webp">WebP (smallest)</option>
          </select>
        </Field>
        {showQuality && s.format !== "png" && (
          <Field label={`Quality: ${Math.round(s.quality * 100)}%`}>
            <input type="range" min="0.1" max="1" step="0.01" value={s.quality} onChange={(e) => set({ quality: +e.target.value })} />
          </Field>
        )}
        {s.format === "jpeg" && <Field label="Background for transparent areas"><input type="color" value={s.background} onChange={(e) => set({ background: e.target.value })} /></Field>}
        {mode === "compress" && <p className="ft-hint">Tip: PNG files shrink the most when saved as WebP or JPG.</p>}
      </div>

      {items.length > 0 && (
        <div className="file-list">
          {items.map((it) => (
            <div className="file-row" key={it.id}>
              <img className="thumb" src={it.thumb} alt="" />
              <span className="fname" title={it.file.name}>{it.file.name}</span>
              <span className="fmeta">
                {fmtBytes(it.file.size)}
                {it.status === "done" && <> → <b>{fmtBytes(it.out.size)}</b> ({it.dims})</>}
              </span>
              {it.status === "done" && (it.already
                ? <span className="warn" title="Already well compressed">kept</span>
                : <span className={it.out.size <= it.file.size ? "good" : "warn"}>{it.out.size <= it.file.size ? "−" : "+"}{Math.abs(Math.round((1 - it.out.size / it.file.size) * 100))}%</span>)}
              {it.status === "error" && <span className="warn" title={it.error}>error</span>}
              {it.status === "done" && <button className="mini-btn" aria-label={`Download ${it.outName}`} onClick={() => download(it.out, it.outName)}><i className="fas fa-download" /></button>}
              <button className="mini-btn" aria-label={`Remove ${it.file.name}`} onClick={() => remove(it.id)}><i className="fas fa-times" /></button>
            </div>
          ))}
        </div>
      )}

      {busy && <div className="progress"><div style={{ width: `${progress}%` }} /></div>}
      <div className="ft-row wrap">
        <Btn onClick={run} disabled={!items.length || busy}>
          <i className="fas fa-bolt" /> {busy ? `Working… ${progress}%` : mode === "compress" ? "Compress images" : mode === "resize" ? "Resize images" : "Convert images"}
        </Btn>
        {done.length > 1 && <Btn variant="green" onClick={zip}><i className="fas fa-file-archive" /> Download all (ZIP)</Btn>}
        {items.length > 0 && <Btn variant="ghost" onClick={clear}>Clear</Btn>}
      </div>
      {done.length > 0 && mode === "compress" && (
        <div className="ft-result good">Saved {fmtBytes(Math.max(0, totalIn - totalOut))} in total ({totalIn ? Math.max(0, Math.round((1 - totalOut / totalIn) * 100)) : 0}% smaller)</div>
      )}
      <PrivacyNote />
    </>
  );
}
