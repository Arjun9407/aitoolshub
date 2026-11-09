import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const AI_DIR = path.join(ROOT, "src/content/ai-tools");
export const FREE_DIR = path.join(ROOT, "src/content/free-tools");

export const PRICING = ["free", "freemium", "paid"];
export const PRICE_LABEL = { free: "Free", freemium: "Free / Paid", paid: "Paid" };
export const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#0ea5e9", "#84cc16", "#f97316"];

export const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Parse `--key value` flags. Anything not provided is asked interactively.
export function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) out[key] = true;
      else { out[key] = next; i++; }
    }
  }
  return out;
}

export async function ask(rl, flags, key, question, { def, choices, required = true } = {}) {
  if (flags[key] !== undefined && flags[key] !== true) return String(flags[key]);
  if (!process.stdin.isTTY && !rl) {
    if (def !== undefined) return def;
    if (required) { console.error(`Missing --${key}`); process.exit(1); }
    return "";
  }
  const hint = choices ? ` (${choices.join("/")})` : "";
  const dflt = def !== undefined && def !== "" ? ` [${def}]` : "";
  for (;;) {
    const a = (await rl.question(`${question}${hint}${dflt}: `)).trim() || (def ?? "");
    if (required && !a) { console.log("  required"); continue; }
    if (choices && a && !choices.includes(a)) { console.log(`  choose one of: ${choices.join(", ")}`); continue; }
    return a;
  }
}

export function makeRl() {
  return process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
}

export function readJsonDir(dir, suffix = ".json") {
  return fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(suffix)).map((f) => ({ file: f, path: path.join(dir, f) }))
    : [];
}
