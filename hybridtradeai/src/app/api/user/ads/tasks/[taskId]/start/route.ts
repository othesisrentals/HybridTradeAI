import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { AdTaskService } from "@/lib/ads/adTaskService";

export async function POST(
  request: NextRequest,
  context: { params: { taskId: string } },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const platform = typeof body?.platform === "string" ? body.platform : "WEB";

  try {
    const result = await AdTaskService.startTask(user.id, context.params.taskId, platform);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to start ad task", error);
    const message = error instanceof Error ? error.message : "Failed to start task";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
