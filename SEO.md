# SEO guide (Google ranking) - simple version

## What the site already does for you
- Every tool, category and article has its **own web address** (example: `/free-tools/pdf-merge/`).
- `npm run build` creates a real HTML page for each one (216 pages) with title, description, FAQ, and structured data. Google can read them without running JavaScript.
- `sitemap.xml` and `robots.txt` are made automatically.
- Every page links to related pages (good for Google).

## Before you go live (REQUIRED)
1. Open `site.config.json` and put your real domain: `"url": "https://yourdomain.com"`
   (or set the environment variable `SITE_URL`). Without it the sitemap and canonical links are wrong.
2. Run `npm run build`. Upload the `dist` folder (Netlify, Vercel, Cloudflare Pages, any host).
3. Host setting: unknown addresses should show `404.html` (or `index.html`). Netlify/Cloudflare Pages do this automatically.
4. Use HTTPS.

## After you go live
1. Make a free **Google Search Console** account, add your site, and submit `https://yourdomain.com/sitemap.xml`.
2. Use "URL inspection" on 3-4 tool pages and click "Request indexing".
3. Wait. New sites usually need weeks to months before they rank. **Nobody can promise page 1.**

## Keywords for each tool (already used in titles)
| Tool | Main keyword people search |
|---|---|
| Barcode Generator | barcode generator, free barcode generator |
| Bulk Barcode Generator | bulk barcode generator, generate multiple barcodes |
| Barcode Check Digit | barcode check digit calculator, ean13 check digit |
| Bulk QR Code Generator | bulk qr code generator |
| Image Compressor | compress image online, reduce jpg size |
| Image Resizer | bulk image resizer, resize images online |
| Image Converter | jpg to png, png to webp converter |
| Image to Base64 | image to base64 |
| Merge PDF | merge pdf, combine pdf files |
| Split PDF | split pdf, extract pages from pdf |
| Rotate PDF | rotate pdf online |
| Images to PDF | jpg to pdf, images to pdf |
| PDF to JPG/PNG | pdf to jpg, pdf to png |
| Random Number Generator | random number generator |
| Remove Duplicate Lines | remove duplicate lines |

## What to write for every new tool (in its `.meta.json`)
- `seoTitle`: under 48 characters, main keyword first.
- `seoDescription`: 120-160 characters. Say what it does + free + no signup/private.
- `keywords`: 3-5 phrases people really type.
- `intro`, `steps`, `faq`: real, useful text. Pages with only a few words rank badly ("thin content").
`npm run validate` warns you when these are missing or the wrong length.

## What really helps ranking (honest)
- **Tools that work well and fast.** People who stay and use the tool = good signal.
- **Unique text** on each page (not copied from other sites).
- **Articles** about what people search ("how to merge PDF without software").
- **Backlinks**: other websites linking to you (share on Reddit, Product Hunt, directories, communities).
- **Speed and mobile**: already good; keep images small.
- No tricks, no keyword stuffing, no fake reviews. Google can penalize these.
