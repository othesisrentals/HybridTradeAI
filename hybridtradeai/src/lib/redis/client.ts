import Redis, { RedisOptions } from "ioredis";

type RedisRole = "publisher" | "subscriber" | "general";

declare global {
  // eslint-disable-next-line no-var
  var __redisClients: Map<RedisRole, Redis> | undefined;
}

const redisConnections = global.__redisClients ?? new Map<RedisRole, Redis>();

if (process.env.NODE_ENV !== "production") {
  global.__redisClients = redisConnections;
}

function buildRedisOptions(role: RedisRole): RedisOptions {
  const baseUrl = process.env.REDIS_URL;

  if (!baseUrl) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  const options: RedisOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    reconnectOnError: () => true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  if (process.env.REDIS_TLS === "true") {
    options.tls = {
      rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== "false",
    };
  }

  options.connectionName = `hybridtradeai:${role}`;

  const sentinelGroup = process.env.REDIS_SENTINEL_GROUP;
  const sentinelHosts = process.env.REDIS_SENTINEL_HOSTS;

  if (sentinelGroup && sentinelHosts) {
    return {
      ...options,
      sentinels: sentinelHosts.split(",").map((host) => {
        const [address, port] = host.split(":");
        return { host: address, port: Number(port ?? "26379") };
      }),
      name: sentinelGroup,
    };
  }

  return {
    ...options,
    url: baseUrl,
  };
}

function createRedisClient(role: RedisRole): Redis {
  const existing = redisConnections.get(role);
  if (existing) {
    return existing;
  }

  const client = new Redis(buildRedisOptions(role));

  client.on("error", (error) => {
    console.error(`[Redis:${role}] error`, error);
  });

  client.on("connect", () => {
    console.info(`[Redis:${role}] connected`);
  });

  client.on("close", () => {
    console.warn(`[Redis:${role}] connection closed`);
  });

  redisConnections.set(role, client);
  return client;
}

export function getRedisPublisher(): Redis {
  return createRedisClient("publisher");
}

export function getRedisSubscriber(): Redis {
  return createRedisClient("subscriber");
}

export function getRedisClient(): Redis {
  return createRedisClient("general");
}
