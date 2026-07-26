import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient, type CitationCategory } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Works for both `src/scripts` (tsx) and `dist/scripts` (production). */
const seedDir = path.join(__dirname, "..", "..", "data", "seed");

type SeedCitation = {
  id: string;
  category: CitationCategory;
  text: string;
  source: string;
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
      })),
      skipDuplicates: true,
    });
  }
}

async function seedFile(file: string) {
  const rows = loadJson<SeedCitation[]>(file);
  await insertBatch(rows);
  console.log(`Processed ${rows.length} citations from ${file}.`);
}

/**
 * Inserts all seed JSON rows. Existing IDs are skipped (`skipDuplicates`).
 * Use after deploy when you have added new seed citations.
 */
export async function syncCitationsFromSeed() {
  console.log(`Syncing citations from ${seedDir}`);
  const before = await prisma.citation.count();
  await seedFile("bible-hy.json");
  await seedFile("fiction-quotes.json");
  const after = await prisma.citation.count();
  console.log(
    `Citation sync complete. Before: ${before}, after: ${after}, added: ${Math.max(0, after - before)}.`,
  );
  return { before, after, added: Math.max(0, after - before) };
}

/**
 * Seeds bible + fiction citations when the table is empty.
 * Safe to run on every boot: skips when any citation already exists.
 */
export async function seedCitationsIfEmpty() {
  const existing = await prisma.citation.count();
  if (existing > 0) {
    console.log(`Skipping citation seed: ${existing} citation(s) already present.`);
    return { seeded: false, existing };
  }

  const result = await syncCitationsFromSeed();
  console.log(`Citation seed complete (${result.after} rows).`);
  return { seeded: true, existing: result.after };
}

/** CLI entry used by npm scripts and `docker exec … node dist/scripts/seed-citations.js`. */
export async function runSeedCli(sync = false) {
  try {
    if (sync) {
      await syncCitationsFromSeed();
    } else {
      await seedCitationsIfEmpty();
    }
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isDirectRun) {
  runSeedCli(process.argv.includes("--sync")).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
