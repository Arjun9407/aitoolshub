// Create a new AI tool entry:  npm run new:tool
// Interactive, or pass flags:  npm run new:tool -- --name "Foo" --category Coding --url https://foo.com --desc "..." --pricing freemium --rating 4.5
import fs from "node:fs";
import path from "node:path";
import { AI_DIR, COLORS, PRICE_LABEL, PRICING, ask, makeRl, parseFlags, slugify } from "./lib.mjs";

const flags = parseFlags(process.argv.slice(2));
const rl = makeRl();

const name = await ask(rl, flags, "name", "Tool name");
const slug = slugify(name);
const file = path.join(AI_DIR, `${slug}.json`);
if (fs.existsSync(file)) { console.error(`\n${slug}.json already exists.`); rl?.close(); process.exit(1); }

const category = await ask(rl, flags, "category", "Category (e.g. Writing, Image, Coding)");
const url = await ask(rl, flags, "url", "Website (https://...)");
const desc = await ask(rl, flags, "desc", "One or two sentence description");
const pricing = await ask(rl, flags, "pricing", "Pricing", { def: "freemium", choices: PRICING });
const price = await ask(rl, flags, "price", "Price text shown to users", { def: PRICE_LABEL[pricing] });
const rating = Number(await ask(rl, flags, "rating", "Your rating 0-5", { def: "4.3" }));
const icon = await ask(rl, flags, "icon", "Emoji icon", { def: "🛠️" });
const tags = (await ask(rl, flags, "tags", "Tags, comma separated", { required: false })).split(",").map((s) => s.trim()).filter(Boolean);
const features = (await ask(rl, flags, "features", "Key features, comma separated", { required: false })).split(",").map((s) => s.trim()).filter(Boolean);
const featured = String(await ask(rl, flags, "featured", "Feature on the home page?", { def: "n", choices: ["y", "n"] })).toLowerCase().startsWith("y");
const color = flags.color || COLORS[Math.floor(Math.random() * COLORS.length)];
rl?.close();

const tool = { name, category, desc, icon, color, pricing, price, rating, featured, tags, features, url };
fs.mkdirSync(AI_DIR, { recursive: true });
fs.writeFileSync(file, JSON.stringify(tool, null, 2) + "\n");
console.log(`\nCreated src/content/ai-tools/${slug}.json`);
console.log("Run `npm run validate` to check it, then `npm run dev` to see it.");
