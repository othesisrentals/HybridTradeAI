import { prisma } from '@/lib/db/prisma'
import {
  Prisma,
  InvestmentStatus,
  TransactionType,
  TransactionStatus,
  NotificationType,
  NotificationPriority,
  KYCStatus,
  Investment,
} from '@prisma/client'
import { createNotification } from '@/lib/notifications/notifications'
import { logger } from '@/lib/utils/logger'
import { AppError } from '@/lib/utils/errors'

function toDecimal(value: Prisma.Decimal | number | string): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value)
}

function formatAmount(value: Prisma.Decimal | number | string): string {
  return toDecimal(value).toFixed(2)
}

function getNextProfitDate(reference: Date = new Date()): Date {
  const next = new Date(reference)
  const day = next.getDay() // 0 (Sun) - 6 (Sat)
  const daysUntilSunday = (7 - day) % 7

  next.setDate(next.getDate() + daysUntilSunday)
  next.setHours(2, 0, 0, 0) // Sunday 02:00 local time

  if (daysUntilSunday === 0 && reference.getHours() >= 2) {
    next.setDate(next.getDate() + 7)
  }

  return next
}

export class InvestmentService {
  /**
   * Create a deposit request linked to an investment in pending state
   */
  async createDepositRequest(
    userId: string,
    planId: string,
    amount: number,
    options: {
      currency?: string
      paymentReference?: string
      paymentMethod?: string
      metadata?: Record<string, unknown>
    } = {}
  ): Promise<Investment> {
    const amountDecimal = toDecimal(amount)

    const result = await prisma.$transaction(async (tx) => {
      const [plan, user] = await Promise.all([
        tx.plan.findUnique({ where: { id: planId } }),
        tx.user.findUnique({ where: { id: userId }, select: { kycStatus: true } }),
      ])

      if (!plan || !plan.isActive) {
        throw new AppError('Selected plan is not available', 400)
      }

      if (!user) {
        throw new AppError('User not found', 404)
      }

      if (user.kycStatus !== KYCStatus.APPROVED) {
        throw new AppError('Complete KYC verification before investing', 400)
      }

      if (amountDecimal.lt(plan.minAmount)) {
        throw new AppError(
          `Minimum amount for ${plan.name} is $${formatAmount(plan.minAmount)}`,
          400
        )
      }

      if (amountDecimal.gt(plan.maxAmount)) {
        throw new AppError(
          `Maximum amount for ${plan.name} is $${formatAmount(plan.maxAmount)}`,
          400
        )
      }

      const investment = await tx.investment.create({
        data: {
          userId,
          planId,
          amount: amountDecimal,
          status: InvestmentStatus.PENDING,
        },
        include: {
          plan: true,
        },
      })

      await tx.transaction.create({
        data: {
          userId,
          investmentId: investment.id,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          amount: amountDecimal,
          currency: options.currency || 'USD',
          paymentReference: options.paymentReference,
          paymentMethod: options.paymentMethod,
          description: `Deposit request for ${investment.plan.name}`,
          data: {
            ...(options.metadata || {}),
            planId,
            autoInvest: true,
          },
        },
      })

      return investment
    })

    await createNotification({
      userId,
      type: NotificationType.DEPOSIT_CREATED,
      priority: NotificationPriority.MEDIUM,
      title: 'Deposit Request Submitted',
      message: `We received your deposit request of $${formatAmount(amount)}. Our team will review it shortly.`,
      link: `/dashboard/investments`,
      data: {
        planId,
        amount: formatAmount(amount),
      },
    })

    logger.info('Deposit request created', {
      userId,
      planId,
      amount: formatAmount(amount),
    })

    return result
  }

  /**
   * Admin approves a pending investment deposit
   */
  async approveDeposit(
    investmentId: string,
    approvedBy: string,
    adminNotes?: string
  ): Promise<Investment> {
    const now = new Date()
    const nextProfitDate = getNextProfitDate(now)

    const { investment } = await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: {
          plan: true,
        },
      })

      if (!investment) {
        throw new AppError('Investment not found', 404)
      }

      if (investment.status !== InvestmentStatus.PENDING) {
        throw new AppError('Investment is not pending approval', 400)
      }

      const depositTransaction = await tx.transaction.findFirst({
        where: {
          investmentId,
          type: TransactionType.DEPOSIT,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!depositTransaction) {
        throw new AppError('Deposit transaction not found', 404)
      }

      const updatedInvestment = await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: InvestmentStatus.ACTIVE,
          startDate: now,
          autoInvested: true,
          autoInvestedAt: now,
          nextProfitDate,
        },
        include: {
          plan: true,
        },
      })

      await tx.user.update({
        where: { id: updatedInvestment.userId },
        data: {
          investedBalance: {
            increment: updatedInvestment.amount,
          },
        },
      })

      await tx.transaction.update({
        where: { id: depositTransaction.id },
        data: {
          status: TransactionStatus.APPROVED,
          approvedAt: now,
          approvedBy,
          adminNotes,
        },
      })

      await tx.transaction.create({
        data: {
          userId: updatedInvestment.userId,
          investmentId,
          type: TransactionType.INVESTMENT,
          status: TransactionStatus.COMPLETED,
          amount: updatedInvestment.amount,
          currency: depositTransaction.currency,
          description: `Investment activated - ${updatedInvestment.plan.name}`,
          data: {
            approvalTransactionId: depositTransaction.id,
          },
        },
      })

      return { investment: updatedInvestment }
    })

    await createNotification({
      userId: investment.userId,
      type: NotificationType.INVESTMENT_APPROVED,
      priority: NotificationPriority.HIGH,
      title: 'Investment Activated',
      message: `Your ${investment.plan.name} investment is now active with $${formatAmount(investment.amount)} invested.`,
      link: `/dashboard/investments/${investment.id}`,
      data: {
        investmentId,
        planId: investment.planId,
        amount: formatAmount(investment.amount),
        nextProfitDate: investment.nextProfitDate,
      },
    })

    logger.info('Deposit approved and auto-invested', {
      investmentId,
      userId: investment.userId,
      amount: formatAmount(investment.amount),
      approvedBy,
    })

    return investment
  }

  /**
   * Admin rejects a pending investment deposit
   */
  async rejectDeposit(
    investmentId: string,
    rejectedBy: string,
    reason: string
  ): Promise<Investment> {
    const { investment } = await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({
        where: { id: investmentId },
        include: {
          plan: true,
        },
      })

      if (!investment) {
        throw new AppError('Investment not found', 404)
      }

      if (investment.status !== InvestmentStatus.PENDING) {
        throw new AppError('Investment is not pending approval', 400)
      }

      const depositTransaction = await tx.transaction.findFirst({
        where: {
          investmentId,
          type: TransactionType.DEPOSIT,
        },
        orderBy: { createdAt: 'desc' },
      })

      await tx.investment.update({
        where: { id: investmentId },
        data: {
          status: InvestmentStatus.CANCELLED,
          endDate: new Date(),
        },
      })

      if (depositTransaction) {
        await tx.transaction.update({
          where: { id: depositTransaction.id },
          data: {
            status: TransactionStatus.REJECTED,
            adminNotes: reason,
            approvedBy: rejectedBy,
            approvedAt: new Date(),
          },
        })
      }

      return { investment }
    })

    await createNotification({
      userId: investment.userId,
      type: NotificationType.DEPOSIT_REJECTED,
      priority: NotificationPriority.HIGH,
      title: 'Deposit Rejected',
      message: `Your deposit for the ${investment.plan?.name ?? 'selected'} plan was rejected. Reason: ${reason}.`,
      link: `/dashboard/investments`,
      data: {
        investmentId,
        reason,
      },
    })

    logger.info('Deposit rejected', {
      investmentId,
      userId: investment.userId,
      reason,
      rejectedBy,
    })

    return investment
  }

  /**
   * List investments for a user with plan details
   */
  async getUserInvestments(userId: string) {
    return prisma.investment.findMany({
      where: { userId },
      include: {
        plan: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
        profitHistory: {
          orderBy: { distributedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Pending investments awaiting approval
   */
  async getPendingDeposits(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where: {
          status: InvestmentStatus.PENDING,
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
          transactions: {
            where: { type: TransactionType.DEPOSIT },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.investment.count({
        where: {
          status: InvestmentStatus.PENDING,
        },
      }),
    ])

    return {
      investments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  }

  /**
   * Investment analytics for admin dashboards
   */
  async getInvestmentStats() {
    const [totalInvestments, activeInvestments, aggregates] = await Promise.all([
      prisma.investment.count(),
      prisma.investment.count({
        where: { status: InvestmentStatus.ACTIVE },
      }),
      prisma.investment.aggregate({
        where: { status: InvestmentStatus.ACTIVE },
        _sum: { amount: true, totalProfitEarned: true },
      }),
    ])

    return {
      totalInvestments,
      activeInvestments,
      totalAUM: formatAmount(aggregates._sum.amount || 0),
      totalProfitDistributed: formatAmount(aggregates._sum.totalProfitEarned || 0),
    }
  }
}

export const investmentService = new InvestmentService()
