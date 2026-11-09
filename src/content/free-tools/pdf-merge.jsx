import { useState } from "react";
import { Btn } from "../../components/ftui.jsx";
import { DropZone, PrivacyNote, baseName, download, fmtBytes } from "../../components/ftfiles.jsx";
import { pdfBlob, readPdf } from "../../components/pdfUtil.js";

let uid = 0;

export default function PdfMerge() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async (list, rejected) => {
    setError(rejected ? `${rejected} file(s) skipped (not PDFs).` : "");
    const next = [];
    for (const file of list) {
      try {
        const { doc } = await readPdf(file);
        next.push({ id: ++uid, file, pages: doc.getPageCount() });
      } catch (e) { setError(e.message); }
    }
    setFiles((o) => [...o, ...next]);
  };
  const move = (i, d) => setFiles((o) => { const a = [...o]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });
  const remove = (id) => setFiles((o) => o.filter((f) => f.id !== id));

  const merge = async () => {
    setBusy(true); setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const f of files) {
        const { doc } = await readPdf(f.file);
        const pages = await out.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      download(pdfBlob(await out.save()), `${files.length ? baseName(files[0].file.name) : "merged"}-merged.pdf`);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const total = files.reduce((a, f) => a + f.pages, 0);
  return (
    <>
      <DropZone accept="application/pdf,.pdf" onFiles={add} label="Drop PDF files here or click to choose" hint="Add two or more PDFs, then drag them into order with the arrows" />
      {error && <div className="ft-result bad">{error}</div>}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div className="file-row" key={f.id}>
              <i className="fas fa-file-pdf" style={{ color: "#ef4444", fontSize: "1.3rem" }} />
              <span className="fname" title={f.file.name}>{i + 1}. {f.file.name}</span>
              <span className="fmeta">{f.pages} page{f.pages === 1 ? "" : "s"} · {fmtBytes(f.file.size)}</span>
              <button className="mini-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><i className="fas fa-arrow-up" /></button>
              <button className="mini-btn" aria-label="Move down" disabled={i === files.length - 1} onClick={() => move(i, 1)}><i className="fas fa-arrow-down" /></button>
              <button className="mini-btn" aria-label={`Remove ${f.file.name}`} onClick={() => remove(f.id)}><i className="fas fa-times" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="ft-row wrap">
        <Btn onClick={merge} disabled={files.length < 2 || busy}><i className="fas fa-object-group" /> {busy ? "Merging…" : `Merge ${files.length || ""} PDFs${total ? ` (${total} pages)` : ""}`}</Btn>
        {files.length > 0 && <Btn variant="ghost" onClick={() => setFiles([])}>Clear</Btn>}
      </div>
      <PrivacyNote />
    </>
  );
}
