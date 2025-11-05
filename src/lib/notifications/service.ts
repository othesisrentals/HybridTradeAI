import { prisma } from '@/lib/db/prisma';
import { RedisKeys } from '@/lib/redis/keys';
import { NotificationType, NotificationPriority, Notification } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

export interface CreateNotificationInput {
  userId?: string; // undefined for broadcast notifications
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
  expiresAt?: Date;
}

export class NotificationService {
  private async getRedisPublisher() {
    const { redisPublisher } = await import('@/lib/redis/client');
    return redisPublisher;
  }

  /**
   * Create a notification and broadcast it via Redis
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          priority: input.priority || NotificationPriority.MEDIUM,
          title: input.title,
          message: input.message,
          link: input.actionUrl,
          data: input.metadata,
        },
      });

      // Broadcast via Redis for real-time delivery
      await this.broadcast(notification);

      logger.info('Notification created', {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications (e.g., for broadcasts)
   */
  async createMany(inputs: CreateNotificationInput[]): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const input of inputs) {
      const notification = await this.create(input);
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Broadcast notification to specific user
   */
  async broadcast(notification: Notification): Promise<void> {
    try {
      const channel = notification.userId
        ? `user:${notification.userId}:notifications`
        : 'notifications:broadcast';

      const redisPublisher = await this.getRedisPublisher();
      await redisPublisher.publish(
        channel,
        JSON.stringify({
          type: 'notification',
          data: notification,
        })
      );

      logger.debug('Notification broadcasted', {
        notificationId: notification.id,
        channel,
      });
    } catch (error) {
      logger.error('Failed to broadcast notification', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
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
    });

    return result.count;
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  /**
   * Delete expired notifications (cleanup job)
   */
  async deleteExpired(): Promise<number> {
    // Since there's no expiresAt field, this method is not applicable
    logger.info('Expired notifications cleanup skipped - no expiresAt field');
    return 0;
  }

  /**
   * Admin broadcast to all users
   */
  async broadcastToAll(input: Omit<CreateNotificationInput, 'userId'>): Promise<void> {
    const notification = await prisma.notification.create({
      data: {
        type: input.type,
        priority: input.priority || NotificationPriority.MEDIUM,
        title: input.title,
        message: input.message,
        link: input.actionUrl,
        data: input.metadata,
      },
    });

    // Broadcast to all connected clients
    const redisPublisher = await this.getRedisPublisher();
    await redisPublisher.publish(
      'notifications:broadcast',
      JSON.stringify({
        type: 'broadcast',
        data: notification,
      })
    );

    logger.info('Broadcast notification sent', {
      notificationId: notification.id,
    });
  }
}

export const notificationService = new NotificationService();

