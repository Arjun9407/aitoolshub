import JsBarcode from "jsbarcode";

export const BARCODE_FORMATS = [
  { value: "CODE128", label: "Code 128 (any text, most common)", sample: "HELLO-12345" },
  { value: "EAN13", label: "EAN-13 (retail products, 12 or 13 digits)", sample: "590123412345" },
  { value: "UPC", label: "UPC-A (US retail, 11 or 12 digits)", sample: "12345678901" },
  { value: "EAN8", label: "EAN-8 (small products, 7 or 8 digits)", sample: "1234567" },
  { value: "CODE39", label: "Code 39 (letters, numbers, - . space $ / + %)", sample: "CODE39" },
  { value: "ITF14", label: "ITF-14 (cartons, 13 or 14 digits)", sample: "1234567890123" },
  { value: "ITF", label: "ITF (Interleaved 2 of 5, even number of digits)", sample: "123456" },
  { value: "MSI", label: "MSI (digits)", sample: "1234567" },
  { value: "pharmacode", label: "Pharmacode (number 3 to 131070)", sample: "1234" },
  { value: "codabar", label: "Codabar (digits, library use)", sample: "A12345B" },
];

// Draw a barcode onto a canvas (or an <svg>). Throws a readable error if the text isn't valid for the format.
export function drawBarcode(target, text, o = {}) {
  let ok = true;
  try {
    JsBarcode(target, text, {
      format: o.format || "CODE128",
      width: o.width ?? 2,
      height: o.height ?? 90,
      displayValue: o.displayValue ?? true,
      margin: o.margin ?? 10,
      lineColor: o.lineColor || "#000000",
      background: o.background || "#ffffff",
      fontSize: o.fontSize ?? 18,
      valid: (v) => { ok = v; },
    });
  } catch {
    ok = false;
  }
  if (!ok) {
    const f = BARCODE_FORMATS.find((x) => x.value === (o.format || "CODE128"));
    throw new Error(`"${text}" is not valid for ${f ? f.label.split(" (")[0] : o.format}`);
  }
  return target;
}

export function barcodeCanvas(text, o) {
  const c = document.createElement("canvas");
  return drawBarcode(c, text, o);
}

export function barcodeSvgString(text, o) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  drawBarcode(svg, text, o);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(svg);
}

// GS1 check digit: payload without its last digit -> check digit
export function gs1CheckDigit(payload) {
  const d = payload.split("").map(Number).reverse();
  const sum = d.reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}
