import { prisma } from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { RedisKeys } from '@/lib/redis/keys'
import {
  InvestmentStatus,
  TransactionType,
  TransactionStatus,
  NotificationType,
  NotificationPriority,
  Prisma,
} from '@prisma/client'
import { logger } from '@/lib/utils/logger'
import { getWeekNumber } from '@/lib/utils/date'
import { createNotification } from '@/lib/notifications/notifications'
import { addWeeks } from 'date-fns'

const MANAGEMENT_FEE_FALLBACK = new Prisma.Decimal(
  process.env.MANAGEMENT_FEE_PERCENT || '10'
)

function toDecimal(value: Prisma.Decimal | number | string): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value)
}

function formatAmount(value: Prisma.Decimal | number | string): string {
  return toDecimal(value).toFixed(2)
}

function nextProfitDate(reference: Date = new Date()): Date {
  const next = new Date(reference)
  const day = next.getDay()
  const daysUntilSunday = (7 - day) % 7

  next.setDate(next.getDate() + daysUntilSunday)
  next.setHours(2, 0, 0, 0)

  if (daysUntilSunday === 0 && reference.getHours() >= 2) {
    next.setDate(next.getDate() + 7)
  }

  return next
}

type ActiveInvestment = Awaited<
  ReturnType<typeof prisma.investment.findMany>
>[number]

export class ProfitEngine {
  /**
   * Main profit distribution routine. Acquires a Redis lock to prevent double execution.
   */
  async distributeWeeklyProfits(now: Date = new Date()): Promise<{
    totalDistributed: string
    investmentsProcessed: number
    completedInvestments: number
    errors: number
  }> {
    const lockKey = RedisKeys.profitDistributionLock()
    const lockAcquired = await redis.set(lockKey, '1', 'EX', 3600, 'NX')

    if (!lockAcquired) {
      logger.warn('Profit distribution already running')
      return {
        totalDistributed: '0.00',
        investmentsProcessed: 0,
        completedInvestments: 0,
        errors: 0,
      }
    }

    const weekNumber = getWeekNumber(now)
    let totalDistributed = new Prisma.Decimal(0)
    let processed = 0
    let completed = 0
    let errors = 0

    try {
      const investments = await prisma.investment.findMany({
        where: {
          status: InvestmentStatus.ACTIVE,
          OR: [
            { nextProfitDate: null },
            { nextProfitDate: { lte: now } },
          ],
        },
        include: {
          plan: true,
          user: true,
          profitHistory: {
            orderBy: { weekNumber: 'desc' },
            take: 1,
          },
        },
      })

      logger.info('Running weekly profit distribution', {
        totalActive: investments.length,
        weekNumber,
      })

      for (const investment of investments) {
        try {
          const distribution = await this.processInvestment(
            investment,
            weekNumber,
            now
          )

          if (distribution.completed) {
            completed += 1
          }

          if (distribution.netProfit.gt(0)) {
            processed += 1
            totalDistributed = totalDistributed.add(distribution.netProfit)

            await createNotification({
              userId: investment.userId,
              type: NotificationType.PROFIT_DISTRIBUTED,
              priority: NotificationPriority.HIGH,
              title: 'Weekly Profit Distributed',
              message: `Your ${investment.plan.name} plan earned $${formatAmount(
                distribution.netProfit
              )} this week (${distribution.roi.toFixed(2)}% ROI).`,
              link: `/dashboard/investments/${investment.id}`,
              data: {
                investmentId: investment.id,
                roi: distribution.roi,
                grossProfit: formatAmount(distribution.grossProfit),
                netProfit: formatAmount(distribution.netProfit),
                weekNumber,
              },
            })
          }
        } catch (error) {
          errors += 1
          logger.error('Profit distribution failed', error as Error, {
            investmentId: investment.id,
          })
        }
      }

      await redis.set(
        RedisKeys.profitDistributionLastRun(),
        now.toISOString()
      )

      logger.info('Weekly profit distribution completed', {
        totalDistributed: totalDistributed.toFixed(2),
        processed,
        completed,
        errors,
      })

      return {
        totalDistributed: totalDistributed.toFixed(2),
        investmentsProcessed: processed,
        completedInvestments: completed,
        errors,
      }
    } finally {
      await redis.del(lockKey)
    }
  }

  private async processInvestment(
    investment: ActiveInvestment,
    weekNumber: number,
    now: Date
  ): Promise<{
    netProfit: Prisma.Decimal
    grossProfit: Prisma.Decimal
    managementFee: Prisma.Decimal
    roi: number
    completed: boolean
  }> {
    return prisma.$transaction(async (tx) => {
      const freshInvestment = await tx.investment.findUnique({
        where: { id: investment.id },
        include: {
          plan: true,
        },
      })

      if (!freshInvestment) {
        throw new Error('Investment not found during distribution')
      }

      // Check if investment duration has ended
      const startDate = freshInvestment.startDate ?? freshInvestment.createdAt
      const expectedEnd = addWeeks(startDate, freshInvestment.plan.durationWeeks)

      if (expectedEnd <= now) {
        await tx.investment.update({
          where: { id: freshInvestment.id },
          data: {
            status: InvestmentStatus.COMPLETED,
            endDate: expectedEnd,
          },
        })

        return {
          netProfit: new Prisma.Decimal(0),
          grossProfit: new Prisma.Decimal(0),
          managementFee: new Prisma.Decimal(0),
          roi: 0,
          completed: true,
        }
      }

      const roi = this.generateRandomROI(
        Number(freshInvestment.plan.roiMin),
        Number(freshInvestment.plan.roiMax)
      )

      const amount = toDecimal(freshInvestment.amount)
      const grossProfit = amount.mul(roi).div(100)
      const managementRate = freshInvestment.plan.managementFee
        ? toDecimal(freshInvestment.plan.managementFee)
        : MANAGEMENT_FEE_FALLBACK
      const managementFee = grossProfit.mul(managementRate).div(100)
      const netProfit = grossProfit.sub(managementFee)

      const nextDate = nextProfitDate(now)

      await tx.investment.update({
        where: { id: freshInvestment.id },
        data: {
          totalProfitEarned: {
            increment: netProfit,
          },
          lastProfitDate: now,
          nextProfitDate: nextDate,
        },
      })

      await tx.user.update({
        where: { id: freshInvestment.userId },
        data: {
          withdrawalBalance: {
            increment: netProfit,
          },
          totalEarnings: {
            increment: netProfit,
          },
        },
      })

      const lastWeekNumber = investment.profitHistory?.[0]?.weekNumber ?? 0
      const currentWeekNumber = lastWeekNumber + 1

      const profitRecord = await tx.profitHistory.create({
        data: {
          investmentId: freshInvestment.id,
          userId: freshInvestment.userId,
          amount: grossProfit,
          roiPercentage: roi,
          managementFee,
          netProfit,
          distributedAt: now,
          weekNumber: currentWeekNumber,
        },
      })

      await tx.transaction.create({
        data: {
          userId: freshInvestment.userId,
          investmentId: freshInvestment.id,
          type: TransactionType.PROFIT,
          status: TransactionStatus.COMPLETED,
          amount: netProfit,
          currency: 'USD',
          description: `Weekly profit - ${roi.toFixed(2)}% ROI (Week ${currentWeekNumber})`,
          data: {
            profitHistoryId: profitRecord.id,
            roi,
            grossProfit: grossProfit.toString(),
            managementFee: managementFee.toString(),
            netProfit: netProfit.toString(),
            weekNumber: currentWeekNumber,
          },
        },
      })

      if (managementFee.gt(0)) {
        await tx.transaction.create({
          data: {
            userId: freshInvestment.userId,
            investmentId: freshInvestment.id,
            type: TransactionType.PLATFORM_FEE,
            status: TransactionStatus.COMPLETED,
            amount: managementFee,
            currency: 'USD',
            description: `Management fee (${managementRate.toFixed(2)}%)`,
            data: {
              profitHistoryId: profitRecord.id,
              source: 'profit_distribution',
              weekNumber: currentWeekNumber,
            },
          },
        })
      }

      logger.debug('Profit distributed for investment', {
        investmentId: freshInvestment.id,
        roi,
        grossProfit: grossProfit.toString(),
        netProfit: netProfit.toString(),
      })

      return {
        netProfit,
        grossProfit,
        managementFee,
        roi,
        completed: false,
      }
    })
  }

  private generateRandomROI(minPercent: number, maxPercent: number): number {
    if (maxPercent <= minPercent) {
      return minPercent
    }
    const random = Math.random() * (maxPercent - minPercent)
    return parseFloat((minPercent + random).toFixed(2))
  }

  async estimateWeeklyProfit(investmentAmount: number, planId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } })

    if (!plan) {
      throw new Error('Plan not found')
    }

    const amount = toDecimal(investmentAmount)
    const minProfit = amount.mul(plan.roiMin).div(100)
    const maxProfit = amount.mul(plan.roiMax).div(100)
    const feeRate = plan.managementFee
      ? toDecimal(plan.managementFee)
      : MANAGEMENT_FEE_FALLBACK
    const minFee = minProfit.mul(feeRate).div(100)
    const maxFee = maxProfit.mul(feeRate).div(100)

    return {
      minProfit: minProfit.toNumber(),
      maxProfit: maxProfit.toNumber(),
      minAfterFee: minProfit.sub(minFee).toNumber(),
      maxAfterFee: maxProfit.sub(maxFee).toNumber(),
    }
  }

  async getUserProfitHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [history, total, aggregates] = await Promise.all([
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
      prisma.profitHistory.aggregate({
        where: { userId },
        _sum: { netProfit: true },
      }),
    ])

    return {
      history,
      totalEarned: aggregates._sum.netProfit || new Prisma.Decimal(0),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  }

  async getProfitAnalytics(userId?: string) {
    const where = userId ? { userId } : {}

    const [profitSums, roiAvg, feeSum] = await Promise.all([
      prisma.profitHistory.aggregate({
        where,
        _sum: {
          netProfit: true,
          amount: true,
        },
        _count: true,
      }),
      prisma.profitHistory.aggregate({
        where,
        _avg: { roiPercentage: true },
      }),
      prisma.profitHistory.aggregate({
        where,
        _sum: { managementFee: true },
      }),
    ])

    return {
      totalNetProfit: profitSums._sum.netProfit || new Prisma.Decimal(0),
      totalGrossProfit: profitSums._sum.amount || new Prisma.Decimal(0),
      totalFees: feeSum._sum.managementFee || new Prisma.Decimal(0),
      averageROI: roiAvg._avg.roiPercentage || 0,
      distributions: profitSums._count,
    }
  }
}

export const profitEngine = new ProfitEngine()
