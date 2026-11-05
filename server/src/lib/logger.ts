import { createRequire } from "module";
import pino from "pino";

import { env, isDev } from "../config/env.js";

function canUsePrettyTransport(): boolean {
  if (!isDev) return false;
  try {
    const require = createRequire(import.meta.url);
    require.resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
}

export const logger = pino({
  level: env.LOG_LEVEL,
  // pino only serializes Errors under `err` by default; call sites also log
  // `{ error }`, which otherwise prints as `"error":{}` and hides the cause.
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
  ...(canUsePrettyTransport() && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});
