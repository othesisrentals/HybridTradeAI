import type { NotificationDelivery } from "@prisma/client";
import {
  NotificationPriority,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export interface CreateNotificationInput {
  userIds?: string[];
  userId?: string;
  type: NotificationType | keyof typeof NotificationType | string;
  priority?: NotificationPriority | keyof typeof NotificationPriority;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
  expiresAt?: Date | string | null;
  createdById?: string | null;
}

export interface BroadcastInput {
  title: string;
  message: string;
  type?: NotificationType | string;
  priority?: NotificationPriority | string;
  link?: string;
  data?: Record<string, unknown>;
  createdById?: string | null;
}

function normalizeEnumValue<T extends { [key: string]: string }>(
  enumType: T,
  value: string,
  fallback: T[keyof T],
): T[keyof T] {
  const upper = value.toUpperCase();
  if (upper in enumType) {
    return enumType[upper as keyof T];
  }
  return fallback;
}

function normalizePriority(
  value?: NotificationPriority | string,
): NotificationPriority {
  if (!value) {
    return NotificationPriority.NORMAL;
  }
  return normalizeEnumValue(
    NotificationPriority,
    value,
    NotificationPriority.NORMAL,
  );
}

function normalizeNotificationType(value: string | NotificationType) {
  if (typeof value !== "string") {
    return value;
  }
  return normalizeEnumValue(NotificationType, value, NotificationType.SYSTEM);
}

function buildNotificationPayload(notification: {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: Date;
  data: Prisma.JsonValue | null;
  link?: string;
  read?: boolean;
  deliveredAt?: Date;
  deliveryId?: string;
}) {
  const baseData =
    (notification.data && typeof notification.data === "object")
      ? (notification.data as Record<string, unknown>)
      : {};

  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    createdAt: notification.createdAt.toISOString(),
    read: Boolean(notification.read),
    deliveredAt: notification.deliveredAt?.toISOString(),
    link: notification.link ?? (baseData.link as string | undefined),
    data: baseData,
    deliveryId: notification.deliveryId,
  };
}

export class NotificationService {
  static async createNotification(input: CreateNotificationInput) {
    const {
      userId,
      userIds,
      type,
      priority,
      title,
      message,
      link,
      data,
      expiresAt,
      createdById,
    } = input;

    const recipients = userIds?.length
      ? Array.from(new Set(userIds))
      : userId
      ? [userId]
      : [];

    const notification = await prisma.notification.create({
      data: {
        type: normalizeNotificationType(type as string),
        priority: normalizePriority(priority),
        title,
        message,
        data: {
          ...data,
          ...(link ? { link } : {}),
        },
        isBroadcast: recipients.length === 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: createdById ?? null,
      },
    });

    if (recipients.length === 0) {
      await redis.publish(
        "notifications:global",
        JSON.stringify(buildNotificationPayload(notification)),
      );
      return notification;
    }

    const deliveries = await prisma.$transaction(async (tx) => {
      const rows = await Promise.all(
        recipients.map((recipientId) =>
          tx.notificationDelivery.create({
            data: {
              notificationId: notification.id,
              userId: recipientId,
            },
          }),
        ),
      );
      return rows;
    });

    await Promise.all(
      deliveries.map((delivery) =>
        redis.publish(
          `notifications:user:${delivery.userId}`,
          JSON.stringify(
            buildNotificationPayload({
              ...notification,
              read: false,
              deliveredAt: delivery.deliveredAt,
              deliveryId: delivery.id,
            }),
          ),
        ),
      ),
    );

    return notification;
  }

  static async broadcastToAllUsers(input: BroadcastInput) {
    const { title, message, link, data, createdById } = input;
    const type = normalizeNotificationType(
      input.type ?? NotificationType.SYSTEM,
    );
    const priority = normalizePriority(input.priority);

    const notification = await prisma.notification.create({
      data: {
        type,
        priority,
        title,
        message,
        data: {
          ...data,
          ...(link ? { link } : {}),
        },
        isBroadcast: true,
        createdById: createdById ?? null,
      },
    });

    const users = await prisma.user.findMany({
      select: { id: true },
      where: { status: "active" },
    });

    const deliveries = await prisma.$transaction<NotificationDelivery[]>(
      async (tx) => {
        if (users.length === 0) {
          return [] as NotificationDelivery[];
        }

        await tx.notificationDelivery.createMany({
          data: users.map((u) => ({
            notificationId: notification.id,
            userId: u.id,
          })),
          skipDuplicates: true,
        });

        return tx.notificationDelivery.findMany({
          where: {
            notificationId: notification.id,
          },
        });
      },
    );

    await Promise.all(
      deliveries.map((delivery) =>
        redis.publish(
          `notifications:user:${delivery.userId}`,
          JSON.stringify(
            buildNotificationPayload({
              ...notification,
              read: false,
              deliveredAt: delivery.deliveredAt,
              deliveryId: delivery.id,
            }),
          ),
        ),
      ),
    );

    const broadcastPayload = buildNotificationPayload({
      ...notification,
      read: false,
    });

    await Promise.all([
      redis.publish("notifications:global", JSON.stringify(broadcastPayload)),
      redis.publish("notifications:admin", JSON.stringify(broadcastPayload)),
    ]);

    return notification;
  }

  static async markAsRead(deliveryId: string, userId: string) {
    const delivery = await prisma.notificationDelivery.updateMany({
      where: {
        id: deliveryId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    if (delivery.count > 0) {
      await redis.publish(
        `notifications:user:${userId}`,
        JSON.stringify({
          type: "NOTIFICATION_READ",
          notificationDeliveryId: deliveryId,
          read: true,
        }),
      );
    }

    return delivery.count > 0;
  }

  static async markAllAsRead(userId: string) {
    const updated = await prisma.notificationDelivery.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    if (updated.count > 0) {
      await redis.publish(
        `notifications:user:${userId}`,
        JSON.stringify({
          type: "ALL_NOTIFICATIONS_READ",
        }),
      );
    }

    return updated.count;
  }

  static async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {},
  ) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationDeliveryWhereInput = {
      userId,
      ...(options.unreadOnly ? { readAt: null } : {}),
    };

    const [deliveries, total, unreadCount] = await Promise.all([
      prisma.notificationDelivery.findMany({
        where,
        include: {
          notification: true,
        },
        orderBy: {
          deliveredAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notificationDelivery.count({ where }),
      prisma.notificationDelivery.count({
        where: {
          userId,
          readAt: null,
        },
      }),
    ]);

    const notifications = deliveries.map((delivery) => {
      const payload = buildNotificationPayload({
        ...delivery.notification,
        deliveredAt: delivery.deliveredAt,
        read: Boolean(delivery.readAt),
      });
      return {
        ...payload,
        deliveryId: delivery.id,
      };
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      unreadCount,
    };
  }
}
