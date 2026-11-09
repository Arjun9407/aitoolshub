import { useMemo, useState } from "react";
import { Btn, Field } from "../../components/ftui.jsx";
import { BARCODE_FORMATS, barcodeCanvas } from "../../components/barcodeUtil.js";
import { canvasToBlob, downloadZip, safeName } from "../../components/ftfiles.jsx";

const MAX = 300;

export default function BulkBarcodeGenerator() {
  const [format, setFormat] = useState("CODE128");
  const [text, setText] = useState("ITEM-0001\nITEM-0002\nITEM-0003");
  const [height, setHeight] = useState(80);
  const [busy, setBusy] = useState(false);

  const lines = useMemo(() => [...new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))], [text]);
  const { items, errors } = useMemo(() => {
    const items = [];
    const errors = [];
    lines.slice(0, MAX).forEach((l) => {
      try { items.push({ value: l, canvas: barcodeCanvas(l, { format, height }) }); } catch (e) { errors.push(e.message); }
    });
    return { items, errors };
  }, [lines, format, height]);

  const zip = async () => {
    setBusy(true);
    try {
      const files = [];
      for (const it of items) files.push({ name: `${safeName(it.value)}.png`, blob: await canvasToBlob(it.canvas) });
      await downloadZip(files, `barcodes-${format.toLowerCase()}.zip`);
    } finally { setBusy(false); }
  };

  return (
    <>
      <Field label="Barcode type">
        <select className="ft-input" value={format} onChange={(e) => setFormat(e.target.value)}>
          {BARCODE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <Field label={`One value per line (${lines.length}${lines.length > MAX ? `, first ${MAX} used` : ""})`}>
        <textarea className="ft-input mono" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"ITEM-0001\nITEM-0002"} />
      </Field>
      <Field label={`Height: ${height}px`}><input type="range" min="40" max="160" value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
      {errors.length > 0 && (
        <div className="ft-result bad" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <b>{errors.length} value(s) skipped:</b>
          {errors.slice(0, 5).map((e, i) => <span key={i} className="ft-hint">{e}</span>)}
          {errors.length > 5 && <span className="ft-hint">…and {errors.length - 5} more</span>}
        </div>
      )}
      {items.length > 0 && (
        <div className="code-grid">
          {items.slice(0, 60).map((it) => (
            <div className="code-cell" key={it.value}><img alt={it.value} src={it.canvas.toDataURL()} /></div>
          ))}
        </div>
      )}
      {items.length > 60 && <p className="ft-hint">Showing the first 60 of {items.length}. The ZIP contains all of them.</p>}
      <Btn onClick={zip} disabled={!items.length || busy}><i className="fas fa-file-archive" /> {busy ? "Creating ZIP…" : `Download ${items.length} barcodes (ZIP)`}</Btn>
    </>
  );
}
