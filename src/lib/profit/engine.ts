import { prisma } from '@/lib/db/prisma';
import { redisClient } from '@/lib/redis/client';
import { RedisKeys } from '@/lib/redis/keys';
import { InvestmentStatus, TransactionType, TransactionStatus, NotificationType } from '@prisma/client';
import { notificationService } from '@/lib/notifications/service';
import { logger } from '@/lib/utils/logger';
import { getWeekNumber } from '@/lib/utils/date';

const MANAGEMENT_FEE_PERCENT = parseFloat(process.env.MANAGEMENT_FEE_PERCENT || '10');

export class ProfitEngine {
  /**
   * Main profit distribution function
   * Runs weekly for all active investments
   */
  async distributeWeeklyProfits(): Promise<{
    totalDistributed: number;
    investmentsProcessed: number;
    errors: number;
  }> {
    // Acquire distributed lock to prevent concurrent runs
    const lockKey = RedisKeys.profitDistributionLock();
    const lockAcquired = await redisClient.set(lockKey, '1', 'EX', 3600, 'NX');

    if (!lockAcquired) {
      logger.warn('Profit distribution already running');
      return { totalDistributed: 0, investmentsProcessed: 0, errors: 0 };
    }

    try {
      logger.info('Starting weekly profit distribution');

      const weekNumber = getWeekNumber();
      let totalDistributed = 0;
      let investmentsProcessed = 0;
      let errors = 0;

      // Get all active investments
      const activeInvestments = await prisma.investment.findMany({
        where: {
          status: InvestmentStatus.ACTIVE,
        },
        include: {
          plan: true,
          user: true,
        },
      });

      logger.info(`Found ${activeInvestments.length} active investments`);

      // Process each investment
      for (const investment of activeInvestments) {
        try {
          const profit = await this.calculateAndDistributeProfit(investment, weekNumber);
          totalDistributed += profit;
          investmentsProcessed++;
        } catch (error) {
          logger.error('Error distributing profit for investment', error, {
            investmentId: investment.id,
          });
          errors++;
        }
      }

      // Update last run timestamp
      await redisClient.set(
        RedisKeys.profitDistributionLastRun(),
        new Date().toISOString()
      );

      logger.info('Weekly profit distribution completed', {
        totalDistributed,
        investmentsProcessed,
        errors,
      });

      return { totalDistributed, investmentsProcessed, errors };
    } finally {
      // Release lock
      await redisClient.del(lockKey);
    }
  }

  /**
   * Calculate and distribute profit for a single investment
   */
  private async calculateAndDistributeProfit(
    investment: any,
    weekNumber: number
  ): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      // Generate random ROI within plan range
      const { plan } = investment;
      const roiPercent = this.generateRandomROI(
        plan.minRoiPercent,
        plan.maxRoiPercent
      );

      // Calculate profit
      const grossProfit = Math.round((investment.amount * roiPercent) / 100);
      const managementFee = Math.round((grossProfit * MANAGEMENT_FEE_PERCENT) / 100);
      const netProfit = grossProfit - managementFee;

      // Update investment current value
      await tx.investment.update({
        where: { id: investment.id },
        data: {
          totalEarned: {
            increment: netProfit,
          },
          currentValue: {
            increment: netProfit,
          },
        },
      });

      // Update user's withdrawal balance (profits are withdrawable)
      const updatedUser = await tx.user.update({
        where: { id: investment.userId },
        data: {
          withdrawalBalance: {
            increment: netProfit,
          },
        },
      });

      // Record profit history
      await tx.profitHistory.create({
        data: {
          userId: investment.userId,
          investmentId: investment.id,
          investmentAmount: investment.amount,
          roiPercent,
          grossProfit,
          managementFee,
          netProfit,
          weekNumber,
        },
      });

      // Create profit transaction
      await tx.transaction.create({
        data: {
          userId: investment.userId,
          investmentId: investment.id,
          type: TransactionType.PROFIT,
          status: TransactionStatus.COMPLETED,
          amount: netProfit,
          description: `Weekly profit - ${roiPercent.toFixed(2)}% ROI (Week ${weekNumber})`,
          balanceAfter: updatedUser.investedBalance + updatedUser.withdrawalBalance,
          investedBalanceAfter: updatedUser.investedBalance,
          withdrawalBalanceAfter: updatedUser.withdrawalBalance,
        },
      });

      // Record management fee
      await tx.transaction.create({
        data: {
          userId: investment.userId,
          investmentId: investment.id,
          type: TransactionType.PLATFORM_FEE,
          status: TransactionStatus.COMPLETED,
          amount: -managementFee,
          description: `Management fee - ${MANAGEMENT_FEE_PERCENT}%`,
          balanceAfter: updatedUser.investedBalance + updatedUser.withdrawalBalance,
          investedBalanceAfter: updatedUser.investedBalance,
          withdrawalBalanceAfter: updatedUser.withdrawalBalance,
        },
      });

      // Notify user
      await notificationService.create({
        userId: investment.userId,
        type: NotificationType.PROFIT_DISTRIBUTED,
        priority: 'HIGH',
        title: '?? Profit Distributed!',
        message: `You earned $${(netProfit / 100).toFixed(2)} (${roiPercent.toFixed(2)}% ROI) from your ${plan.name} investment.`,
        actionUrl: '/dashboard',
      });

      logger.info('Profit distributed', {
        userId: investment.userId,
        investmentId: investment.id,
        netProfit,
        roiPercent,
      });

      return netProfit;
    });
  }

  /**
   * Generate random ROI within plan range
   */
  private generateRandomROI(minPercent: number, maxPercent: number): number {
    return minPercent + Math.random() * (maxPercent - minPercent);
  }

  /**
   * Calculate estimated weekly profit for an investment
   */
  async estimateWeeklyProfit(investmentAmount: number, planId: string): Promise<{
    minProfit: number;
    maxProfit: number;
    minAfterFee: number;
    maxAfterFee: number;
  }> {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    const minProfit = Math.round((investmentAmount * plan.minRoiPercent) / 100);
    const maxProfit = Math.round((investmentAmount * plan.maxRoiPercent) / 100);

    const minFee = Math.round((minProfit * MANAGEMENT_FEE_PERCENT) / 100);
    const maxFee = Math.round((maxProfit * MANAGEMENT_FEE_PERCENT) / 100);

    return {
      minProfit,
      maxProfit,
      minAfterFee: minProfit - minFee,
      maxAfterFee: maxProfit - maxFee,
    };
  }

  /**
   * Get profit history for a user
   */
  async getUserProfitHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.profitHistory.findMany({
        where: { userId },
        include: {
          investment: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: { distributedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.profitHistory.count({ where: { userId } }),
    ]);

    const totalEarned = await prisma.profitHistory.aggregate({
      where: { userId },
      _sum: { netProfit: true },
    });

    return {
      history,
      totalEarned: totalEarned._sum.netProfit || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get profit analytics
   */
  async getProfitAnalytics(userId?: string) {
    const where = userId ? { userId } : {};

    const [totalProfits, averageROI, totalFees] = await Promise.all([
      prisma.profitHistory.aggregate({
        where,
        _sum: {
          netProfit: true,
          grossProfit: true,
        },
        _count: true,
      }),
      prisma.profitHistory.aggregate({
        where,
        _avg: {
          roiPercent: true,
        },
      }),
      prisma.profitHistory.aggregate({
        where,
        _sum: {
          managementFee: true,
        },
      }),
    ]);

    return {
      totalNetProfit: totalProfits._sum.netProfit || 0,
      totalGrossProfit: totalProfits._sum.grossProfit || 0,
      averageROI: averageROI._avg.roiPercent || 0,
      totalFees: totalFees._sum.managementFee || 0,
      distributionCount: totalProfits._count,
    };
  }
}

export const profitEngine = new ProfitEngine();
