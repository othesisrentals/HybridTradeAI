import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  // Return dummy URL during build time or when Redis is not available
  return 'redis://localhost:6379'
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
  redisSubscriber: Redis | undefined
}

// Main Redis client for general operations
export const redis =
  globalForRedis.redis ??
  new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true, // Don't connect immediately
  })

// Separate subscriber client for pub/sub (required by Redis)
export const redisSubscriber =
  globalForRedis.redisSubscriber ??
  new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true, // Don't connect immediately
  })

// Aliases for backward compatibility
export const redisClient = redis
export const redisPublisher = redis

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
  globalForRedis.redisSubscriber = redisSubscriber
}

// Helper function to publish notifications
export async function publishNotification(channel: string, data: any) {
  try {
    await redis.publish(channel, JSON.stringify(data))
  } catch (error) {
    console.warn('Redis publish failed (notifications disabled):', error instanceof Error ? error.message : String(error))
    // Silently fail - notifications are not critical
  }
}

// Helper function to subscribe to notifications
export function subscribeToNotifications(
  channel: string,
  callback: (data: any) => void
) {
  try {
    redisSubscriber.subscribe(channel)
    redisSubscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message)
          callback(data)
        } catch (error) {
          console.error('Error parsing Redis message:', error)
        }
      }
    })
  } catch (error) {
    console.warn('Redis subscribe failed (notifications disabled):', error instanceof Error ? error.message : String(error))
    // Silently fail - notifications are not critical
  }
}

export default redis

