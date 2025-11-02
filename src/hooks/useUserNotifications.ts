'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export function useUnreadNotificationCount() {
  const { data: session } = useSession()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!session?.user) return

    const fetchCount = async () => {
      try {
        const response = await fetch('/api/notifications?unreadOnly=true&limit=1')
        const data = await response.json()
        setCount(data.total || 0)
      } catch (error) {
        console.error('Failed to fetch notification count:', error)
      }
    }

    fetchCount()

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource('/api/notifications/sse')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_notification' || data.type === 'broadcast_notification') {
        fetchCount()
      } else if (data.type === 'notification_read') {
        fetchCount()
      } else if (data.type === 'unread_count') {
        setCount(data.count || 0)
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [session])

  return { count }
}

export function useNotifications(options?: { limit?: number; unreadOnly?: boolean }) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.unreadOnly) params.set('unreadOnly', 'true')

      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()
      setNotifications(data.notifications || [])
      setHasMore(data.hasMore || false)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [session, options])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  return {
    notifications,
    loading,
    hasMore,
    refetch: fetchNotifications,
    markAsRead,
  }
}
