import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { SSEHandler } from "@/lib/notifications/sseHandler";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return SSEHandler.handleUserStream(user.id, request);
}
