import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getUnreadNotificationCount } from '@/lib/notifications/notifications'

/**
 * Server-Sent Events endpoint for real-time notifications
 * Implements cross-tab synchronization using Redis pub/sub
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const channel = `user:${userId}:notifications`

  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection message
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      send(JSON.stringify({ type: 'connected', userId }))

      // Send initial unread count
      try {
        const unreadCount = await getUnreadNotificationCount(userId)
        send(JSON.stringify({ type: 'unread_count', count: unreadCount }))
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }

      // Lazy import Redis to avoid build-time issues
      let redisSubscriber
      try {
        const { redisSubscriber: subscriber } = await import('@/lib/redis/client')
        redisSubscriber = subscriber
      } catch (error) {
        console.error('Redis not available:', error)
        controller.close()
        return
      }

      // Subscribe to Redis channel
      redisSubscriber.subscribe(channel)

      const messageHandler = (ch: string, message: string) => {
        if (ch === channel) {
          try {
            send(message)
          } catch (error) {
            console.error('Error sending SSE message:', error)
          }
        }
      }

      redisSubscriber.on('message', messageHandler)

      // Subscribe to broadcast channel for admin broadcasts
      const broadcastChannel = 'broadcast:notifications'
      redisSubscriber.subscribe(broadcastChannel)

      const broadcastHandler = (ch: string, message: string) => {
        if (ch === broadcastChannel) {
          try {
            send(message)
          } catch (error) {
            console.error('Error sending broadcast message:', error)
          }
        }
      }

      redisSubscriber.on('message', broadcastHandler)

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
        } catch (error) {
          clearInterval(heartbeatInterval)
        }
      }, 30000)

      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        redisSubscriber.unsubscribe(channel)
        redisSubscriber.unsubscribe(broadcastChannel)
        redisSubscriber.removeListener('message', messageHandler)
        redisSubscriber.removeListener('message', broadcastHandler)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}

