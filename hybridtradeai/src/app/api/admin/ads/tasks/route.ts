import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { AdTaskStatus, Prisma } from "@prisma/client";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const {
    title,
    description,
    type,
    rewardAmount,
    commissionRate,
    status = AdTaskStatus.ACTIVE,
    dailyLimit,
    cooldownHours,
    maxCompletions,
    isPremium,
    metadata,
    planIds,
  } = body ?? {};

  if (!title || !type || rewardAmount === undefined) {
    return NextResponse.json(
      { error: "title, type and rewardAmount are required" },
      { status: 400 },
    );
  }

  const baseSlug = slugify(title);
  const slug = baseSlug || `task-${Date.now()}`;

  try {
    const task = await prisma.adTask.create({
      data: {
        title,
        slug,
        description,
        type,
        status,
        rewardAmount: new Prisma.Decimal(rewardAmount),
        commissionRate: commissionRate
          ? new Prisma.Decimal(commissionRate)
          : undefined,
        dailyLimit,
        cooldownHours,
        maxCompletions,
        isPremium,
        metadata,
        createdById: user.id,
        planAccess: planIds?.length
          ? {
              createMany: {
                data: planIds.map((planId: string) => ({ planId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        planAccess: true,
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to create ad task", error);
    const message = error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || !ADMIN_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const limit = Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20;
  const statusFilter = searchParams.get("status") as AdTaskStatus | null;

  const where = statusFilter ? { status: statusFilter } : undefined;

  const [tasks, total] = await Promise.all([
    prisma.adTask.findMany({
      where,
      include: {
        planAccess: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: { completions: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.adTask.count({ where }),
  ]);

  return NextResponse.json({
    tasks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
