'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Notification as PrismaNotification } from '@prisma/client';

export interface NotificationEvent {
  type: 'notification' | 'broadcast';
  data: PrismaNotification;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<PrismaNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    const connectSSE = () => {
      const eventSource = new EventSource('/api/notifications/stream');

      eventSource.addEventListener('connected', () => {
        console.log('Connected to notification stream');
        setIsConnected(true);
      });

      eventSource.addEventListener('notification', (event) => {
        try {
          const notification: PrismaNotification = JSON.parse(event.data);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          
          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/icon.png',
            });
          }
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      });

      eventSource.addEventListener('broadcast', (event) => {
        try {
          const notification: PrismaNotification = JSON.parse(event.data);
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        } catch (error) {
          console.error('Failed to parse broadcast:', error);
        }
      });

      eventSource.addEventListener('keepalive', () => {
        // Keep connection alive
      });

      eventSource.onerror = () => {
        console.error('SSE connection error, reconnecting...');
        setIsConnected(false);
        eventSource.close();
        
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };

      eventSourceRef.current = eventSource;
    };

    connectSSE();
    fetchNotifications();
    fetchUnreadCount();

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}

