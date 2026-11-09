import { useState } from "react";
import { Btn, Field } from "../../components/ftui.jsx";
import { DropZone, PrivacyNote, baseName, download, downloadZip, fmtBytes } from "../../components/ftfiles.jsx";
import { parseRanges, pdfBlob, readPdf } from "../../components/pdfUtil.js";

export default function PdfSplit() {
  const [src, setSrc] = useState(null); // { file, doc, pages }
  const [mode, setMode] = useState("extract");
  const [ranges, setRanges] = useState("1-2");
  const [chunk, setChunk] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async ([file]) => {
    if (!file) return;
    setError("");
    try {
      const { doc } = await readPdf(file);
      setSrc({ file, doc, pages: doc.getPageCount() });
      setRanges(`1-${Math.min(2, doc.getPageCount())}`);
    } catch (e) { setSrc(null); setError(e.message); }
  };

  const build = async (indices) => {
    const { PDFDocument } = await import("pdf-lib");
    const out = await PDFDocument.create();
    (await out.copyPages(src.doc, indices)).forEach((p) => out.addPage(p));
    return pdfBlob(await out.save());
  };

  const run = async () => {
    setBusy(true); setError("");
    try {
      const name = baseName(src.file.name);
      if (mode === "extract") {
        download(await build(parseRanges(ranges, src.pages)), `${name}-pages.pdf`);
      } else if (mode === "remove") {
        const drop = new Set(parseRanges(ranges, src.pages));
        const keep = src.doc.getPageIndices().filter((i) => !drop.has(i));
        if (!keep.length) throw new Error("You can't remove every page.");
        download(await build(keep), `${name}-trimmed.pdf`);
      } else {
        const size = Math.max(1, Math.floor(chunk));
        const files = [];
        for (let start = 0; start < src.pages; start += size) {
          const idx = Array.from({ length: Math.min(size, src.pages - start) }, (_, k) => start + k);
          files.push({ name: `${name}-${size === 1 ? `page-${start + 1}` : `pages-${start + 1}-${start + idx.length}`}.pdf`, blob: await build(idx) });
        }
        await downloadZip(files, `${name}-split.zip`);
      }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <DropZone accept="application/pdf,.pdf" multiple={false} onFiles={load} label="Drop a PDF here or click to choose" />
      {error && <div className="ft-result bad">{error}</div>}
      {src && (
        <>
          <div className="ft-result"><i className="fas fa-file-pdf" style={{ color: "#ef4444", marginRight: 8 }} /> {src.file.name} · {src.pages} pages · {fmtBytes(src.file.size)}</div>
          <Field label="What do you want to do?">
            <select className="ft-input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="extract">Extract selected pages into one new PDF</option>
              <option value="remove">Remove selected pages</option>
              <option value="every">Split into separate files (ZIP)</option>
            </select>
          </Field>
          {mode !== "every" ? (
            <Field label={`Pages (for example 1-3, 5, 8-10). This PDF has ${src.pages}.`}>
              <input className="ft-input mono" value={ranges} onChange={(e) => setRanges(e.target.value)} />
            </Field>
          ) : (
            <Field label="Pages per file (1 = every page on its own)">
              <input className="ft-input" type="number" min="1" max={src.pages} value={chunk} onChange={(e) => setChunk(+e.target.value || 1)} />
            </Field>
          )}
          <Btn onClick={run} disabled={busy}><i className="fas fa-cut" /> {busy ? "Working…" : mode === "every" ? "Split PDF" : mode === "remove" ? "Remove pages" : "Extract pages"}</Btn>
        </>
      )}
      <PrivacyNote />
    </>
  );
}
