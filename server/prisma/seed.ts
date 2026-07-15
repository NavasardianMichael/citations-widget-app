import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

import { PrismaClient, type CitationCategory } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, "..", "data", "seed");

type SeedCitation = {
  id: string;
  category: CitationCategory;
  text: string;
  author: string | null;
  source: string | null;
};

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(seedDir, file), "utf-8"));
}

async function insertBatch(rows: SeedCitation[]) {
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.citation.createMany({
      data: batch.map((row) => ({
        ...row,
        status: "approved" as const,
        submittedByUserId: null,
        shareProfile: false,
      })),
      skipDuplicates: true,
    });
  }
}

async function seedFile(file: string) {
  const rows = loadJson<SeedCitation[]>(file);
  await insertBatch(rows);
  console.log(`Seeded ${rows.length} citations from ${file}.`);
}

async function main() {
  await seedFile("bible-hy.json");
  await seedFile("fiction-quotes.json");
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
