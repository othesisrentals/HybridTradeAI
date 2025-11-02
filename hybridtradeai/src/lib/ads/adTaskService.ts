import {
  Prisma,
  AdTaskStatus,
  AdTaskVerificationStatus,
  TransactionStatus,
  TransactionType,
  NotificationType,
  RevenueStreamType,
  InvestmentStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { NotificationService } from "@/lib/notifications/notificationService";

const COMMISSION_FALLBACK = new Prisma.Decimal(0.3);

type Decimal = Prisma.Decimal;

interface StartTaskResult {
  completionId: string;
  adUnitId?: string;
  instructions: string;
}

interface AvailableTaskPayload {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: AdTaskStatus;
  rewardAmount: string;
  commissionRate: string;
  userShare: string;
  platformShare: string;
  metadata: Record<string, unknown> | null;
  isPremium: boolean;
  dailyLimit: number | null;
  cooldownHours: number | null;
  maxCompletions: number | null;
  canComplete: boolean;
}

export class AdTaskService {
  static async getAvailableTasks(userId: string): Promise<AvailableTaskPayload[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        plan: true,
        investments: {
          where: { status: InvestmentStatus.ACTIVE },
          include: { plan: true },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const eligiblePlanIds = this.getEligiblePlanIds(user);
    const allowPremium = Boolean(
      user.plan?.allowPremiumTasks ||
        user.investments?.some((investment) => investment.plan?.allowPremiumTasks),
    );

    const tasks = await prisma.adTask.findMany({
      where: {
        status: AdTaskStatus.ACTIVE,
        AND: [
          {
            OR: [{ startAt: null }, { startAt: { lte: now } }],
          },
          {
            OR: [{ endAt: null }, { endAt: { gte: now } }],
          },
        ],
      },
      include: {
        planAccess: true,
      },
      orderBy: {
        rewardAmount: "desc",
      },
    });

    const filtered = await Promise.all(
      tasks.map(async (task) => {
        if (!allowPremium && task.isPremium) {
          return null;
        }

        if (task.planAccess.length > 0 && eligiblePlanIds.size > 0) {
          const matches = task.planAccess.some((access) => eligiblePlanIds.has(access.planId));
          if (!matches) {
            return null;
          }
        } else if (task.planAccess.length > 0 && eligiblePlanIds.size === 0) {
          return null;
        }

        const canComplete = await this.canUserCompleteTask(userId, task.id);

        if (!canComplete) {
          return {
            task,
            canComplete: false,
          };
        }

        return {
          task,
          canComplete: true,
        };
      }),
    );

    return filtered
      .filter((entry): entry is { task: typeof tasks[number]; canComplete: boolean } => Boolean(entry))
      .map(({ task, canComplete }) => {
        const commission = task.commissionRate ?? COMMISSION_FALLBACK;
        const userShare = task.rewardAmount.mul(new Prisma.Decimal(1).minus(commission));
        const platformShare = task.rewardAmount.mul(commission);

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          status: task.status,
          rewardAmount: task.rewardAmount.toString(),
          commissionRate: commission.toString(),
          userShare: userShare.toString(),
          platformShare: platformShare.toString(),
          metadata: task.metadata as Record<string, unknown> | null,
          isPremium: task.isPremium,
          dailyLimit: task.dailyLimit ?? null,
          cooldownHours: task.cooldownHours ?? null,
          maxCompletions: task.maxCompletions ?? null,
          canComplete,
        } satisfies AvailableTaskPayload;
      });
  }

  static async startTask(userId: string, taskId: string, platform: string = "WEB"): Promise<StartTaskResult> {
    const task = await prisma.adTask.findFirst({
      where: {
        id: taskId,
        status: AdTaskStatus.ACTIVE,
      },
      include: {
        planAccess: true,
      },
    });

    if (!task) {
      throw new Error("Task not available");
    }

    const eligible = await this.canUserCompleteTask(userId, taskId);
    if (!eligible) {
      throw new Error("Task cannot be completed at this time");
    }

    const commission = task.commissionRate ?? COMMISSION_FALLBACK;
    const userShare = task.rewardAmount.mul(new Prisma.Decimal(1).minus(commission));
    const platformShare = task.rewardAmount.mul(commission);

    const completion = await prisma.adTaskCompletion.create({
      data: {
        userId,
        adTaskId: task.id,
        verificationStatus: AdTaskVerificationStatus.PENDING,
        rewardAmount: task.rewardAmount,
        platformShare,
        userShare,
        metadata: {
          platform,
        },
      },
    });

    await this.initializeNetworkTask(task, userId, completion.id);

    return {
      completionId: completion.id,
      adUnitId: (task.metadata as Record<string, unknown> | null)?.adUnitId as string | undefined,
      instructions: this.getTaskInstructions(task.type),
    };
  }

  static async completeTask(completionId: string, verificationData: Record<string, unknown>): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const completion = await tx.adTaskCompletion.findUnique({
        where: { id: completionId },
        include: {
          adTask: true,
        },
      });

      if (!completion) {
        throw new Error("Completion not found");
      }

      if (completion.verificationStatus !== AdTaskVerificationStatus.PENDING) {
        throw new Error("Completion already processed");
      }

      const verified = await this.verifyNetworkCompletion(completion.adTask, verificationData);

      if (!verified) {
        await tx.adTaskCompletion.update({
          where: { id: completionId },
          data: {
            verificationStatus: AdTaskVerificationStatus.REJECTED,
            rejectedReason: "Verification failed",
            metadata: {
              ...completion.metadata,
              verificationData,
            },
          },
        });
        throw new Error("Completion verification failed");
      }

      const now = new Date();
      const cooldownExpiresAt = this.calculateCooldown(completion.adTask, now);

      await tx.adTaskCompletion.update({
        where: { id: completionId },
        data: {
          verificationStatus: AdTaskVerificationStatus.VERIFIED,
          verifiedAt: now,
          completedAt: now,
          metadata: {
            ...completion.metadata,
            verificationData,
          },
          cooldownExpiresAt,
        },
      });

      await tx.user.update({
        where: { id: completion.userId },
        data: {
          withdrawalBalance: {
            increment: completion.userShare,
          },
          totalEarnings: {
            increment: completion.rewardAmount,
          },
        },
      });

      const today = this.getStartOfDay(now);

      await tx.userAdStats.upsert({
        where: {
          userId_date: {
            userId: completion.userId,
            date: today,
          },
        },
        update: {
          completedTasks: {
            increment: 1,
          },
          totalEarnings: {
            increment: completion.userShare,
          },
          platformCommission: {
            increment: completion.platformShare,
          },
          lastUpdatedAt: now,
        },
        create: {
          userId: completion.userId,
          date: today,
          completedTasks: 1,
          totalEarnings: completion.userShare,
          platformCommission: completion.platformShare,
          adMinutesWatched: 0,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: completion.userId,
          type: TransactionType.AD_REWARD,
          status: TransactionStatus.COMPLETED,
          amount: completion.userShare,
          fee: completion.platformShare,
          platformShare: completion.platformShare,
          userShare: completion.userShare,
          reference: `AD-${completionId}`,
          metadata: {
            adTaskId: completion.adTaskId,
            completionId,
          },
          initiatedAt: now,
          processedAt: now,
        },
      });

      await tx.adTaskCompletion.update({
        where: { id: completionId },
        data: {
          payoutTransactionId: transaction.id,
        },
      });

      await this.recordAdRevenue(tx, completion.adTask.id, completion.platformShare, now);

      const userShareFormatted = completion.userShare.toNumber().toFixed(2);

      await NotificationService.createNotification({
        userId: completion.userId,
        type: NotificationType.TASK,
        title: "Task Completed",
        message: `You earned $${userShareFormatted} from ${completion.adTask.title}.`,
        link: "/dashboard/ads",
        data: {
          completionId,
          adTaskId: completion.adTaskId,
        },
      });

      await redis.publish(
        `ads:task:completed:${completion.userId}`,
        JSON.stringify({ completionId, adTaskId: completion.adTaskId }),
      );
    });
  }

  static async handleAdNetworkWebhook(payload: Record<string, unknown>) {
    const completionId = payload["completion_id"] as string | undefined;

    if (!completionId) {
      throw new Error("Missing completion identifier");
    }

    await this.completeTask(completionId, payload);
  }

  private static async canUserCompleteTask(userId: string, taskId: string): Promise<boolean> {
    const task = await prisma.adTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.status !== AdTaskStatus.ACTIVE) {
      return false;
    }

    const now = new Date();
    if (task.startAt && task.startAt > now) {
      return false;
    }
    if (task.endAt && task.endAt < now) {
      return false;
    }

    const todayStart = this.getStartOfDay(now);

    if (task.dailyLimit && task.dailyLimit > 0) {
      const dailyCount = await prisma.adTaskCompletion.count({
        where: {
          userId,
          adTaskId: taskId,
          verificationStatus: AdTaskVerificationStatus.VERIFIED,
          createdAt: {
            gte: todayStart,
          },
        },
      });

      if (dailyCount >= task.dailyLimit) {
        return false;
      }
    }

    if (task.maxCompletions) {
      const totalCount = await prisma.adTaskCompletion.count({
        where: {
          userId,
          adTaskId: taskId,
          verificationStatus: AdTaskVerificationStatus.VERIFIED,
        },
      });

      if (totalCount >= task.maxCompletions) {
        return false;
      }
    }

    const lastCompletion = await prisma.adTaskCompletion.findFirst({
      where: {
        userId,
        adTaskId: taskId,
        verificationStatus: AdTaskVerificationStatus.VERIFIED,
      },
      orderBy: { completedAt: "desc" },
    });

    if (lastCompletion?.cooldownExpiresAt && lastCompletion.cooldownExpiresAt > now) {
      return false;
    }

    return true;
  }

  private static getEligiblePlanIds(user: Awaited<ReturnType<typeof prisma.user.findUnique>>) {
    const ids = new Set<string>();

    if (user?.planId) {
      ids.add(user.planId);
    }

    user?.investments?.forEach((investment) => {
      if (investment.planId) {
        ids.add(investment.planId);
      }
    });

    return ids;
  }

  private static getStartOfDay(date: Date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  private static calculateCooldown(task: { cooldownHours: number | null }, reference: Date) {
    if (!task.cooldownHours || task.cooldownHours <= 0) {
      return null;
    }

    const next = new Date(reference);
    next.setHours(next.getHours() + task.cooldownHours);
    return next;
  }

  private static getTaskInstructions(type: string) {
    switch (type) {
      case "VIDEO":
      case "VIDEO_AD":
        return "Watch the video advertisement entirely to receive your reward.";
      case "SURVEY":
        return "Complete the survey with accurate information to qualify for rewards.";
      case "INSTALL":
      case "APP_INSTALL":
        return "Install and open the partnered application to complete this task.";
      case "OFFERWALL":
        return "Pick an offer from the wall and follow the partner instructions.";
      default:
        return "Follow the task instructions carefully to receive your reward.";
    }
  }

  private static async initializeNetworkTask(
    task: { id: string },
    userId: string,
    completionId: string,
  ) {
    console.info(`Initializing ad task ${task.id} for user ${userId} (completion ${completionId})`);
  }

  private static async verifyNetworkCompletion(
    task: { id: string },
    verificationData: Record<string, unknown>,
  ): Promise<boolean> {
    if (typeof verificationData?.success === "boolean") {
      return verificationData.success;
    }
    return true;
  }

  private static async recordAdRevenue(
    tx: Prisma.TransactionClient,
    adTaskId: string,
    platformShare: Decimal,
    timestamp: Date,
  ) {
    const stream = await tx.revenueStream.findFirst({
      where: {
        type: RevenueStreamType.ADVERTISING_TASKS,
      },
    });

    if (!stream) {
      return;
    }

    const metrics = (stream.metrics as Record<string, unknown> | null) ?? {};
    const total = new Prisma.Decimal(metrics.totalRevenue ?? 0).add(platformShare);

    await tx.revenueStream.update({
      where: { id: stream.id },
      data: {
        metrics: {
          ...metrics,
          totalRevenue: total.toString(),
          lastRecordedAt: timestamp.toISOString(),
          lastAdTaskId: adTaskId,
        },
      },
    });
  }
}
