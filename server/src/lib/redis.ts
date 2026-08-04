import Redis from "ioredis";

import { env } from "../config/env.js";
import { logger } from "./logger.js";

/** Must match the `prefix` passed to `connect-redis`'s `RedisStore` in `app.ts`. */
export const SESSION_KEY_PREFIX = "citations:session:";

export const redis = new Redis.default(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    return Math.min(times * 200, 2000);
  },
});

/** Removes the express-session records for the given session ids from Redis directly. */
export async function deleteSessionsByIds(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  await redis.del(sessionIds.map((id) => `${SESSION_KEY_PREFIX}${id}`));
}

redis.on("error", (err: Error) => {
  logger.error({ err }, "Redis connection error");
});

redis.on("connect", () => {
  logger.info("Redis connected");
});
