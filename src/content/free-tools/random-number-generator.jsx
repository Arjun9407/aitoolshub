import { useState } from "react";
import { Btn, CopyBtn, Field } from "../../components/ftui.jsx";

// Uses the browser's secure random source, so results are unbiased.
function randomInt(min, max) {
  const range = max - min + 1;
  const limit = Math.floor(4294967296 / range) * range;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return min + (buf[0] % range);
}

export default function RandomNumberGenerator() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(5);
  const [unique, setUnique] = useState(true);
  const [result, setResult] = useState([]);
  const [error, setError] = useState("");

  const run = () => {
    const lo = Math.floor(Number(min));
    const hi = Math.floor(Number(max));
    const n = Math.floor(Number(count));
    if (![lo, hi, n].every(Number.isFinite)) return setError("Enter valid numbers.");
    if (lo > hi) return setError("Minimum must not be greater than maximum.");
    if (n < 1 || n > 1000) return setError("Choose between 1 and 1000 numbers.");
    if (unique && n > hi - lo + 1) return setError(`Only ${hi - lo + 1} unique numbers exist in that range.`);
    const out = [];
    const seen = new Set();
    while (out.length < n) {
      const v = randomInt(lo, hi);
      if (unique && seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    setError("");
    setResult(out);
  };

  const text = result.join(", ");
  return (
    <>
      <div className="ft-row wrap">
        <Field label="Minimum"><input className="ft-input" type="number" value={min} onChange={(e) => setMin(e.target.value)} /></Field>
        <Field label="Maximum"><input className="ft-input" type="number" value={max} onChange={(e) => setMax(e.target.value)} /></Field>
        <Field label="How many"><input className="ft-input" type="number" value={count} onChange={(e) => setCount(e.target.value)} /></Field>
      </div>
      <label className="ft-check">
        <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} /> No repeats
      </label>
      <div className="ft-row">
        <Btn onClick={run}><i className="fas fa-dice" /> Generate</Btn>
        <CopyBtn text={text} />
      </div>
      {error && <div className="ft-result bad">{error}</div>}
      {result.length > 0 && <div className="ft-result mono big" style={{ wordBreak: "break-word" }}>{text}</div>}
    </>
  );
}
