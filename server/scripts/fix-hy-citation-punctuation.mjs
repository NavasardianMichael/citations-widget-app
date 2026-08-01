/**
 * Fix Armenian citation punctuation in seed JSON:
 * 1. Ending »։ or ։» → » (citation closes with guillemet, not period+guillemet)
 * 2. Mid-text Armenian full stop ։ with no following space → insert space
 *
 * Usage:
 *   node scripts/fix-hy-citation-punctuation.mjs
 *   node scripts/fix-hy-citation-punctuation.mjs data/seed/bible-hy.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const DEFAULT_FILES = [
  "data/seed/bible-hy.json",
  "data/seed/fiction-quotes.json",
];

/** @param {string} text */
export function fixCitationText(text) {
  if (typeof text !== "string" || !text) return { text, endFixed: false, spacesAdded: 0 };

  let next = text;
  let endFixed = false;

  // Citation should end with » alone, not »։ / ։» / ». / .»
  const endRe = /(?:»։|։»|»\.|\.»)\s*$/u;
  if (endRe.test(next)) {
    next = next.replace(endRe, "»");
    endFixed = true;
  }

  // After Armenian full stop, ensure a space before the next non-space char
  // (does not apply at end-of-string; » after ։ is left alone if somehow mid-text).
  let spacesAdded = 0;
  next = next.replace(/։(?=\S)/gu, (match, offset, full) => {
    const following = full[offset + match.length];
    // Keep ։» intact if it appears mid-string (rare); end case already handled.
    if (following === "»") return match;
    spacesAdded += 1;
    return "։ ";
  });

  return { text: next, endFixed, spacesAdded };
}

function formatFile(relPath) {
  const abs = path.resolve(root, relPath);
  const items = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!Array.isArray(items)) {
    throw new Error(`Expected array in ${relPath}`);
  }

  let changed = 0;
  let endFixed = 0;
  let spacesAdded = 0;

  for (const item of items) {
    if (typeof item?.text !== "string") continue;
    const result = fixCitationText(item.text);
    if (result.text !== item.text) {
      item.text = result.text;
      changed += 1;
      if (result.endFixed) endFixed += 1;
      spacesAdded += result.spacesAdded;
    }
  }

  fs.writeFileSync(abs, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  return { relPath, total: items.length, changed, endFixed, spacesAdded };
}

const files = process.argv.slice(2);
const targets = files.length > 0 ? files : DEFAULT_FILES;

const summaries = targets.map(formatFile);
for (const s of summaries) {
  console.log(
    `${s.relPath}: ${s.changed}/${s.total} texts updated ` +
      `(end »։→»: ${s.endFixed}, spaces after ։: ${s.spacesAdded})`,
  );
}
