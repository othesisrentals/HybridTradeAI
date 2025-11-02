import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { SSEHandler } from "@/lib/notifications/sseHandler";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || !ADMIN_ROLES.has(user.role)) {
    return new Response("Unauthorized", { status: 401 });
  }

  return SSEHandler.handleAdminStream(request);
}
