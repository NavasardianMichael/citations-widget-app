/**
 * Strip trailing Armenian full stop (։) and/or closing guillemet (»)
 * from citation `text` fields in seed JSON files.
 *
 * Usage (from server/):
 *   node scripts/strip-trailing-citation-punct.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(__dirname, "../data/seed");
const FILES = ["bible-hy.json", "fiction-quotes.json"];

/** Remove one or more trailing » / ։ (and surrounding end whitespace). */
function stripTrailing(text) {
  if (typeof text !== "string") return { text, changed: false };
  const next = text.replace(/[»։]+\s*$/u, "").trimEnd();
  return { text: next, changed: next !== text };
}

let totalChanged = 0;

for (const name of FILES) {
  const filePath = path.join(SEED_DIR, name);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(data)) {
    throw new Error(`${name} must be a JSON array`);
  }

  let changed = 0;
  for (const row of data) {
    const result = stripTrailing(row.text);
    if (result.changed) {
      row.text = result.text;
      changed += 1;
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  totalChanged += changed;
  console.log(`${name}: updated ${changed} / ${data.length}`);
}

console.log(`Done. Total texts changed: ${totalChanged}`);
