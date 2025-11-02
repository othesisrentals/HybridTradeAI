import { prisma } from '@/lib/db/prisma';
import {
  InvestmentStatus,
  TransactionType,
  TransactionStatus,
  NotificationType,
  Plan,
  Investment,
} from '@prisma/client';
import { notificationService } from '@/lib/notifications/service';
import { logger } from '@/lib/utils/logger';
import { AppError, InsufficientFundsError } from '@/lib/utils/errors';

export class InvestmentService {
  /**
   * Create a deposit request (pending approval)
   */
  async createDepositRequest(
    userId: string,
    planId: string,
    amount: number
  ): Promise<Investment> {
    // Validate plan and amount
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new AppError('Invalid or inactive plan', 400);
    }

    if (amount < plan.minAmount) {
      throw new AppError(
        `Minimum investment for ${plan.name} is ${plan.minAmount / 100}`,
        400
      );
    }

    if (plan.maxAmount && amount > plan.maxAmount) {
      throw new AppError(
        `Maximum investment for ${plan.name} is ${plan.maxAmount / 100}`,
        400
      );
    }

    // Create investment with pending status
    const investment = await prisma.investment.create({
      data: {
        userId,
        planId,
        amount,
        currentValue: amount,
        status: InvestmentStatus.PENDING_DEPOSIT,
        depositedAt: new Date(),
      },
      include: {
        plan: true,
      },
    });

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        userId,
        investmentId: investment.id,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        amount,
        description: `Deposit for ${plan.name} plan`,
        balanceAfter: 0,
        investedBalanceAfter: 0,
        withdrawalBalanceAfter: 0,
      },
    });

    // Notify user
    await notificationService.create({
      userId,
      type: NotificationType.DEPOSIT_APPROVED,
      title: 'Deposit Pending',
      message: `Your deposit of $${amount / 100} for ${plan.name} is pending approval.`,
      actionUrl: `/dashboard/investments/${investment.id}`,
    });

    logger.info('Deposit request created', {
      userId,
      investmentId: investment.id,
      amount,
    });

    return investment;
  }

  /**
   * Admin approves deposit and activates investment
   */
  async approveDeposit(
    investmentId: string,
    approvedBy: string
  ): Promise<Investment> {
    return await prisma.$transaction(async (tx) => {
      // Get investment
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: { plan: true, user: true },
      });

      if (!investment) {
        throw new AppError('Investment not found', 404);
      }

      if (investment.status !== InvestmentStatus.PENDING_DEPOSIT) {
        throw new AppError('Investment is not pending approval', 400);
      }

      // Update investment status
      const updatedInvestment = await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: InvestmentStatus.ACTIVE,
          approvedAt: new Date(),
          startedAt: new Date(),
          approvedBy,
        },
        include: { plan: true },
      });

      // Update user's invested balance
      const user = await tx.user.update({
        where: { id: investment.userId },
        data: {
          investedBalance: {
            increment: investment.amount,
          },
        },
      });

      // Update transaction
      await tx.transaction.updateMany({
        where: {
          investmentId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
        },
        data: {
          status: TransactionStatus.COMPLETED,
          processedBy: approvedBy,
          approvedAt: new Date(),
          balanceAfter: user.investedBalance + user.withdrawalBalance,
          investedBalanceAfter: user.investedBalance,
          withdrawalBalanceAfter: user.withdrawalBalance,
        },
      });

      // Create investment transaction
      await tx.transaction.create({
        data: {
          userId: investment.userId,
          investmentId,
          type: TransactionType.INVESTMENT,
          status: TransactionStatus.COMPLETED,
          amount: investment.amount,
          description: `Investment activated - ${investment.plan.name}`,
          balanceAfter: user.investedBalance + user.withdrawalBalance,
          investedBalanceAfter: user.investedBalance,
          withdrawalBalanceAfter: user.withdrawalBalance,
        },
      });

      // Notify user
      await notificationService.create({
        userId: investment.userId,
        type: NotificationType.DEPOSIT_APPROVED,
        priority: 'HIGH',
        title: 'Deposit Approved!',
        message: `Your deposit of $${investment.amount / 100} has been approved. Your investment is now active.`,
        actionUrl: `/dashboard/investments/${investmentId}`,
      });

      logger.info('Deposit approved', {
        investmentId,
        userId: investment.userId,
        amount: investment.amount,
        approvedBy,
      });

      return updatedInvestment;
    });
  }

  /**
   * Admin rejects deposit
   */
  async rejectDeposit(
    investmentId: string,
    rejectedBy: string,
    reason: string
  ): Promise<Investment> {
    return await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: { plan: true },
      });

      if (!investment) {
        throw new AppError('Investment not found', 404);
      }

      if (investment.status !== InvestmentStatus.PENDING_DEPOSIT) {
        throw new AppError('Investment is not pending approval', 400);
      }

      // Update investment
      const updatedInvestment = await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: InvestmentStatus.CANCELLED,
          rejectionReason: reason,
        },
        include: { plan: true },
      });

      // Update transaction
      await tx.transaction.updateMany({
        where: {
          investmentId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
        },
        data: {
          status: TransactionStatus.CANCELLED,
          processedBy: rejectedBy,
          failureReason: reason,
        },
      });

      // Notify user
      await notificationService.create({
        userId: investment.userId,
        type: NotificationType.DEPOSIT_REJECTED,
        priority: 'HIGH',
        title: 'Deposit Rejected',
        message: `Your deposit was rejected. Reason: ${reason}`,
        actionUrl: `/dashboard/investments/${investmentId}`,
      });

      logger.info('Deposit rejected', {
        investmentId,
        userId: investment.userId,
        rejectedBy,
        reason,
      });

      return updatedInvestment;
    });
  }

  /**
   * Get user's active investments
   */
  async getUserInvestments(userId: string) {
    return prisma.investment.findMany({
      where: { userId },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get pending deposits for admin approval
   */
  async getPendingDeposits(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where: {
          status: InvestmentStatus.PENDING_DEPOSIT,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              kycStatus: true,
            },
          },
          plan: true,
        },
        orderBy: { depositedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.investment.count({
        where: {
          status: InvestmentStatus.PENDING_DEPOSIT,
        },
      }),
    ]);

    return {
      investments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get investment statistics
   */
  async getInvestmentStats() {
    const [totalInvestments, activeInvestments, totalAUM] = await Promise.all([
      prisma.investment.count(),
      prisma.investment.count({
        where: { status: InvestmentStatus.ACTIVE },
      }),
      prisma.investment.aggregate({
        where: { status: InvestmentStatus.ACTIVE },
        _sum: { currentValue: true },
      }),
    ]);

    return {
      totalInvestments,
      activeInvestments,
      totalAUM: totalAUM._sum.currentValue || 0,
    };
  }
}

export const investmentService = new InvestmentService();
