import { prisma } from '@/lib/db/prisma'
import { publishNotification } from '@/lib/redis/client'
import {
  NotificationType,
  NotificationPriority,
  Notification,
} from '@prisma/client'
import { logger } from '@/lib/utils/logger'

export interface CreateNotificationInput {
  userId?: string
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  link?: string
  data?: Record<string, unknown>
}

export class NotificationService {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        priority: input.priority || NotificationPriority.MEDIUM,
        title: input.title,
        message: input.message,
        link: input.link,
        data: input.data ? JSON.parse(JSON.stringify(input.data)) : undefined,
      },
    })

    await this.broadcast(notification)

    logger.info('Notification created', {
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
    })

    return notification
  }

  async createMany(inputs: CreateNotificationInput[]): Promise<Notification[]> {
    const notifications: Notification[] = []

    for (const input of inputs) {
      notifications.push(await this.create(input))
    }

    return notifications
  }

  async broadcast(notification: Notification): Promise<void> {
    try {
      const channel = notification.userId
        ? `user:${notification.userId}:notifications`
        : 'notifications:broadcast'

      await publishNotification(channel, {
        type: 'notification',
        notification,
      })

      logger.debug('Notification broadcasted', {
        notificationId: notification.id,
        channel,
      })
    } catch (error) {
      logger.error('Failed to broadcast notification', error as Error)
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return result.count
  }

  async getUserNotifications(
    userId: string,
    options: {
      page?: number
      limit?: number
      unreadOnly?: boolean
    } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options
    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    })
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
      },
    })
  }

  async broadcastToAll(input: Omit<CreateNotificationInput, 'userId'>): Promise<void> {
    const notification = await prisma.notification.create({
      data: {
        type: input.type,
        priority: input.priority || NotificationPriority.MEDIUM,
        title: input.title,
        message: input.message,
        link: input.link,
        data: input.data ? JSON.parse(JSON.stringify(input.data)) : undefined,
      },
    })

    await publishNotification('notifications:broadcast', {
      type: 'broadcast',
      notification,
    })

    logger.info('Broadcast notification sent', {
      notificationId: notification.id,
    })
  }
}

export const notificationService = new NotificationService()
