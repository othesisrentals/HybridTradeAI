import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type NotificationType =
  | "SYSTEM"
  | "FINANCIAL"
  | "TASK"
  | "ALERT";

type NotificationChannel = "IN_APP" | "EMAIL" | "SMS";

export interface ClientNotification {
  id: string;
  userId?: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  createdAt: string;
  readAt?: string | null;
}

interface BroadcastPayload {
  type: "hydrate" | "notification" | "leader" | "leader-release";
  payload?: unknown;
  leaderId?: string;
}

const BROADCAST_CHANNEL = "hybridtradeai:notifications";
const LEADER_STORAGE_KEY = "hybridtradeai:notifications:leader";

const isBrowser = typeof window !== "undefined";

function normalizeNotification(data: unknown): ClientNotification | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as Record<string, unknown>;
  if (typeof candidate.id !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    userId:
      typeof candidate.userId === "string" || candidate.userId === null
        ? (candidate.userId as string | null)
        : undefined,
    type: (candidate.type as NotificationType) ?? "SYSTEM",
    channel: (candidate.channel as NotificationChannel) ?? "IN_APP",
    title: (candidate.title as string) ?? "",
    message: (candidate.message as string) ?? "",
    data:
      typeof candidate.data === "object" && candidate.data !== null
        ? (candidate.data as Record<string, unknown>)
        : undefined,
    createdAt: (candidate.createdAt as string) ?? new Date().toISOString(),
    readAt: (candidate.readAt as string | null) ?? null,
  };
}

function mergeNotifications(
  current: ClientNotification[],
  incoming: ClientNotification[] | ClientNotification,
): ClientNotification[] {
  const array = Array.isArray(incoming) ? incoming : [incoming];
  const map = new Map(current.map((notification) => [notification.id, notification]));

  for (const notification of array) {
    if (!notification) continue;
    map.set(notification.id, {
      ...map.get(notification.id),
      ...notification,
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export interface UseUserNotificationsResult {
  notifications: ClientNotification[];
  unreadCount: number;
  isLeader: boolean;
  connected: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
}

export function useUserNotifications(): UseUserNotificationsResult {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const instanceId = useMemo(() => (isBrowser ? crypto.randomUUID() : "server"), []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  const broadcast = useCallback(
    (message: BroadcastPayload) => {
      if (!broadcastRef.current) return;
      broadcastRef.current.postMessage({ ...message, sourceId: instanceId });
    },
    [instanceId],
  );

  const stopLeaderConnection = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setConnected(false);
  }, []);

  const startLeaderConnection = useCallback(() => {
    if (!isBrowser || eventSourceRef.current) {
      return;
    }

    const source = new EventSource("/api/notifications/sse", {
      withCredentials: true,
    });

    source.addEventListener("ready", () => {
      setConnected(true);
    });

    source.addEventListener("hydrate", (event) => {
      try {
        const payload = JSON.parse(event.data) as { notifications: unknown[] };
        const mapped = payload.notifications
          .map((item) => normalizeNotification(item))
          .filter((notification): notification is ClientNotification => Boolean(notification));
        setNotifications((current) => mergeNotifications(current, mapped));
        broadcast({ type: "hydrate", payload: mapped });
      } catch (error) {
        console.error("Failed to hydrate notifications", error);
      }
    });

    source.addEventListener("notification", (event) => {
      try {
        const payload = JSON.parse(event.data) as { payload?: unknown };
        const notification = normalizeNotification(payload.payload);
        if (!notification) return;
        setNotifications((current) => mergeNotifications(current, notification));
        broadcast({ type: "notification", payload: notification });
      } catch (error) {
        console.error("Failed to process notification event", error);
      }
    });

    source.addEventListener("ping", () => {
      setConnected(true);
    });

    source.onerror = (error) => {
      console.error("Notification SSE error", error);
      setConnected(false);
    };

    eventSourceRef.current = source;
  }, [broadcast]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    broadcastRef.current = channel;

    const handleBroadcast = (event: MessageEvent<BroadcastPayload & { sourceId?: string }>) => {
      const { data } = event;
      if (!data || data.sourceId === instanceId) {
        return;
      }

      if (data.type === "leader") {
        const leaderId = data.leaderId;
        if (leaderId && leaderId !== instanceId) {
          setIsLeader(false);
          stopLeaderConnection();
        }
        return;
      }

      if (data.type === "leader-release") {
        if (localStorage.getItem(LEADER_STORAGE_KEY) === data.leaderId) {
          localStorage.removeItem(LEADER_STORAGE_KEY);
        }
        return;
      }

      if (data.type === "hydrate") {
        const notificationsPayload = Array.isArray(data.payload)
          ? (data.payload as ClientNotification[])
          : [];
        setNotifications((current) => mergeNotifications(current, notificationsPayload));
        return;
      }

      if (data.type === "notification") {
        const notification = normalizeNotification(data.payload);
        if (!notification) return;
        setNotifications((current) => mergeNotifications(current, notification));
      }
    };

    channel.addEventListener("message", handleBroadcast);

    return () => {
      channel.removeEventListener("message", handleBroadcast as EventListener);
      channel.close();
      broadcastRef.current = null;
    };
  }, [instanceId, stopLeaderConnection]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const attemptLeadership = () => {
      const currentLeader = localStorage.getItem(LEADER_STORAGE_KEY);
      if (!currentLeader) {
        localStorage.setItem(LEADER_STORAGE_KEY, instanceId);
        const confirmed = localStorage.getItem(LEADER_STORAGE_KEY) === instanceId;
        if (confirmed) {
          setIsLeader(true);
          startLeaderConnection();
          broadcast({ type: "leader", leaderId: instanceId });
        }
        return confirmed;
      }

      if (currentLeader === instanceId) {
        setIsLeader(true);
        startLeaderConnection();
        return true;
      }

      setIsLeader(false);
      stopLeaderConnection();
      return false;
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LEADER_STORAGE_KEY) {
        return;
      }

      if (event.newValue === instanceId) {
        setIsLeader(true);
        startLeaderConnection();
        broadcast({ type: "leader", leaderId: instanceId });
      } else if (!event.newValue) {
        void attemptLeadership();
      } else {
        setIsLeader(false);
        stopLeaderConnection();
      }
    };

    window.addEventListener("storage", handleStorage);

    if (!attemptLeadership()) {
      broadcast({ type: "leader", leaderId: localStorage.getItem(LEADER_STORAGE_KEY) ?? undefined });
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (localStorage.getItem(LEADER_STORAGE_KEY) === instanceId) {
        localStorage.removeItem(LEADER_STORAGE_KEY);
        broadcast({ type: "leader-release", leaderId: instanceId });
      }
      stopLeaderConnection();
    };
  }, [broadcast, instanceId, startLeaderConnection, stopLeaderConnection]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification,
        ),
      );

      try {
        const response = await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to mark notification as read (${response.status})`);
        }
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    },
    [],
  );

  return {
    notifications,
    unreadCount,
    isLeader,
    connected,
    markAsRead,
  };
}
