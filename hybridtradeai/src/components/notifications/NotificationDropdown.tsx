"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, ExternalLink, Loader2 } from "lucide-react";

import { useUserNotifications } from "@/hooks/useUserNotifications";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useUserNotifications();

  const handleNotificationClick = async (notification: {
    deliveryId?: string;
    link?: string;
  }) => {
    if (notification.deliveryId) {
      try {
        await markAsRead(notification.deliveryId);
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    }

    if (notification.link) {
      window.location.href = notification.link;
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  return (
    <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
          >
            Mark all as read
          </button>
        ) : null}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 10).map((notification) => (
              <button
                type="button"
                key={`${notification.id}-${notification.deliveryId ?? "broadcast"}`}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                  notification.read ? "bg-white" : "bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </h4>
                      {notification.link ? (
                        <ExternalLink className="ml-2 h-3 w-3 text-gray-400" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <span className="mt-2 block text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {!notification.read ? (
                    <span className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="border-t border-gray-200 p-4">
          <a
            href="/dashboard/notifications"
            className="block text-center text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
          >
            View all notifications
          </a>
        </div>
      ) : null}
    </div>
  );
}
