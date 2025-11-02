import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth/options";
import {
  fetchRecentNotifications,
  notificationChannelKeys,
} from "../../../../lib/notifications/service";
import { getRedisSubscriber } from "../../../../lib/redis/client";

export const runtime = "nodejs";
export const revalidate = 0;

const encoder = new TextEncoder();

function formatSSE(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { userChannel, broadcastChannel, adminChannel } = notificationChannelKeys(userId);
  const channels = [userChannel, broadcastChannel, adminChannel];

  const subscriber = getRedisSubscriber().duplicate();
  await subscriber.connect();

  const keepAliveMs = 25_000;

  const initialNotifications = await fetchRecentNotifications(userId, 50);

  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let abortListener: (() => void) | undefined;
  let handleMessage: ((channel: string, message: string) => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(formatSSE(event, payload));
      };

      send("hydrate", {
        notifications: initialNotifications,
        timestamp: Date.now(),
      });

      handleMessage = (channel: string, message: string) => {
        try {
          const parsed = JSON.parse(message);
          send("notification", {
            channel,
            payload: parsed,
          });
        } catch (error) {
          console.error("Failed to parse notification payload", error);
        }
      };

      subscriber.on("message", handleMessage);
      await subscriber.subscribe(...channels);

      heartbeat = setInterval(() => {
        controller.enqueue(formatSSE("ping", { at: Date.now() }));
      }, keepAliveMs);

      const abortSignal = request.signal;

      abortListener = () => {
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = undefined;
        }
        if (handleMessage) {
          subscriber.off("message", handleMessage);
        }
        subscriber
          .unsubscribe(...channels)
          .finally(() => subscriber.disconnect())
          .catch((error) => console.error("Failed to unsubscribe from Redis", error));
        controller.close();
      };

      abortSignal.addEventListener("abort", abortListener);

      controller.enqueue(formatSSE("ready", { at: Date.now() }));
    },
    cancel: async () => {
      if (abortListener) {
        request.signal.removeEventListener("abort", abortListener);
      }
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = undefined;
      }
      if (handleMessage) {
        subscriber.off("message", handleMessage);
      }
      await subscriber.unsubscribe(...channels);
      await subscriber.disconnect();
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
