/**
 * Prints which quote characters each font in `assets/fonts` can actually draw.
 *
 * Several of the free Armenian faces ship a cmap with the Armenian block and
 * little else — no «, no ». The widget renders the quote in one text view with
 * one typeface, and a face loaded from an asset has no fallback chain, so a
 * missing bracket is drawn as nothing at all. `hasGuillemets` in
 * `src/fonts/registry.ts` records the answer for each face; re-run this after
 * adding or replacing a font and update the flag to match.
 *
 * "yes" only means the codepoint has a glyph, not that the glyph is a bracket.
 * Legacy ARMSCII-8 faces (e.g. Vrdznagir) put Armenian letters in the Latin-1
 * slots, so « renders as "," and » as "ե" — check the rendered quote too.
 *
 *   node ./scripts/check-font-glyphs.js
 */
const fs = require("fs");
const path = require("path");

const FONTS_DIRECTORY = path.join("assets", "fonts");
const TARGETS = [
  { code: 0x00ab, label: "«" },
  { code: 0x00bb, label: "»" },
  { code: 0x055d, label: "՝" },
  { code: 0x0589, label: "։" },
];

function readTables(buffer) {
  let base = 0;
  if (buffer.toString("ascii", 0, 4) === "ttcf") base = buffer.readUInt32BE(12);
  const count = buffer.readUInt16BE(base + 4);
  const tables = {};
  for (let index = 0; index < count; index += 1) {
    const record = base + 12 + index * 16;
    tables[buffer.toString("ascii", record, record + 4)] = buffer.readUInt32BE(record + 8);
  }
  return tables;
}

/** Codepoints with a non-zero glyph id, across every cmap subtable we understand. */
function readCoverage(buffer) {
  const cmap = readTables(buffer).cmap;
  if (cmap === undefined) return null;

  const covered = new Set();
  const subtableCount = buffer.readUInt16BE(cmap + 2);

  for (let index = 0; index < subtableCount; index += 1) {
    const offset = cmap + buffer.readUInt32BE(cmap + 4 + index * 8 + 4);
    const format = buffer.readUInt16BE(offset);

    if (format === 4) {
      const segmentsX2 = buffer.readUInt16BE(offset + 6);
      const endCodes = offset + 14;
      const startCodes = endCodes + segmentsX2 + 2;
      const deltas = startCodes + segmentsX2;
      const rangeOffsets = deltas + segmentsX2;

      for (let segment = 0; segment < segmentsX2 / 2; segment += 1) {
        const end = buffer.readUInt16BE(endCodes + segment * 2);
        const start = buffer.readUInt16BE(startCodes + segment * 2);
        if (start === 0xffff) continue;
        const delta = buffer.readInt16BE(deltas + segment * 2);
        const rangeOffset = buffer.readUInt16BE(rangeOffsets + segment * 2);

        for (let code = start; code <= end; code += 1) {
          let glyph;
          if (rangeOffset === 0) {
            glyph = (code + delta) & 0xffff;
          } else {
            const at = rangeOffsets + segment * 2 + rangeOffset + (code - start) * 2;
            if (at + 1 >= buffer.length) continue;
            glyph = buffer.readUInt16BE(at);
            if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
          }
          if (glyph !== 0) covered.add(code);
        }
      }
    } else if (format === 12) {
      const groups = buffer.readUInt32BE(offset + 12);
      for (let group = 0; group < groups; group += 1) {
        const at = offset + 16 + group * 12;
        if (buffer.readUInt32BE(at + 8) === 0) continue;
        const start = buffer.readUInt32BE(at);
        const end = buffer.readUInt32BE(at + 4);
        for (let code = start; code <= end && code - start < 0x10000; code += 1) {
          covered.add(code);
        }
      }
    } else if (format === 6) {
      const first = buffer.readUInt16BE(offset + 6);
      const count = buffer.readUInt16BE(offset + 8);
      for (let entry = 0; entry < count; entry += 1) {
        if (buffer.readUInt16BE(offset + 10 + entry * 2) !== 0) covered.add(first + entry);
      }
    } else if (format === 0) {
      for (let code = 0; code < 256; code += 1) {
        if (buffer[offset + 6 + code] !== 0) covered.add(code);
      }
    }
  }

  return covered;
}

function listFonts(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) listFonts(full, found);
    else if (/\.(ttf|otf)$/i.test(entry.name)) found.push(full);
  }
  return found;
}

const NAME_WIDTH = 58;
console.log(
  "font".padEnd(NAME_WIDTH) +
    TARGETS.map((target) => `${target.label} U+${target.code.toString(16).toUpperCase().padStart(4, "0")}`.padEnd(10)).join(""),
);

for (const file of listFonts(FONTS_DIRECTORY)) {
  const name = path.relative(FONTS_DIRECTORY, file);
  let covered;
  try {
    covered = readCoverage(fs.readFileSync(file));
  } catch (error) {
    console.log(name.padEnd(NAME_WIDTH) + `unreadable: ${error.message}`);
    continue;
  }
  if (covered === null) {
    console.log(name.padEnd(NAME_WIDTH) + "no cmap table");
    continue;
  }
  console.log(
    name.padEnd(NAME_WIDTH) +
      TARGETS.map((target) => (covered.has(target.code) ? "yes" : "NO").padEnd(10)).join(""),
  );
}
