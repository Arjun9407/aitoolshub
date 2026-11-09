import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { Btn, Field } from "../../components/ftui.jsx";
import { dataUrlToBlob, downloadZip, safeName } from "../../components/ftfiles.jsx";

const MAX = 300;

export default function BulkQrCodeGenerator() {
  const [text, setText] = useState("https://example.com/one\nhttps://example.com/two\nhttps://example.com/three");
  const [level, setLevel] = useState("M");
  const [size, setSize] = useState(512);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);

  const lines = useMemo(() => [...new Set(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))].slice(0, MAX), [text]);

  const make = (l, width) => QRCode.toDataURL(l, { errorCorrectionLevel: level, margin: 2, width });

  const preview = async () => {
    setPreviews(await Promise.all(lines.slice(0, 30).map(async (l) => ({ value: l, url: await make(l, 160) }))));
  };

  const zip = async () => {
    setBusy(true);
    try {
      const files = [];
      for (let i = 0; i < lines.length; i++) {
        files.push({ name: `${String(i + 1).padStart(3, "0")}-${safeName(lines[i]).slice(0, 40)}.png`, blob: await dataUrlToBlob(await make(lines[i], size)) });
      }
      await downloadZip(files, "qr-codes.zip");
    } catch (e) {
      alert("Could not create QR codes: " + e.message);
    } finally { setBusy(false); }
  };

  return (
    <>
      <Field label={`One link or text per line (${lines.length} QR codes)`}>
        <textarea className="ft-input mono" rows={6} value={text} onChange={(e) => { setText(e.target.value); setPreviews([]); }} />
      </Field>
      <div className="ft-row wrap">
        <Field label="Error correction">
          <select className="ft-input" value={level} onChange={(e) => { setLevel(e.target.value); setPreviews([]); }}>
            <option value="L">Low (smallest code)</option><option value="M">Medium (recommended)</option>
            <option value="Q">Quartile</option><option value="H">High (use with logos)</option>
          </select>
        </Field>
        <Field label="Image size">
          <select className="ft-input" value={size} onChange={(e) => setSize(+e.target.value)}>
            {[256, 512, 1024, 2048].map((s) => <option key={s} value={s}>{s} × {s}px</option>)}
          </select>
        </Field>
      </div>
      <div className="ft-row wrap">
        <Btn variant="ghost" onClick={preview} disabled={!lines.length}>Preview</Btn>
        <Btn onClick={zip} disabled={!lines.length || busy}><i className="fas fa-file-archive" /> {busy ? "Creating ZIP…" : `Download ${lines.length} QR codes (ZIP)`}</Btn>
      </div>
      {previews.length > 0 && (
        <div className="code-grid">
          {previews.map((p) => <div className="code-cell" key={p.value}><img alt={`QR code for ${p.value}`} src={p.url} /><div className="cap">{p.value}</div></div>)}
        </div>
      )}
    </>
  );
}
