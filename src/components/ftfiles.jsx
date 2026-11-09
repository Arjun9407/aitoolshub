import { useRef, useState } from "react";

// Helpers shared by the file-based free tools (images, PDFs, barcodes). Everything stays in the browser.

export const fmtBytes = (n) => {
  if (!Number.isFinite(n)) return "–";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

export const baseName = (name) => name.replace(/\.[^.]+$/, "");
export const safeName = (s) => String(s).replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "file";

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// files: [{ name, blob }]  – JSZip is loaded only when needed.
export async function downloadZip(files, zipName = "files.zip") {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set();
  files.forEach(({ name, blob }) => {
    let n = name;
    let i = 2;
    while (used.has(n)) n = name.replace(/(\.[^.]+)?$/, `-${i++}$1`);
    used.add(n);
    zip.file(n, blob);
  });
  download(await zip.generateAsync({ type: "blob" }), zipName);
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read "${file.name}" as an image`));
    };
    img.src = url;
  });
}

export const canvasToBlob = (canvas, type = "image/png", quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Your browser could not create this image format"))), type, quality)
  );

export const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();

// Drag-and-drop or click to choose files.
export function DropZone({ accept, multiple = true, onFiles, label = "Drop files here or click to choose", hint }) {
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const take = (list) => {
    const files = [...list];
    if (!files.length) return;
    const ok = accept
      ? files.filter((f) => accept.split(",").some((a) => {
          a = a.trim().toLowerCase();
          return a.endsWith("/*") ? f.type.startsWith(a.slice(0, -1)) : a.startsWith(".") ? f.name.toLowerCase().endsWith(a) : f.type === a;
        }))
      : files;
    onFiles(multiple ? ok : ok.slice(0, 1), files.length - ok.length);
  };
  return (
    <label
      className={`dropzone ${over ? "over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => { take(e.target.files); e.target.value = ""; }}
      />
      <i className="fas fa-cloud-upload-alt" />
      <span className="dz-label">{label}</span>
      {hint && <span className="ft-hint">{hint}</span>}
    </label>
  );
}

export const PrivacyNote = () => (
  <p className="ft-hint">
    <i className="fas fa-lock" /> Your files never leave your device. Everything is processed in your browser.
  </p>
);
