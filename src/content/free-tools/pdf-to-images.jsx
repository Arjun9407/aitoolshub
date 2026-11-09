import { useState } from "react";
import { Btn, Field } from "../../components/ftui.jsx";
import { DropZone, PrivacyNote, baseName, canvasToBlob, download, downloadZip, fmtBytes } from "../../components/ftfiles.jsx";

// pdf.js runs in a background worker; both files load only when this tool is opened.
async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const { default: worker } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  return pdfjs;
}

export default function PdfToImages() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("jpeg");
  const [scale, setScale] = useState(2);
  const [pages, setPages] = useState([]); // [{ n, blob, url }]
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const load = ([f]) => { setFile(f || null); setPages([]); setError(""); };

  const run = async () => {
    setBusy(true); setError(""); setPages([]);
    try {
      const pdfjs = await loadPdfjs();
      const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      const out = [];
      for (let n = 1; n <= doc.numPages; n++) {
        setProgress(`Page ${n} of ${doc.numPages}`);
        const page = await doc.getPage(n);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob = await canvasToBlob(canvas, mime, 0.92);
        out.push({ n, blob, url: URL.createObjectURL(blob) });
        page.cleanup();
      }
      setPages(out);
    } catch (e) {
      setError(/password/i.test(e.message) ? "This PDF is password-protected. Remove the password first." : `Could not read this PDF (${e.message}).`);
    } finally { setBusy(false); setProgress(""); }
  };

  const ext = format === "jpeg" ? "jpg" : "png";
  const name = (p) => `${baseName(file.name)}-page-${String(p.n).padStart(2, "0")}.${ext}`;

  return (
    <>
      <DropZone accept="application/pdf,.pdf" multiple={false} onFiles={load} label="Drop a PDF here or click to choose" />
      {file && <div className="ft-result"><i className="fas fa-file-pdf" style={{ color: "#ef4444", marginRight: 8 }} /> {file.name} · {fmtBytes(file.size)}</div>}
      <div className="ft-row wrap">
        <Field label="Image format">
          <select className="ft-input" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="jpeg">JPG (smaller files)</option><option value="png">PNG (sharper text)</option>
          </select>
        </Field>
        <Field label="Quality">
          <select className="ft-input" value={scale} onChange={(e) => setScale(+e.target.value)}>
            <option value={1}>Standard (72 DPI)</option><option value={2}>High (144 DPI)</option><option value={3}>Very high (216 DPI)</option>
          </select>
        </Field>
      </div>
      {error && <div className="ft-result bad">{error}</div>}
      <div className="ft-row wrap">
        <Btn onClick={run} disabled={!file || busy}><i className="fas fa-images" /> {busy ? progress || "Working…" : "Convert to images"}</Btn>
        {pages.length > 1 && <Btn variant="green" onClick={() => downloadZip(pages.map((p) => ({ name: name(p), blob: p.blob })), `${baseName(file.name)}-images.zip`)}><i className="fas fa-file-archive" /> Download all (ZIP)</Btn>}
      </div>
      {pages.length > 0 && (
        <div className="code-grid">
          {pages.map((p) => (
            <div className="code-cell" key={p.n}>
              <img alt={`Page ${p.n}`} src={p.url} />
              <div className="cap">Page {p.n} · {fmtBytes(p.blob.size)}</div>
              <button className="ft-btn ghost" style={{ marginTop: 6, padding: "4px 10px" }} onClick={() => download(p.blob, name(p))}>Download</button>
            </div>
          ))}
        </div>
      )}
      <PrivacyNote />
    </>
  );
}
