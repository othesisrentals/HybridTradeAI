import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "../../../../lib/auth/options";
import { markNotificationAsRead } from "../../../../lib/notifications/service";

export const runtime = "nodejs";

const markReadSchema = z.object({
  notificationId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const parsed = markReadSchema.safeParse(payload);

  if (!parsed.success) {
    return new Response(parsed.error.message, { status: 422 });
  }

  await markNotificationAsRead(userId, parsed.data.notificationId);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
