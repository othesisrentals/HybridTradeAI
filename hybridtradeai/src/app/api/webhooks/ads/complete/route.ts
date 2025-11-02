import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AdTaskService } from "@/lib/ads/adTaskService";

export async function POST(request: NextRequest) {
  // TODO: validate webhook signature once network integration is configured.
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await AdTaskService.handleAdNetworkWebhook(payload as Record<string, unknown>);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ad task webhook processing failed", error);
    const message = error instanceof Error ? error.message : "Completion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
