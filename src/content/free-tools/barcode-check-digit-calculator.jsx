import { useState } from "react";
import { CopyBtn, Field } from "../../components/ftui.jsx";
import { gs1CheckDigit } from "../../components/barcodeUtil.js";

const TYPES = [
  { label: "EAN-13 (12 digits + check)", len: 12 },
  { label: "UPC-A (11 digits + check)", len: 11 },
  { label: "EAN-8 (7 digits + check)", len: 7 },
  { label: "GTIN-14 (13 digits + check)", len: 13 },
];

export default function BarcodeCheckDigitCalculator() {
  const [type, setType] = useState(0);
  const [digits, setDigits] = useState("590123412345");
  const need = TYPES[type].len;
  const clean = digits.replace(/\s/g, "");
  const valid = /^\d+$/.test(clean) && clean.length === need;
  const full = valid ? clean + gs1CheckDigit(clean) : "";

  // Verify mode: user pasted the full number
  const fullLen = need + 1;
  const verify = /^\d+$/.test(clean) && clean.length === fullLen
    ? { ok: gs1CheckDigit(clean.slice(0, -1)) === Number(clean.slice(-1)), expected: gs1CheckDigit(clean.slice(0, -1)) }
    : null;

  return (
    <>
      <Field label="Barcode type">
        <select className="ft-input" value={type} onChange={(e) => setType(+e.target.value)}>
          {TYPES.map((t, i) => <option key={t.label} value={i}>{t.label}</option>)}
        </select>
      </Field>
      <Field label={`Enter the first ${need} digits (or all ${fullLen} to verify)`}>
        <input className="ft-input mono" inputMode="numeric" value={digits} onChange={(e) => setDigits(e.target.value)} />
      </Field>
      {valid && <div className="ft-result good big mono">{full}</div>}
      {valid && <CopyBtn text={full} label="Copy full number" />}
      {verify && <div className={`ft-result ${verify.ok ? "good" : "bad"}`}>{verify.ok ? "✅ Valid: the check digit is correct." : `❌ Invalid check digit. The last digit should be ${verify.expected}.`}</div>}
      {!valid && !verify && clean && <div className="ft-result bad">Enter exactly {need} digits (numbers only) to calculate, or {fullLen} to verify.</div>}
    </>
  );
}
