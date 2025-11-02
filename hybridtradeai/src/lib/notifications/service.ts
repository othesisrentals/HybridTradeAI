import { Prisma } from "@prisma/client";

import {
  NotificationChannel,
  NotificationType,
  PrismaClient,
} from "@prisma/client";

import { prisma } from "../db/client";
import { getRedisPublisher } from "../redis/client";

const CHANNEL_PREFIX = "notifications";
const USER_CHANNEL = (userId: string) => `${CHANNEL_PREFIX}:user:${userId}`;
const BROADCAST_CHANNEL = `${CHANNEL_PREFIX}:broadcast`;
const ADMIN_CHANNEL = `${CHANNEL_PREFIX}:admin`;

export interface PublishNotificationPayload {
  id: string;
  userId?: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  data?: Prisma.JsonValue;
  expiresAt?: Date | null;
  persist?: boolean;
}

export async function createNotification(
  input: CreateNotificationInput,
  client: PrismaClient = prisma,
) {
  const {
    userId,
    title,
    message,
    type = NotificationType.SYSTEM,
    channel = NotificationChannel.IN_APP,
    data,
    expiresAt,
    persist = true,
  } = input;

  if (!userId && channel === NotificationChannel.IN_APP) {
    throw new Error("IN_APP notifications require a userId");
  }

  const notification = persist
    ? await client.notification.create({
        data: {
          userId: userId ?? null,
          title,
          message,
          type,
          channel,
          data,
          expiresAt: expiresAt ?? null,
        },
      })
    : {
        id: `tmp_${Date.now()}`,
        userId: userId ?? null,
        title,
        message,
        type,
        channel,
        data,
        expiresAt: expiresAt ?? null,
        readAt: null,
        dispatchedAt: new Date(),
        createdAt: new Date(),
      };

  await publishNotification({
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    channel: notification.channel,
    data: notification.data as Record<string, unknown> | null,
    createdAt: notification.createdAt.toISOString?.() ?? new Date().toISOString(),
  });

  return notification;
}

export async function publishNotification(payload: PublishNotificationPayload) {
  const publisher = getRedisPublisher();

  const serialized = JSON.stringify(payload);

  if (payload.userId) {
    await publisher.publish(USER_CHANNEL(payload.userId), serialized);
  } else {
    await publisher.publish(BROADCAST_CHANNEL, serialized);
  }
}

export async function publishAdminBroadcast(
  payload: Omit<PublishNotificationPayload, "channel">,
) {
  const publisher = getRedisPublisher();
  const message: PublishNotificationPayload = {
    ...payload,
    channel: NotificationChannel.IN_APP,
  };

  await publisher.publish(ADMIN_CHANNEL, JSON.stringify(message));
}

export function notificationChannelKeys(userId: string) {
  return {
    userChannel: USER_CHANNEL(userId),
    broadcastChannel: BROADCAST_CHANNEL,
    adminChannel: ADMIN_CHANNEL,
  };
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
  client: PrismaClient = prisma,
) {
  return client.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function fetchRecentNotifications(
  userId: string,
  limit = 20,
) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
