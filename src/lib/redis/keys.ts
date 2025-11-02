/**
 * Redis key generation utilities
 * Centralizes all Redis key patterns for consistency
 */

export const RedisKeys = {
  // Notifications
  notification: (notificationId: string) => `notification:${notificationId}`,
  userNotifications: (userId: string) => `user:${userId}:notifications`,
  notificationChannel: () => 'notifications:channel',
  
  // User sessions
  userSession: (userId: string) => `user:${userId}:session`,
  userOnline: (userId: string) => `user:${userId}:online`,
  
  // Ad tasks
  adTaskCooldown: (userId: string, taskId: string) => `ad:cooldown:${userId}:${taskId}`,
  adTaskDailyLimit: (userId: string, taskId: string, date: string) => 
    `ad:daily:${userId}:${taskId}:${date}`,
  
  // Rate limiting
  rateLimit: (identifier: string, action: string) => `ratelimit:${action}:${identifier}`,
  
  // Profit distribution
  profitDistributionLock: () => 'profit:distribution:lock',
  profitDistributionLastRun: () => 'profit:distribution:lastrun',
  
  // SSE connections
  sseConnection: (connectionId: string) => `sse:connection:${connectionId}`,
  userSseConnections: (userId: string) => `sse:user:${userId}:connections`,
  
  // Leader election for cross-tab sync
  leaderElection: (userId: string) => `leader:${userId}`,
  
  // Cache
  cache: (key: string) => `cache:${key}`,
  
  // Stats
  dailyStats: (date: string) => `stats:daily:${date}`,
  platformStats: () => 'stats:platform',
} as const;

export default RedisKeys;
