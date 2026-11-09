import { useEffect, useRef, useState } from "react";
import { Btn, Field } from "../../components/ftui.jsx";
import { BARCODE_FORMATS, barcodeSvgString, drawBarcode } from "../../components/barcodeUtil.js";
import { download } from "../../components/ftfiles.jsx";

export default function BarcodeGenerator() {
  const [format, setFormat] = useState("CODE128");
  const [text, setText] = useState("HELLO-12345");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(90);
  const [showText, setShowText] = useState(true);
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [error, setError] = useState("");
  const canvas = useRef(null);

  const opts = { format, width, height, displayValue: showText, lineColor: fg, background: bg };

  useEffect(() => {
    if (!canvas.current) return;
    try {
      drawBarcode(canvas.current, text, opts);
      setError("");
    } catch (e) {
      const c = canvas.current;
      c.getContext("2d").clearRect(0, 0, c.width, c.height);
      c.width = 1; c.height = 1;
      setError(e.message);
    }
  }, [format, text, width, height, showText, fg, bg]); // eslint-disable-line

  const pickFormat = (f) => {
    setFormat(f);
    setText(BARCODE_FORMATS.find((x) => x.value === f).sample);
  };
  const png = () => canvas.current.toBlob((b) => download(b, `barcode-${format.toLowerCase()}.png`));
  const svg = () => download(new Blob([barcodeSvgString(text, opts)], { type: "image/svg+xml" }), `barcode-${format.toLowerCase()}.svg`);

  return (
    <>
      <Field label="Barcode type">
        <select className="ft-input" value={format} onChange={(e) => pickFormat(e.target.value)}>
          {BARCODE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      <Field label="Barcode value">
        <input className="ft-input mono" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="ft-row wrap">
        <Field label={`Bar width: ${width}`}><input type="range" min="1" max="5" value={width} onChange={(e) => setWidth(+e.target.value)} /></Field>
        <Field label={`Height: ${height}px`}><input type="range" min="30" max="200" value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
      </div>
      <div className="ft-row wrap">
        <Field label="Bar colour"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} /></Field>
        <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></Field>
        <label className="ft-check"><input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)} /> Show number below</label>
      </div>
      {error && <div className="ft-result bad">{error}</div>}
      <div className="preview-box" style={{ display: error ? "none" : "flex" }}><canvas ref={canvas} /></div>
      <div className="ft-row wrap">
        <Btn onClick={png} disabled={!!error}><i className="fas fa-download" /> Download PNG</Btn>
        <Btn variant="ghost" onClick={svg} disabled={!!error}><i className="fas fa-download" /> Download SVG</Btn>
      </div>
      <p className="ft-hint">Tip: for EAN-13, UPC-A and EAN-8 the last digit (check digit) is added for you. Dark bars on a light background scan best.</p>
    </>
  );
}
