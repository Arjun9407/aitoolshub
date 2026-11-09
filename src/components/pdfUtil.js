// "1-3, 5, 8-10" -> [0,1,2,4,7,8,9]  (0-based, in the order typed, duplicates removed)
export function parseRanges(text, max) {
  const out = [];
  const seen = new Set();
  for (const part of text.split(",").map((p) => p.trim()).filter(Boolean)) {
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!m) throw new Error(`"${part}" is not a valid page or range`);
    let a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b < 1 || a > max || b > max) throw new Error(`Pages must be between 1 and ${max}`);
    const step = a <= b ? 1 : -1;
    for (let p = a; step > 0 ? p <= b : p >= b; p += step) if (!seen.has(p)) { seen.add(p); out.push(p - 1); }
  }
  if (!out.length) throw new Error("Enter at least one page");
  return out;
}

export async function readPdf(file) {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return { doc: await PDFDocument.load(bytes), bytes };
  } catch (e) {
    if (/encrypt/i.test(e.message)) throw new Error(`"${file.name}" is password-protected. Remove the password first, then try again.`);
    throw new Error(`"${file.name}" could not be opened. It may be damaged or not a real PDF.`);
  }
}

export const pdfBlob = (bytes) => new Blob([bytes], { type: "application/pdf" });
