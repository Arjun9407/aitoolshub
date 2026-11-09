# Adding tools to AIToolsHub

Everything you add lives in `src/content/`. Drop a file in, and the site picks it up: cards, search, filters,
categories, counters and the detail pop-up all update on their own. No other code needs editing.

```
src/content/
  ai-tools/        one .json file per AI tool
  free-tools/      one <name>.meta.json + <name>.jsx pair per free tool
```

Run `npm run validate` any time. It also runs automatically before `npm run build`, and the build stops if
something is wrong, so a typo can't reach your live site.

---

## Add an AI tool (2 minutes, no coding)

**Option A: the helper**

```bash
npm run new:tool
```

It asks for the name, category, website, description, pricing and so on, then creates the file.

**Option B: copy a file.** Duplicate any file in `src/content/ai-tools/`, rename it (e.g. `my-tool.json`) and edit:

```json
{
  "name": "My Tool",
  "category": "Writing",
  "desc": "One or two sentences on what it does and who it is for.",
  "icon": "✍️",
  "color": "#6366f1",
  "pricing": "freemium",
  "price": "Free / Pro plan",
  "rating": 4.5,
  "featured": false,
  "tags": ["Writing", "Editing"],
  "features": ["Grammar checks", "Tone suggestions", "Browser extension"],
  "url": "https://example.com"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `name` | yes | Must be unique. |
| `category` | yes | Use an existing one (Writing, Image, Coding...) or write a new one and it is created automatically. |
| `desc` | yes | Under about 160 characters keeps cards tidy. Write your own words, don't copy the vendor's. |
| `url` | yes | Full `https://` link. |
| `pricing` | yes | `free`, `freemium` or `paid`. |
| `rating` | yes | Your own editorial score, 0 to 5. |
| `price` | no | Free text, e.g. "From $10/mo". Check the vendor's site; prices change. |
| `icon`, `color` | no | Fallback emoji and its tint, used only if no logo can be found. |
| `logo` | no | Your own logo: `/logos/name.svg` (put the file in `public/logos/`) or an `https://` link. Best quality; use it for tools whose automatic logo looks blurry or wrong. |
| `domain` | no | Override the domain used to find the logo automatically, e.g. `"domain": "openai.com"`. |
| `tags`, `features` | no | Lists of short text. Features show in the pop-up. |
| `featured` | no | `true` puts it in the "Featured" section and the scrolling ticker. |
| `draft` | no | `true` hides it until you are ready. |

**Logos are automatic.** Each tool's logo is fetched from its website address (Google's favicon service, then
DuckDuckGo) and falls back to the emoji if none is found. Logos are loaded by each visitor's browser, so no files
need to be stored. For the sharpest result, or to avoid third-party requests, save the official logo in
`public/logos/` and set `"logo"`. Check the brand's usage guidelines before using their logo files.

The file name becomes the tool's id, so don't rename a file after publishing if people may have saved it.

---

## Add a free tool

```bash
npm run new:free-tool
```

This creates two files in `src/content/free-tools/`:

- `my-tool.meta.json` is the card info (name, description, category, icon, colour)
- `my-tool.jsx` is the tool itself, a small React component

Open the `.jsx` and build the tool. A starter is already there. Tips:

- Import ready-made pieces from `../../components/ftui.jsx`: `Area` (textarea), `Btn`, `CopyBtn`, `Stat`, `Field`, `words()`.
- Use the existing `ft-*` CSS classes (see `src/styles/extra.css`) so it matches the other tools and works on phones.
- `src/content/free-tools/random-number-generator.jsx` is a complete example.
- Keep it in the browser: no uploads, no tracking. That is the promise made on the page.
- Set `"draft": true` in the meta file while you are still building it.

---

### SEO fields for a free tool (important for Google)
Put these in the same `.meta.json` file (see SEO.md):
```json
"seoTitle": "Merge PDF Files Online: Free, No Upload",
"seoDescription": "120-160 characters about what it does, free, runs in your browser.",
"keywords": ["merge pdf", "combine pdf files"],
"intro": "2-3 sentences about the tool.",
"steps": ["Add your PDFs", "Drag to reorder", "Click Merge"],
"faq": [{"q": "Is it free?", "a": "Yes."}]
```
`npm run new:free-tool` creates these fields for you (as TODO text, hidden with `"draft": true` until you finish).
`npm run build` now also creates a real HTML page for every tool, category and article (prerender) plus `sitemap.xml`.

## Checklist before publishing

- [ ] `npm run validate` says "Content OK"
- [ ] Looked at it on a phone-width screen (browser dev tools, 375px)
- [ ] Description is in your own words
- [ ] Link works and the pricing matches the vendor's current page
- [ ] `npm run build` succeeds

## Bulk adding

Create many JSON files at once with a script, or ask an assistant to generate them in the format above, then
run `npm run validate`. The validator reports every problem with the file name.

## Removing or hiding

Delete the file, or add `"draft": true`. For free tools, delete both the `.meta.json` and the `.jsx`.
