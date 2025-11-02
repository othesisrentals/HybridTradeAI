import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { AdTaskService } from "@/lib/ads/adTaskService";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tasks = await AdTaskService.getAvailableTasks(user.id);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to fetch ad tasks", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
