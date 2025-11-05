import { prisma } from '@/lib/db/prisma'
import { publishNotification } from '@/lib/redis/client'
import type { NotificationType, NotificationPriority } from '@prisma/client'

interface CreateNotificationParams {
  userId?: string | null // null for broadcast
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  link?: string
  data?: Record<string, any>
}

/**
 * Create a notification and publish to Redis for real-time delivery
 */
export async function createNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      priority: params.priority || 'MEDIUM',
      title: params.title,
      message: params.message,
      link: params.link,
      data: params.data ? JSON.parse(JSON.stringify(params.data)) : null,
    },
  })

  // Publish to Redis for SSE delivery
  if (params.userId) {
    await publishNotification(`user:${params.userId}:notifications`, {
      type: 'new_notification',
      notification,
    })
  } else {
    // Broadcast to all users
    await publishNotification('broadcast:notifications', {
      type: 'broadcast_notification',
      notification,
    })
  }

  return notification
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.update({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  })

  // Notify client of read status change
  await publishNotification(`user:${userId}:notifications`, {
    type: 'notification_read',
    notificationId,
  })

  return notification
}

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    type?: NotificationType
  }
) {
  const { limit = 50, offset = 0, unreadOnly = false, type } = options || {}

  const where: any = { userId }
  if (unreadOnly) {
    where.read = false
  }
  if (type) {
    where.type = type
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ])

  return {
    notifications,
    total,
    hasMore: offset + limit < total,
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string) {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  })
}

