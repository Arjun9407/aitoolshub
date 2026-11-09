import { useEffect, useRef, useState } from "react";
import { Btn, Field } from "../../components/ftui.jsx";
import { DropZone, PrivacyNote, canvasToBlob, download, fmtBytes, loadImage } from "../../components/ftfiles.jsx";
import { pdfBlob } from "../../components/pdfUtil.js";

const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
let uid = 0;

export default function ImagesToPdf() {
  const [items, setItems] = useState([]);
  const [size, setSize] = useState("a4");
  const [orient, setOrient] = useState("auto");
  const [margin, setMargin] = useState(24);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const urls = useRef(new Set());
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const add = (files) => {
    setItems((o) => [...o, ...files.map((file) => { const thumb = URL.createObjectURL(file); urls.current.add(thumb); return { id: ++uid, file, thumb }; })]);
  };
  const move = (i, d) => setItems((o) => { const a = [...o]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });

  // Anything that isn't a plain JPG/PNG is redrawn as PNG so every browser-readable image works.
  async function embed(pdf, file) {
    if (file.type === "image/jpeg") return pdf.embedJpg(new Uint8Array(await file.arrayBuffer()));
    if (file.type === "image/png") return pdf.embedPng(new Uint8Array(await file.arrayBuffer()));
    const img = await loadImage(file);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    return pdf.embedPng(new Uint8Array(await (await canvasToBlob(c)).arrayBuffer()));
  }

  const make = async () => {
    setBusy(true); setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      for (const it of items) {
        const img = await embed(pdf, it.file);
        let pw, ph;
        if (size === "fit") { pw = img.width + margin * 2; ph = img.height + margin * 2; }
        else {
          [pw, ph] = SIZES[size];
          const landscape = orient === "landscape" || (orient === "auto" && img.width > img.height);
          if (landscape) [pw, ph] = [ph, pw];
        }
        const page = pdf.addPage([pw, ph]);
        const scale = Math.min((pw - margin * 2) / img.width, (ph - margin * 2) / img.height, size === "fit" ? 1 : Infinity);
        const w = img.width * scale, h = img.height * scale;
        page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
      download(pdfBlob(await pdf.save()), "images.pdf");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <DropZone accept="image/*" onFiles={add} label="Drop images here or click to choose" hint="JPG, PNG, WebP, GIF, BMP · each image becomes one page" />
      {items.length > 0 && (
        <div className="file-list">
          {items.map((it, i) => (
            <div className="file-row" key={it.id}>
              <img className="thumb" src={it.thumb} alt="" />
              <span className="fname" title={it.file.name}>{i + 1}. {it.file.name}</span>
              <span className="fmeta">{fmtBytes(it.file.size)}</span>
              <button className="mini-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><i className="fas fa-arrow-up" /></button>
              <button className="mini-btn" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><i className="fas fa-arrow-down" /></button>
              <button className="mini-btn" aria-label={`Remove ${it.file.name}`} onClick={() => setItems((o) => o.filter((x) => x.id !== it.id))}><i className="fas fa-times" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="ft-row wrap">
        <Field label="Page size">
          <select className="ft-input" value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="a4">A4</option><option value="letter">US Letter</option><option value="fit">Same size as each image</option>
          </select>
        </Field>
        {size !== "fit" && (
          <Field label="Orientation">
            <select className="ft-input" value={orient} onChange={(e) => setOrient(e.target.value)}>
              <option value="auto">Automatic</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option>
            </select>
          </Field>
        )}
        <Field label={`Margin: ${margin}`}><input type="range" min="0" max="72" value={margin} onChange={(e) => setMargin(+e.target.value)} /></Field>
      </div>
      {error && <div className="ft-result bad">{error}</div>}
      <div className="ft-row wrap">
        <Btn onClick={make} disabled={!items.length || busy}><i className="fas fa-file-pdf" /> {busy ? "Creating PDF…" : `Create PDF (${items.length} page${items.length === 1 ? "" : "s"})`}</Btn>
        {items.length > 0 && <Btn variant="ghost" onClick={() => setItems([])}>Clear</Btn>}
      </div>
      <PrivacyNote />
    </>
  );
}
