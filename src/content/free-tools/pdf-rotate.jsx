import { useState } from "react";
import { Btn, Field } from "../../components/ftui.jsx";
import { DropZone, PrivacyNote, baseName, download, fmtBytes } from "../../components/ftfiles.jsx";
import { parseRanges, pdfBlob, readPdf } from "../../components/pdfUtil.js";

export default function PdfRotate() {
  const [src, setSrc] = useState(null);
  const [angle, setAngle] = useState(90);
  const [which, setWhich] = useState("all");
  const [ranges, setRanges] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async ([file]) => {
    if (!file) return;
    setError("");
    try { const { doc } = await readPdf(file); setSrc({ file, doc, pages: doc.getPageCount() }); }
    catch (e) { setSrc(null); setError(e.message); }
  };

  const run = async () => {
    setBusy(true); setError("");
    try {
      const { degrees } = await import("pdf-lib");
      const targets = which === "all" ? src.doc.getPageIndices() : parseRanges(ranges, src.pages);
      targets.forEach((i) => {
        const page = src.doc.getPage(i);
        page.setRotation(degrees((page.getRotation().angle + angle + 360) % 360));
      });
      download(pdfBlob(await src.doc.save()), `${baseName(src.file.name)}-rotated.pdf`);
      // reload so a second rotation starts from the original again
      const { doc } = await readPdf(src.file);
      setSrc({ ...src, doc });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <DropZone accept="application/pdf,.pdf" multiple={false} onFiles={load} label="Drop a PDF here or click to choose" />
      {error && <div className="ft-result bad">{error}</div>}
      {src && (
        <>
          <div className="ft-result"><i className="fas fa-file-pdf" style={{ color: "#ef4444", marginRight: 8 }} /> {src.file.name} · {src.pages} pages · {fmtBytes(src.file.size)}</div>
          <div className="ft-row wrap">
            <Field label="Rotate">
              <select className="ft-input" value={angle} onChange={(e) => setAngle(+e.target.value)}>
                <option value={90}>90° clockwise</option><option value={180}>180°</option><option value={270}>90° counter-clockwise</option>
              </select>
            </Field>
            <Field label="Pages">
              <select className="ft-input" value={which} onChange={(e) => setWhich(e.target.value)}>
                <option value="all">All pages</option><option value="some">Selected pages</option>
              </select>
            </Field>
          </div>
          {which === "some" && (
            <Field label={`Pages (for example 1, 3-5). This PDF has ${src.pages}.`}>
              <input className="ft-input mono" value={ranges} onChange={(e) => setRanges(e.target.value)} />
            </Field>
          )}
          <Btn onClick={run} disabled={busy}><i className="fas fa-redo" /> {busy ? "Working…" : "Rotate and download"}</Btn>
        </>
      )}
      <PrivacyNote />
    </>
  );
}
