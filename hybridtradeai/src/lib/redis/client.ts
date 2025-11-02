import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

export const redis: Redis =
  global.__redisClient ??
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__redisClient = redis;
}

export type { Redis };
