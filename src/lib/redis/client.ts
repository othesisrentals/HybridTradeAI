import Redis, { RedisOptions } from 'ioredis';

const getRedisConfiguration = (): RedisOptions => {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect immediately
    retryStrategy: (times: number) => {
      if (times > 3) return null; // Stop retrying after 3 attempts
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  };
};

class RedisClient {
  private static instance: RedisClient;
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  private constructor() {
    const config = getRedisConfiguration();
    
    this.client = new Redis(config);
    this.subscriber = new Redis(config);
    this.publisher = new Redis(config);

    this.client.on('error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('??  Redis not available (optional for dev)');
      } else {
        console.error('Redis Client Error:', error);
      }
    });

    this.subscriber.on('error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('??  Redis Subscriber not available');
      } else {
        console.error('Redis Subscriber Error:', error);
      }
    });

    this.publisher.on('error', (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('??  Redis Publisher not available');
      } else {
        console.error('Redis Publisher Error:', error);
      }
    });

    this.client.on('connect', () => {
      console.log('? Redis Client Connected');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  public getSubscriber(): Redis {
    return this.subscriber;
  }

  public getPublisher(): Redis {
    return this.publisher;
  }

  public async disconnect(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit(),
    ]);
  }
}

export const redisClient = RedisClient.getInstance().getClient();
export const redisSubscriber = RedisClient.getInstance().getSubscriber();
export const redisPublisher = RedisClient.getInstance().getPublisher();

export default RedisClient;
