# AIToolsHub (React)

Vite + React version of the AIToolsHub directory.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

- `src/content/` – add AI tools and free tools here, see **CONTENT.md** (`npm run new:tool`, `npm run new:free-tool`, `npm run validate`)
- `src/data/baseData.js` – the original data
- `src/components/freeToolWidgets.jsx` – the original 32 free tools
- `src/styles/extra.css` – light theme and styles for the new UI

## Free tools & SEO
- 15 new client-side tools: barcode (single, bulk, check digit), bulk QR, image compress/resize/convert/Base64, PDF merge/split/rotate/images-to-PDF/PDF-to-images.
- Each tool has its own URL and a prerendered page. **Set your domain in `site.config.json` before `npm run build`.** See `SEO.md`.
- Run `npm install` after updating (new packages: pdf-lib, pdfjs-dist, jsbarcode, jszip).
