import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { NotificationService } from "@/lib/notifications/notificationService";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const limit = Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20;
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  try {
    const result = await NotificationService.getUserNotifications(user.id, {
      page,
      limit,
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch user notifications", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const deliveryId = body?.deliveryId as string | undefined;

    if (!deliveryId) {
      return NextResponse.json(
        { error: "deliveryId is required" },
        { status: 400 },
      );
    }

    await NotificationService.markAsRead(deliveryId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await NotificationService.markAllAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notifications as read", error);
    return NextResponse.json(
      { error: "Failed to mark all as read" },
      { status: 500 },
    );
  }
}
