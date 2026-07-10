import { readFileSync } from "node:fs";
import path from "node:path";

import { db } from "../db/client.js";
import { citations } from "../db/schema.js";

type KjvVerse = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  sourceRef: string;
  text: string;
};

type FictionQuote = {
  id: string;
  author: string;
  sourceRef: string;
  text: string;
  tags: string[];
};

const seedDir = path.join(import.meta.dirname, "..", "..", "data", "seed");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(seedDir, file), "utf-8"));
}

function insertBatch(rows: (typeof citations.$inferInsert)[]) {
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    db.transaction((tx) => {
      for (const row of batch) {
        tx.insert(citations).values(row).onConflictDoNothing().run();
      }
    });
  }
}

function seedBible() {
  const verses = loadJson<KjvVerse[]>("kjv.json");
  const rows = verses.map((v) => ({
    id: v.id,
    text: v.text,
    author: null,
    sourceRef: v.sourceRef,
    sourceType: "bible" as const,
    tags: [],
    status: "approved" as const,
    submittedByUserId: null,
    shareProfile: false,
  }));
  insertBatch(rows);
  console.log(`Seeded ${rows.length} Bible verses (KJV).`);
}

function seedFiction() {
  const quotes = loadJson<FictionQuote[]>("fiction-quotes.json");
  const rows = quotes.map((q) => ({
    id: q.id,
    text: q.text,
    author: q.author,
    sourceRef: q.sourceRef,
    sourceType: "fiction" as const,
    tags: q.tags,
    status: "approved" as const,
    submittedByUserId: null,
    shareProfile: false,
  }));
  insertBatch(rows);
  console.log(`Seeded ${rows.length} fiction/literary quotes.`);
}

seedBible();
seedFiction();
console.log("Seed complete.");
