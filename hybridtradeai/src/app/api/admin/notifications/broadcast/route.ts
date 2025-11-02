import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { NotificationService } from "@/lib/notifications/notificationService";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = body?.title as string | undefined;
    const message = body?.message as string | undefined;
    const type = body?.type as string | undefined;
    const link = body?.link as string | undefined;
    const data = body?.data as Record<string, unknown> | undefined;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 },
      );
    }

    const notification = await NotificationService.broadcastToAllUsers({
      title,
      message,
      type,
      link,
      data,
      createdById: user.id,
    });

    await prisma.auditLog.create({
      data: {
        action: "BROADCAST_NOTIFICATION",
        entity: "Notification",
        entityId: notification.id,
        actorId: user.id,
        description: `Broadcast notification: ${title}`,
        after: {
          title,
          message,
          type,
          link,
          data,
        },
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Broadcast notification failed", error);
    return NextResponse.json(
      { error: "Broadcast failed" },
      { status: 500 },
    );
  }
}
