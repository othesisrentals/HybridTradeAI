"use client";

import { useCallback } from "react";
import { useSyncExternalStore } from "react";

interface NotificationPayload {
  id: string;
  deliveryId?: string;
  type: string;
  priority?: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  deliveredAt?: string;
  read: boolean;
}

interface NotificationState {
  notifications: NotificationPayload[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const DEFAULT_STATE: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null,
  initialized: false,
};

type Listener = () => void;

interface NotificationStore {
  state: NotificationState;
  listeners: Set<Listener>;
  eventSource: EventSource | null;
  subscriberCount: number;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
}

const store: NotificationStore = {
  state: DEFAULT_STATE,
  listeners: new Set(),
  eventSource: null,
  subscriberCount: 0,
  reconnectTimeout: null,
};

function setState(partial: Partial<NotificationState>) {
  store.state = {
    ...store.state,
    ...partial,
  };

  store.listeners.forEach((listener) => listener());
}

async function fetchNotifications() {
  try {
    setState({ loading: true, error: null });
    const response = await fetch("/api/user/notifications?limit=50", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();

    setState({
      notifications: data.notifications ?? [],
      unreadCount: data.unreadCount ?? 0,
      loading: false,
      error: null,
      initialized: true,
    });
  } catch (error) {
    console.error("Notification fetch failed", error);
    setState({
      loading: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function handleSSEMessage(event: MessageEvent<string>) {
  if (!event.data) {
    return;
  }

  try {
    const payload = JSON.parse(event.data) as {
      type?: string;
      unreadCount?: number;
      notificationDeliveryId?: string;
    } & NotificationPayload;

    switch (payload.type) {
      case "UNREAD_COUNT":
        if (typeof payload.unreadCount === "number") {
          setState({ unreadCount: payload.unreadCount });
        }
        break;
      case "NOTIFICATION_READ":
        if (payload.notificationDeliveryId) {
          setState({
            notifications: store.state.notifications.map((notification) =>
              notification.deliveryId === payload.notificationDeliveryId
                ? { ...notification, read: true }
                : notification,
            ),
            unreadCount: Math.max(store.state.unreadCount - 1, 0),
          });
        }
        break;
      case "ALL_NOTIFICATIONS_READ":
        setState({
          notifications: store.state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        });
        break;
      default: {
        if (!payload.id) {
          return;
        }

        const exists = store.state.notifications.find((notification) => {
          if (notification.deliveryId && payload.deliveryId) {
            return notification.deliveryId === payload.deliveryId;
          }
          return notification.id === payload.id;
        });

        const nextNotifications = exists
          ? store.state.notifications.map((notification) =>
              notification.deliveryId && payload.deliveryId
                ? notification.deliveryId === payload.deliveryId
                  ? { ...notification, ...payload, read: false }
                  : notification
                : notification.id === payload.id
                ? { ...notification, ...payload, read: false }
                : notification,
            )
          : [
              {
                ...payload,
                read: payload.read ?? false,
              },
              ...store.state.notifications,
            ];

        setState({
          notifications: nextNotifications,
          unreadCount: exists
            ? store.state.unreadCount
            : store.state.unreadCount + (payload.read ? 0 : 1),
        });
      }
    }
  } catch (error) {
    console.error("Failed to process SSE message", error);
  }
}

function ensureEventSource() {
  if (store.eventSource) {
    return;
  }

  store.eventSource = new EventSource("/api/user/notifications/stream");
  store.eventSource.onmessage = handleSSEMessage;
  store.eventSource.onerror = () => {
    store.eventSource?.close();
    store.eventSource = null;

    if (store.reconnectTimeout) {
      clearTimeout(store.reconnectTimeout);
    }

    store.reconnectTimeout = setTimeout(() => {
      ensureEventSource();
    }, 5000);
  };
}

function cleanupEventSource() {
  if (store.eventSource) {
    store.eventSource.close();
    store.eventSource = null;
  }

  if (store.reconnectTimeout) {
    clearTimeout(store.reconnectTimeout);
    store.reconnectTimeout = null;
  }
}

function subscribeStore(listener: Listener) {
  store.subscriberCount += 1;
  store.listeners.add(listener);

  if (!store.state.initialized) {
    fetchNotifications();
  }

  ensureEventSource();

  return () => {
    store.listeners.delete(listener);
    store.subscriberCount = Math.max(0, store.subscriberCount - 1);

    if (store.subscriberCount === 0) {
      cleanupEventSource();
    }
  };
}

function getSnapshot() {
  return store.state;
}

function getServerSnapshot() {
  return DEFAULT_STATE;
}

async function markDeliveryAsRead(deliveryId: string) {
  try {
    const response = await fetch("/api/user/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deliveryId }),
    });

    if (!response.ok) {
      throw new Error("Failed to mark notification as read");
    }

    setState({
      notifications: store.state.notifications.map((notification) =>
        notification.deliveryId === deliveryId
          ? { ...notification, read: true }
          : notification,
      ),
      unreadCount: Math.max(store.state.unreadCount - 1, 0),
    });
  } catch (error) {
    console.error("Failed to mark notification as read", error);
    throw error;
  }
}

async function markAllDeliveriesAsRead() {
  try {
    const response = await fetch("/api/user/notifications", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to mark notifications as read");
    }

    setState({
      notifications: store.state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read", error);
    throw error;
  }
}

export function useUserNotifications() {
  const state = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);

  const markAsRead = useCallback(async (deliveryId: string) => {
    if (!deliveryId) {
      return;
    }
    await markDeliveryAsRead(deliveryId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllDeliveriesAsRead();
  }, []);

  const refetch = useCallback(async () => {
    await fetchNotifications();
  }, []);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
