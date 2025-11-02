import { redis } from "@/lib/redis";
import { NotificationService } from "./notificationService";

const HEARTBEAT_INTERVAL = 25_000;

export class SSEHandler {
  static async handleUserStream(userId: string, request: Request) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const subscriber = redis.duplicate();

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        }, HEARTBEAT_INTERVAL);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "CONNECTED",
              message: "Notification stream connected",
            })}\n\n`,
          ),
        );

        try {
          const { unreadCount } = await NotificationService.getUserNotifications(
            userId,
            { limit: 1 },
          );

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "UNREAD_COUNT",
                unreadCount,
              })}\n\n`,
            ),
          );

          const messageHandler = (_: string, message: string) => {
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          };

          subscriber.on("message", messageHandler);

          await subscriber.subscribe(`notifications:user:${userId}`);

          request.signal.addEventListener("abort", () => {
            clearInterval(heartbeat);
            subscriber.removeListener("message", messageHandler);
            subscriber.unsubscribe();
            subscriber.disconnect();
            controller.close();
          });
        } catch (error) {
          console.error("User SSE stream error", error);
          clearInterval(heartbeat);
          subscriber.disconnect();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  static async handleAdminStream(request: Request) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const subscriber = redis.duplicate();

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        }, HEARTBEAT_INTERVAL);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "ADMIN_CONNECTED",
              message: "Admin notification stream connected",
            })}\n\n`,
          ),
        );

        const messageHandler = (channel: string, message: string) => {
          try {
            const parsed = JSON.parse(message);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ channel, ...parsed })}\n\n`,
              ),
            );
          } catch (error) {
            console.error("Failed to parse admin notification message", error);
          }
        };

        try {
          subscriber.on("message", messageHandler);
          await subscriber.subscribe("notifications:admin");
          await subscriber.subscribe("notifications:global");

          request.signal.addEventListener("abort", () => {
            clearInterval(heartbeat);
            subscriber.removeListener("message", messageHandler);
            subscriber.unsubscribe();
            subscriber.disconnect();
            controller.close();
          });
        } catch (error) {
          console.error("Admin SSE stream error", error);
          clearInterval(heartbeat);
          subscriber.disconnect();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }
}
