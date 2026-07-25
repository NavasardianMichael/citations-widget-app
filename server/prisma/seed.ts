/** Prisma seed entry — empty-DB seed (same as container boot without --sync). */
import { runSeedCli } from "../src/scripts/seed-citations.js";

runSeedCli(false).catch((error) => {
  console.error(error);
  process.exit(1);
});
