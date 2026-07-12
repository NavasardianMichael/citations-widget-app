import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/index.js";
import { logger } from "./lib/logger.js";

const app = createApp();

async function start() {
  try {
    await prisma.$connect();
    app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
