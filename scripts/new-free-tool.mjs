// Scaffold a new free tool:  npm run new:free-tool
// Creates src/content/free-tools/<slug>.meta.json (card info) and <slug>.jsx (the tool itself).
import fs from "node:fs";
import path from "node:path";
import { COLORS, FREE_DIR, ask, makeRl, parseFlags, slugify } from "./lib.mjs";

const flags = parseFlags(process.argv.slice(2));
const rl = makeRl();

const name = await ask(rl, flags, "name", "Tool name (e.g. Random Number Generator)");
const slug = slugify(name);
const metaFile = path.join(FREE_DIR, `${slug}.meta.json`);
const compFile = path.join(FREE_DIR, `${slug}.jsx`);
if (fs.existsSync(metaFile) || fs.existsSync(compFile)) { console.error(`\n${slug} already exists.`); rl?.close(); process.exit(1); }

const category = await ask(rl, flags, "category", "Category (Text, SEO, Developer, Image, Math, Security, Productivity...)");
const desc = await ask(rl, flags, "desc", "Short description (under 100 characters)");
const icon = await ask(rl, flags, "icon", "Emoji icon", { def: "🧰" });
const color = flags.color || COLORS[Math.floor(Math.random() * COLORS.length)];
rl?.close();

const component = slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");

fs.mkdirSync(FREE_DIR, { recursive: true });
fs.writeFileSync(metaFile, JSON.stringify({
    name, desc, category, icon, color, badge: "FREE",
    seoTitle: `${name} Online: Free & Instant`.slice(0, 48),
    seoDescription: `TODO: 120-160 characters. Say what ${name} does, that it is free, and that it runs in the browser with no signup.`,
    keywords: [`${name.toLowerCase()}`, `free ${name.toLowerCase()}`, `${name.toLowerCase()} online`],
    intro: "TODO: 2-3 sentences explaining what this tool does and who it helps.",
    steps: ["TODO: first step", "TODO: second step", "TODO: third step"],
    faq: [{ q: "TODO: common question?", a: "TODO: clear answer." }, { q: "Is it free and private?", a: "Yes. It runs in your browser and nothing you enter is uploaded." }],
    draft: true,
  }, null, 2) + "\n");
fs.writeFileSync(
  compFile,
  `import { useState } from "react";
// Shared building blocks: Area (textarea), Btn, CopyBtn, Stat, Field, words(). Styles are in styles/extra.css (.ft-*).
import { Area, Btn, CopyBtn } from "../../components/ftui.jsx";

// The tool UI. It appears inside the pop-up when someone opens "${name}".
// Everything runs in the browser, so nothing the visitor types is uploaded.
export default function ${component}() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  // TODO: replace this with what the tool actually does.
  const run = () => setOutput(input.toUpperCase());

  return (
    <>
      <Area value={input} onChange={setInput} placeholder="Enter your input..." rows={5} />
      <div className="ft-row">
        <Btn onClick={run}>Run</Btn>
      </div>
      <Area value={output} readOnly placeholder="Result..." rows={5} />
      <CopyBtn text={output} />
    </>
  );
}
`
);
console.log(`\nCreated:\n  src/content/free-tools/${slug}.meta.json  (card info)\n  src/content/free-tools/${slug}.jsx        (the tool)`);
console.log("Edit the .jsx to build the tool, then run `npm run dev`. It starts as \"draft\": true (hidden). Fill in the TODO SEO fields, then remove the draft line to publish.");
