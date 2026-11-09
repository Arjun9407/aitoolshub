import { useState } from "react";
import { CopyBtn } from "../../components/ftui.jsx";
import { DropZone, PrivacyNote, fmtBytes } from "../../components/ftfiles.jsx";

const read = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Could not read file")); r.readAsDataURL(file); });

export default function ImageToBase64() {
  const [items, setItems] = useState([]);
  const add = async (files) => {
    const out = [];
    for (const f of files.slice(0, 20)) out.push({ name: f.name, size: f.size, uri: await read(f) });
    setItems(out);
  };
  return (
    <>
      <DropZone accept="image/*" onFiles={add} label="Drop an image here or click to choose" hint="PNG, JPG, WebP, GIF, SVG · up to 20 images" />
      {items.map((it) => (
        <div className="ft-card" key={it.name + it.size}>
          <div className="file-row" style={{ padding: 0, background: "none" }}>
            <img className="thumb" src={it.uri} alt="" />
            <span className="fname">{it.name}</span>
            <span className="fmeta">{fmtBytes(it.size)} → {fmtBytes(it.uri.length)} as text</span>
          </div>
          <textarea className="ft-input mono" rows={3} readOnly value={it.uri} />
          <div className="ft-row wrap">
            <CopyBtn text={it.uri} label="Copy data URI" />
            <CopyBtn text={`<img src="${it.uri}" alt="">`} label="Copy HTML <img>" />
            <CopyBtn text={`background-image: url("${it.uri}");`} label="Copy CSS" />
            <CopyBtn text={it.uri.split(",")[1] || ""} label="Copy Base64 only" />
          </div>
        </div>
      ))}
      <p className="ft-hint">Base64 makes files about 33% larger, so it suits small icons and logos best.</p>
      <PrivacyNote />
    </>
  );
}
