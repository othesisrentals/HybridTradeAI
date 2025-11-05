import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { logger } from '@/lib/utils/logger';

/**
 * Server-Sent Events endpoint for real-time notifications
 * Supports cross-tab synchronization via Redis pub/sub
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = user.id;

    // Create readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection message
        const send = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        send('connected', { message: 'Connected to notification stream' });

        // Lazy import Redis to avoid build-time issues
        let redisSubscriber;
        try {
          const { redisSubscriber: subscriber } = await import('@/lib/redis/client');
          redisSubscriber = subscriber;
        } catch (error) {
          logger.error('Redis not available for SSE stream');
          controller.close();
          return;
        }

        // Subscribe to user-specific notifications
        const userChannel = `user:${userId}:notifications`;
        const broadcastChannel = 'notifications:broadcast';

        const subscriber = redisSubscriber.duplicate();
        await subscriber.subscribe(userChannel, broadcastChannel);

        subscriber.on('message', (channel, message) => {
          try {
            const data = JSON.parse(message);

            if (data.type === 'notification') {
              send('notification', data.data);
            } else if (data.type === 'broadcast') {
              send('broadcast', data.data);
            }
          } catch (error) {
            logger.error('Error parsing notification message', error);
          }
        });

        // Send keepalive every 30 seconds
        const keepAliveInterval = setInterval(() => {
          try {
            send('keepalive', { timestamp: Date.now() });
          } catch (error) {
            clearInterval(keepAliveInterval);
          }
        }, 30000);

        // Cleanup on connection close
        req.signal.addEventListener('abort', async () => {
          clearInterval(keepAliveInterval);
          await subscriber.unsubscribe();
          await subscriber.quit();
          controller.close();
          logger.debug('SSE connection closed', { userId });
        });

        logger.debug('SSE connection established', { userId });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    logger.error('SSE connection error', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

