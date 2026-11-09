import { useMemo, useState } from "react";
import { Area, CopyBtn, Stat } from "../../components/ftui.jsx";

export default function RemoveDuplicateLines() {
  const [text, setText] = useState("");
  const [o, setO] = useState({ trim: true, ignoreCase: false, dropEmpty: true, sort: "none" });
  const set = (p) => setO((x) => ({ ...x, ...p }));

  const { out, total, removed } = useMemo(() => {
    let lines = text.split(/\r?\n/);
    if (text === "") lines = [];
    const total = lines.length;
    const seen = new Set();
    let res = [];
    for (const raw of lines) {
      const line = o.trim ? raw.trim() : raw;
      if (o.dropEmpty && line === "") continue;
      const key = o.ignoreCase ? line.toLowerCase() : line;
      if (seen.has(key)) continue;
      seen.add(key);
      res.push(line);
    }
    if (o.sort === "az") res.sort((a, b) => a.localeCompare(b));
    if (o.sort === "za") res.sort((a, b) => b.localeCompare(a));
    return { out: res.join("\n"), total, removed: total - res.length };
  }, [text, o]);

  return (
    <>
      <Area value={text} onChange={setText} placeholder="Paste your list here, one item per line..." rows={7} />
      <div className="ft-row wrap">
        <label className="ft-check"><input type="checkbox" checked={o.trim} onChange={(e) => set({ trim: e.target.checked })} /> Trim spaces</label>
        <label className="ft-check"><input type="checkbox" checked={o.ignoreCase} onChange={(e) => set({ ignoreCase: e.target.checked })} /> Ignore upper/lower case</label>
        <label className="ft-check"><input type="checkbox" checked={o.dropEmpty} onChange={(e) => set({ dropEmpty: e.target.checked })} /> Remove empty lines</label>
        <select className="ft-input" style={{ maxWidth: 190 }} value={o.sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort order">
          <option value="none">Keep original order</option><option value="az">Sort A to Z</option><option value="za">Sort Z to A</option>
        </select>
      </div>
      <div className="ft-stats three">
        <Stat value={total} label="Lines in" /><Stat value={total - removed} label="Lines out" /><Stat value={removed} label="Removed" />
      </div>
      <Area value={out} readOnly placeholder="Cleaned list appears here..." rows={7} />
      <CopyBtn text={out} />
    </>
  );
}
