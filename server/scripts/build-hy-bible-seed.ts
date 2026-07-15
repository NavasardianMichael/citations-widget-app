import { createReadStream, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, "..", "data", "seed");
const csvPath = path.join(seedDir, "_armeastern.csv");
const outPath = path.join(seedDir, "bible-hy.json");

const BOOK_NAMES_HY: Record<string, string> = {
  Genesis: "Ծննդոց",
  Exodus: "Ելից",
  Leviticus: "Ղևտացոց",
  Numbers: "Թվոց",
  Deuteronomy: "Երկրորդ Օրենք",
  Joshua: "Հեսու",
  Judges: "Դատավորներ",
  Ruth: "Հռութ",
  "I Samuel": "Ա Թագավորներ",
  "II Samuel": "Բ Թագավորներ",
  "I Kings": "Գ Թագավորներ",
  "II Kings": "Դ Թագավորներ",
  "I Chronicles": "Ա Մնացորդաց",
  "II Chronicles": "Բ Մնացորդաց",
  Ezra: "Եզրաս",
  Nehemiah: "Նեեմիա",
  Esther: "Եսթեր",
  Job: "Հոբ",
  Psalms: "Սաղմոսներ",
  Proverbs: "Առակներ",
  Ecclesiastes: "Ժողովող",
  "Song of Solomon": "Երգ Երգոց",
  Isaiah: "Եսայիա",
  Jeremiah: "Երեմիա",
  Lamentations: "Ողբ",
  Ezekiel: "Եզեկիել",
  Daniel: "Դանիել",
  Hosea: "Ովսեե",
  Joel: "Հովել",
  Amos: "Ամոս",
  Obadiah: "Աբդիա",
  Jonah: "Հովնան",
  Micah: "Միքիա",
  Nahum: "Նահում",
  Habakkuk: "Ամբակում",
  Zephaniah: "Սոփոնիա",
  Haggai: "Անգե",
  Zechariah: "Զաքարիա",
  Malachi: "Մաղաքիա",
  Matthew: "Մատթեոս",
  Mark: "Մարկոս",
  Luke: "Ղուկաս",
  John: "Հովհաննես",
  Acts: "Գործք Առաքելոց",
  Romans: "Հռոմեացիներ",
  "I Corinthians": "Ա Կորնթացիներ",
  "II Corinthians": "Բ Կորնթացիներ",
  Galatians: "Գաղատացիներ",
  Ephesians: "Եփեսացիներ",
  Philippians: "Փիլիպպեցիներ",
  Colossians: "Կողոսացիներ",
  "I Thessalonians": "Ա Թեսաղոնիկեցիներ",
  "II Thessalonians": "Բ Թեսաղոնիկեցիներ",
  "I Timothy": "Ա Տիմոթեոս",
  "II Timothy": "Բ Տիմոթեոս",
  Titus: "Տիտոս",
  Philemon: "Փիլիմոն",
  Hebrews: "Եբրայեցիներ",
  James: "Հակոբոս",
  "I Peter": "Ա Պետրոս",
  "II Peter": "Բ Պետրոս",
  "I John": "Ա Հովհաննես",
  "II John": "Բ Հովհաննես",
  "III John": "Գ Հովհաննես",
  Jude: "Հուդա",
  "Revelation of John": "Հայտնություն",
};

function slugifyBook(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Parse a single CSV line with quoted fields. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

async function main() {
  const rl = readline.createInterface({
    input: createReadStream(csvPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const rows: Array<{
    id: string;
    category: "bible";
    text: string;
    author: null;
    source: string;
  }> = [];

  let isHeader = true;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (isHeader) {
      isHeader = false;
      continue;
    }
    const fields = parseCsvLine(line);
    if (fields.length < 4) continue;
    const [book, chapterStr, verseStr, ...rest] = fields;
    const text = rest.join(",").trim();
    if (!text) continue;
    const chapter = Number(chapterStr);
    const verse = Number(verseStr);
    if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) continue;

    const hyName = BOOK_NAMES_HY[book] ?? book;
    rows.push({
      id: `bible-${slugifyBook(book)}-${chapter}-${verse}`,
      category: "bible",
      text,
      author: null,
      source: `${hyName} ${chapter}:${verse}`,
    });
  }

  writeFileSync(outPath, JSON.stringify(rows));
  console.log(`Wrote ${rows.length} verses to bible-hy.json from CSV.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
