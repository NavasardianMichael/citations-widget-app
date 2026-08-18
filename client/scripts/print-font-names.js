/**
 * Prints the name table of every font in `assets/fonts`.
 *
 * `expo-font` lets the app register a face under any alias, but the iOS widget
 * extension loads fonts through Core Text and only answers to the name baked
 * into the file. Use the `postscript` column for `WIDGET_FONT_OPTIONS`'
 * `postScriptName` in `src/fonts/registry.ts`.
 *
 *   node ./scripts/print-font-names.js
 */
const fs = require("fs");
const path = require("path");

const FONTS_DIRECTORY = path.join("assets", "fonts");
/** sfnt name IDs worth showing (OpenType spec, `name` table). */
const NAME_IDS = { 1: "family", 4: "full", 6: "postscript" };

function decodeUtf16BE(bytes) {
  let decoded = "";
  for (let index = 0; index + 1 < bytes.length; index += 2) {
    decoded += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
  }
  return decoded;
}

function readNameTable(file) {
  const buffer = fs.readFileSync(file);
  const tableCount = buffer.readUInt16BE(4);

  let nameTableOffset = null;
  for (let index = 0; index < tableCount; index += 1) {
    const record = 12 + index * 16;
    if (buffer.toString("ascii", record, record + 4) === "name") {
      nameTableOffset = buffer.readUInt32BE(record + 8);
      break;
    }
  }
  if (nameTableOffset === null) return {};

  const recordCount = buffer.readUInt16BE(nameTableOffset + 2);
  const stringsOffset = nameTableOffset + buffer.readUInt16BE(nameTableOffset + 4);
  const names = {};

  for (let index = 0; index < recordCount; index += 1) {
    const record = nameTableOffset + 6 + index * 12;
    const platformId = buffer.readUInt16BE(record);
    const nameId = buffer.readUInt16BE(record + 6);
    const label = NAME_IDS[nameId];
    if (!label) continue;

    const length = buffer.readUInt16BE(record + 8);
    const offset = stringsOffset + buffer.readUInt16BE(record + 10);
    const raw = buffer.subarray(offset, offset + length);
    // Platform 3 (Windows) stores UTF-16BE, platform 1 (Macintosh) MacRoman.
    names[label] = platformId === 3 ? decodeUtf16BE(raw) : raw.toString("latin1");
  }

  return names;
}

function* fontFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* fontFiles(file);
    } else if (/\.(otf|ttf)$/i.test(entry.name)) {
      yield file;
    }
  }
}

for (const file of fontFiles(FONTS_DIRECTORY)) {
  const relative = path.relative(FONTS_DIRECTORY, file).replace(/\\/g, "/");
  const kilobytes = Math.round(fs.statSync(file).size / 1024);
  const names = readNameTable(file);
  console.log(
    `${relative.padEnd(54)} ${String(kilobytes).padStart(4)}KB  ` +
      `postscript=${JSON.stringify(names.postscript ?? null)} family=${JSON.stringify(names.family ?? null)}`,
  );
}
