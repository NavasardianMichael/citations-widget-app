/**
 * Restore trailing » when a citation still has an unmatched opening «
 * (closing marks were stripped earlier by strip-trailing-citation-punct.mjs).
 *
 * Usage (from server/):
 *   node scripts/restore-closing-guillemets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(__dirname, "../data/seed");
const FILES = ["bible-hy.json", "fiction-quotes.json"];

/** How many « remain unclosed by » (nesting-aware). */
function unmatchedOpenCount(text) {
  let depth = 0;
  for (const ch of text) {
    if (ch === "«") depth += 1;
    else if (ch === "»") depth = Math.max(0, depth - 1);
  }
  return depth;
}

function restoreClosing(text) {
  if (typeof text !== "string" || !text.includes("«")) {
    return { text, changed: false };
  }
  const missing = unmatchedOpenCount(text);
  if (missing <= 0) return { text, changed: false };
  return { text: `${text.trimEnd()}${"»".repeat(missing)}`, changed: true };
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
    const result = restoreClosing(row.text);
    if (result.changed) {
      row.text = result.text;
      changed += 1;
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  totalChanged += changed;
  console.log(`${name}: restored » on ${changed} / ${data.length}`);
}

console.log(`Done. Total texts changed: ${totalChanged}`);
