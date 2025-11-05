import { prisma } from '@/lib/db/prisma';
import { redisClient } from '@/lib/redis/client';
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
          { requiredPlan: null },
          { requiredPlan: 'STARTER' },
          ...(hasPro ? [{ requiredPlan: 'PRO' as const }] : []),
          ...(hasElite ? [{ requiredPlan: 'ELITE' as const }] : []),
        ],
      },
      orderBy: { totalEarning: 'desc' },
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
          dailyLimitReached: task.dailyLimit ? dailyCompletions >= task.dailyLimit : false,
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
    const cooldown = await redisClient.get(cooldownKey);
    if (cooldown) return false;

    // Check daily limit
    const dailyCompletions = await this.getDailyCompletions(userId, taskId);
    const task = await prisma.adTask.findUnique({ where: { id: taskId } });
    if (!task) return false;

    if (task.dailyLimit && dailyCompletions >= task.dailyLimit) return false;

    return true;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  async getCooldownRemaining(userId: string, taskId: string): Promise<number> {
    const cooldownKey = RedisKeys.adTaskCooldown(userId, taskId);
    const ttl = await redisClient.ttl(cooldownKey);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Get daily completions count
   */
  async getDailyCompletions(userId: string, taskId: string): Promise<number> {
    const dateStr = getDateString();
    const limitKey = RedisKeys.adTaskDailyLimit(userId, taskId, dateStr);
    const count = await redisClient.get(limitKey);
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
      const userReward = Math.round((Number(task.totalEarning) * (100 - AD_PLATFORM_FEE_PERCENT)) / 100);
      const platformFee = Number(task.totalEarning) - userReward;

      // Create completion record
      const completion = await tx.adTaskCompletion.create({
        data: {
          userId,
          adTaskId: taskId,
          rewardAmount: userReward,
          platformCommission: platformFee,
          status: 'VERIFIED', // Auto-verify for now
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
        },
      });

      // Update task statistics
      await tx.adTask.update({
        where: { id: taskId },
        data: {
          currentCompletions: {
            increment: 1,
          },
        },
      });

      // Update user ad stats
      const dateStr = getDateString();
      await tx.userAdStats.upsert({
        where: { userId },
        create: {
          userId,
          totalTasksCompleted: 1,
          totalEarnings: userReward,
          todayTasksCompleted: 1,
          todayEarnings: userReward,
          lastTaskCompletedAt: new Date(),
        },
        update: {
          totalTasksCompleted: {
            increment: 1,
          },
          totalEarnings: {
            increment: userReward,
          },
          todayTasksCompleted: {
            increment: 1,
          },
          todayEarnings: {
            increment: userReward,
          },
          lastTaskCompletedAt: new Date(),
        },
      });

      // Set cooldown in Redis
      const cooldownKey = RedisKeys.adTaskCooldown(userId, taskId);
      await redisClient.set(cooldownKey, '1', 'EX', task.cooldownHours * 3600); // Convert hours to seconds

      // Increment daily counter
      const limitKey = RedisKeys.adTaskDailyLimit(userId, taskId, dateStr);
      await redisClient.incr(limitKey);
      await redisClient.expire(limitKey, 86400); // 24 hours

      // Notify user
      await notificationService.create({
        userId,
        type: NotificationType.AD_TASK_COMPLETED,
        title: '?? Task Completed!',
        message: `You earned $${(userReward / 100).toFixed(2)} from "${task.title}"`,
        actionUrl: '/dashboard/tasks',
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
    adNetwork: string;
    totalEarning: number;
    dailyLimit?: number;
    totalLimit?: number;
    cooldownHours?: number;
    requiredPlan?: string;
    adUnitId?: string;
    trackingUrl?: string;
  }) {
    const baseReward = Math.round((data.totalEarning * (100 - AD_PLATFORM_FEE_PERCENT)) / 100);
    const platformFee = data.totalEarning - baseReward;

    const task = await prisma.adTask.create({
      data: {
        ...data,
        rewardAmount: baseReward,
        platformCommission: platformFee,
        requiredPlan: data.requiredPlan as any,
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
          rewardAmount: true,
          platformCommission: true,
        },
      }),
    ]);

    return {
      totalTasks,
      totalCompletions,
      totalRevenue: Number(totalRevenue._sum.rewardAmount || 0) + Number(totalRevenue._sum.platformCommission || 0),
      totalUserRewards: Number(totalRevenue._sum.rewardAmount || 0),
      totalPlatformFees: Number(totalRevenue._sum.platformCommission || 0),
    };
  }
}

export const adTaskService = new AdTaskService();

