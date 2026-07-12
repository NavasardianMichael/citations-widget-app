import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, "..", "data", "seed");

type KjvVerse = {
  id: string;
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

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(seedDir, file), "utf-8"));
}

async function insertBatch(
  rows: Array<{
    id: string;
    text: string;
    author: string | null;
    sourceRef: string | null;
    sourceType: "bible" | "fiction";
    tags: string[];
    status: "approved";
    submittedByUserId: null;
    shareProfile: boolean;
  }>,
) {
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.citation.createMany({ data: batch, skipDuplicates: true });
  }
}

async function seedBible() {
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
  await insertBatch(rows);
  console.log(`Seeded ${rows.length} Bible verses (KJV).`);
}

async function seedFiction() {
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
  await insertBatch(rows);
  console.log(`Seeded ${rows.length} fiction/literary quotes.`);
}

async function main() {
  await seedBible();
  await seedFiction();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
