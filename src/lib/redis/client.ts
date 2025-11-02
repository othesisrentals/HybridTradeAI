import Redis from 'ioredis'

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  // Return dummy URL during build time
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    return 'redis://localhost:6379'
  }
  throw new Error('REDIS_URL is not defined')
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
  redisSubscriber: Redis | undefined
}

// Main Redis client for general operations
export const redis =
  globalForRedis.redis ??
  new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

// Separate subscriber client for pub/sub (required by Redis)
export const redisSubscriber =
  globalForRedis.redisSubscriber ??
  new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
  globalForRedis.redisSubscriber = redisSubscriber
}

// Helper function to publish notifications
export async function publishNotification(channel: string, data: any) {
  await redis.publish(channel, JSON.stringify(data))
}

// Helper function to subscribe to notifications
export function subscribeToNotifications(
  channel: string,
  callback: (data: any) => void
) {
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
}

export default redis
