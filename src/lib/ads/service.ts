import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/redis/client';
import { RedisKeys } from '@/lib/redis/keys';
import { AdTaskType, AdTaskStatus, TransactionType, TransactionStatus, NotificationType } from '@prisma/client';
import { notificationService } from '@/lib/notifications/service';
import { logger } from '@/lib/utils/logger';
import { AppError, RateLimitError } from '@/lib/utils/errors';
import { getDateString } from '@/lib/utils/date';

const AD_PLATFORM_FEE_PERCENT = parseFloat(process.env.AD_PLATFORM_FEE_PERCENT || '30');

export class AdTaskService {
  /**
   * Get available tasks for a user
   */
  async getAvailableTasks(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        investments: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Determine user's highest plan
    const plans = user.investments.map((inv) => inv.plan);
    const hasPro = plans.some((p) => p.type === 'PRO');
    const hasElite = plans.some((p) => p.type === 'ELITE');

    // Get active tasks
    const tasks = await prisma.adTask.findMany({
      where: {
        status: AdTaskStatus.ACTIVE,
        OR: [
          { minPlanType: null },
          { minPlanType: 'STARTER' },
          ...(hasPro ? [{ minPlanType: 'PRO' as const }] : []),
          ...(hasElite ? [{ minPlanType: 'ELITE' as const }] : []),
        ],
      },
      orderBy: { totalReward: 'desc' },
    });

    // Check availability for each task
    const tasksWithAvailability = await Promise.all(
      tasks.map(async (task) => {
        const isAvailable = await this.isTaskAvailable(userId, task.id);
        const cooldownRemaining = await this.getCooldownRemaining(userId, task.id);
        const dailyCompletions = await this.getDailyCompletions(userId, task.id);

        return {
          ...task,
          isAvailable,
          cooldownRemaining,
          dailyCompletions,
          dailyLimitReached: dailyCompletions >= task.dailyLimit,
        };
      })
    );

    return tasksWithAvailability;
  }

  /**
   * Check if a task is available for a user
   */
  async isTaskAvailable(userId: string, taskId: string): Promise<boolean> {
    // Check cooldown
    const cooldownKey = RedisKeys.adTaskCooldown(userId, taskId);
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) return false;

    // Check daily limit
    const dailyCompletions = await this.getDailyCompletions(userId, taskId);
    const task = await prisma.adTask.findUnique({ where: { id: taskId } });
    if (!task) return false;

    if (dailyCompletions >= task.dailyLimit) return false;

    return true;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  async getCooldownRemaining(userId: string, taskId: string): Promise<number> {
    const cooldownKey = RedisKeys.adTaskCooldown(userId, taskId);
    const ttl = await redis.ttl(cooldownKey);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Get daily completions count
   */
  async getDailyCompletions(userId: string, taskId: string): Promise<number> {
    const dateStr = getDateString();
    const limitKey = RedisKeys.adTaskDailyLimit(userId, taskId, dateStr);
    const count = await redis.get(limitKey);
    return count ? parseInt(count) : 0;
  }

  /**
   * Complete an ad task
   */
  async completeTask(
    userId: string,
    taskId: string,
    verificationData?: any
  ) {
    // Check if task is available
    const isAvailable = await this.isTaskAvailable(userId, taskId);
    if (!isAvailable) {
      throw new RateLimitError('Task is not currently available');
    }

    const task = await prisma.adTask.findUnique({ where: { id: taskId } });
    if (!task || task.status !== AdTaskStatus.ACTIVE) {
      throw new AppError('Task not found or inactive', 404);
    }

    return await prisma.$transaction(async (tx) => {
      // Calculate rewards
      const userReward = Math.round((task.totalReward * (100 - AD_PLATFORM_FEE_PERCENT)) / 100);
      const platformFee = task.totalReward - userReward;

      // Create completion record
      const completion = await tx.adTaskCompletion.create({
        data: {
          userId,
          adTaskId: taskId,
          userReward,
          platformFee,
          totalAmount: task.totalReward,
          isVerified: true, // Auto-verify for now
          verificationData,
        },
      });

      // Update user's withdrawal balance
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          withdrawalBalance: {
            increment: userReward,
          },
        },
      });

      // Create transaction
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.AD_EARNING,
          status: TransactionStatus.COMPLETED,
          amount: userReward,
          description: `Ad task completed: ${task.title}`,
          balanceAfter: user.investedBalance + user.withdrawalBalance,
          investedBalanceAfter: user.investedBalance,
          withdrawalBalanceAfter: user.withdrawalBalance,
        },
      });

      // Update task statistics
      await tx.adTask.update({
        where: { id: taskId },
        data: {
          totalCompletions: {
            increment: 1,
          },
          totalRevenue: {
            increment: task.totalReward,
          },
        },
      });

      // Update user ad stats
      const dateStr = getDateString();
      await tx.userAdStats.upsert({
        where: { userId },
        create: {
          userId,
          totalCompletions: 1,
          totalEarnings: userReward,
          dailyCompletions: 1,
          dailyEarnings: userReward,
          lastResetDate: new Date(),
          lastCompletionDate: new Date(),
          currentStreak: 1,
          longestStreak: 1,
        },
        update: {
          totalCompletions: {
            increment: 1,
          },
          totalEarnings: {
            increment: userReward,
          },
          dailyCompletions: {
            increment: 1,
          },
          dailyEarnings: {
            increment: userReward,
          },
          lastCompletionDate: new Date(),
        },
      });

      // Set cooldown in Redis
      const cooldownKey = RedisKeys.adTaskCooldown(userId, taskId);
      await redis.set(cooldownKey, '1', 'EX', task.cooldownMinutes * 60);

      // Increment daily counter
      const limitKey = RedisKeys.adTaskDailyLimit(userId, taskId, dateStr);
      await redis.incr(limitKey);
      await redis.expire(limitKey, 86400); // 24 hours

      // Notify user
      await notificationService.create({
        userId,
        type: NotificationType.AD_TASK_COMPLETED,
        title: '?? Task Completed!',
        message: `You earned $${(userReward / 100).toFixed(2)} from "${task.title}"`,
        link: '/dashboard/tasks',
      });

      logger.info('Ad task completed', {
        userId,
        taskId,
        userReward,
      });

      return {
        completion,
        userReward,
        newBalance: user.withdrawalBalance,
      };
    });
  }

  /**
   * Create a new ad task (admin only)
   */
  async createTask(data: {
    title: string;
    description: string;
    type: AdTaskType;
    provider: string;
    totalReward: number;
    dailyLimit?: number;
    totalLimit?: number;
    cooldownMinutes?: number;
    minPlanType?: string;
    externalTaskId?: string;
    metadata?: any;
  }) {
    const baseReward = Math.round((data.totalReward * (100 - AD_PLATFORM_FEE_PERCENT)) / 100);
    const platformFee = data.totalReward - baseReward;

    const task = await prisma.adTask.create({
      data: {
        ...data,
        baseReward,
        platformFee,
        minPlanType: data.minPlanType as any,
      },
    });

    logger.info('Ad task created', { taskId: task.id });
    return task;
  }

  /**
   * Get user's ad stats
   */
  async getUserStats(userId: string) {
    return prisma.userAdStats.findUnique({
      where: { userId },
    });
  }

  /**
   * Get admin analytics
   */
  async getAdminAnalytics() {
    const [totalTasks, totalCompletions, totalRevenue] = await Promise.all([
      prisma.adTask.count(),
      prisma.adTaskCompletion.count(),
      prisma.adTaskCompletion.aggregate({
        _sum: {
          totalAmount: true,
          userReward: true,
          platformFee: true,
        },
      }),
    ]);

    return {
      totalTasks,
      totalCompletions,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalUserRewards: totalRevenue._sum.userReward || 0,
      totalPlatformFees: totalRevenue._sum.platformFee || 0,
    };
  }
}

export const adTaskService = new AdTaskService();
