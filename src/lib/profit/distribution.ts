import { prisma } from '@/lib/db/prisma'
import { dbTransaction, updateUserBalances } from '@/lib/db/transactions'
import { createNotification } from '@/lib/notifications/notifications'
import { calculateROI } from '@/lib/utils'
import { addWeeks, isBefore, startOfWeek } from 'date-fns'
import type { PlanType } from '@prisma/client'

/**
 * Calculate and distribute weekly profits for all active investments
 * Should be run weekly (e.g., Sunday 2 AM)
 */
export async function distributeWeeklyProfits() {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })

  // Get all active investments that are due for profit distribution
  const activeInvestments = await prisma.investment.findMany({
    where: {
      status: 'ACTIVE',
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

  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
    totalProfitDistributed: 0,
  }

  for (const investment of activeInvestments) {
    try {
      await dbTransaction(async (tx) => {
        // Calculate ROI for this week (random within plan range)
        const roi = calculateROI(
          Number(investment.plan.roiMin),
          Number(investment.plan.roiMax)
        )

        // Calculate gross profit
        const grossProfit = Number(investment.amount) * (roi / 100)

        // Calculate management fee (10% of profit)
        const managementFee = grossProfit * (Number(investment.plan.managementFee) / 100)

        // Net profit after fee
        const netProfit = grossProfit - managementFee

        // Calculate week number
        const lastProfit = investment.profitHistory[0]
        const weekNumber = lastProfit ? lastProfit.weekNumber + 1 : 1

        // Check if investment duration has ended
        const investmentStartDate = investment.startDate || investment.createdAt
        const expectedEndDate = addWeeks(investmentStartDate, investment.plan.durationWeeks)

        if (isBefore(expectedEndDate, now)) {
          // Investment period completed
          await tx.investment.update({
            where: { id: investment.id },
            data: {
              status: 'COMPLETED',
              endDate: expectedEndDate,
            },
          })

          results.skipped++
          return
        }

        // Create profit history record
        await tx.profitHistory.create({
          data: {
            investmentId: investment.id,
            userId: investment.userId,
            amount: grossProfit,
            roiPercentage: roi,
            managementFee,
            netProfit,
            weekNumber,
            distributedAt: now,
          },
        })

        // Update user balances
        await updateUserBalances(investment.userId, {
          withdrawalBalance: { increment: netProfit },
          totalEarnings: { increment: netProfit },
        })

        // Update investment
        const nextProfitDate = addWeeks(now, 1)
        await tx.investment.update({
          where: { id: investment.id },
          data: {
            totalProfitEarned: {
              increment: netProfit,
            },
            lastProfitDate: now,
            nextProfitDate,
          },
        })

        // Create notification
        await createNotification({
          userId: investment.userId,
          type: 'PROFIT_DISTRIBUTED',
          priority: 'HIGH',
          title: 'Weekly Profit Distributed',
          message: `Your ${investment.plan.name} investment earned $${netProfit.toFixed(2)} this week (${roi.toFixed(2)}% ROI).`,
          link: `/dashboard/investments/${investment.id}`,
          data: {
            investmentId: investment.id,
            amount: netProfit,
            roi,
          },
        })

        results.processed++
        results.totalProfitDistributed += netProfit
      })
    } catch (error) {
      console.error(`Error processing investment ${investment.id}:`, error)
      results.errors++
    }
  }

  return results
}

/**
 * Auto-invest approved deposits
 */
export async function autoInvestApprovedDeposits() {
  const approvedDeposits = await prisma.transaction.findMany({
    where: {
      type: 'DEPOSIT',
      status: 'APPROVED',
      investmentId: null, // Not yet invested
    },
    include: {
      user: {
        include: {
          investments: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
    orderBy: { approvedAt: 'asc' },
  })

  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
  }

  for (const deposit of approvedDeposits) {
    try {
      await dbTransaction(async (tx) => {
        // Find user's active plan preference or default to Starter
        // For now, we'll use the plan selection from the deposit metadata or default
        const planType = (deposit.data as any)?.planType || 'STARTER'

        const plan = await tx.plan.findUnique({
          where: { type: planType },
        })

        if (!plan) {
          results.skipped++
          return
        }

        const depositAmount = Number(deposit.amount)

        // Validate amount is within plan limits
        if (
          depositAmount < Number(plan.minAmount) ||
          depositAmount > Number(plan.maxAmount)
        ) {
          results.skipped++
          return
        }

        // Check if user has KYC approval (required for investment)
        if (deposit.user.kycStatus !== 'APPROVED') {
          results.skipped++
          return
        }

        // Create investment
        const investment = await tx.investment.create({
          data: {
            userId: deposit.userId,
            planId: plan.id,
            amount: depositAmount,
            status: 'ACTIVE',
            startDate: new Date(),
            nextProfitDate: addWeeks(new Date(), 1), // First profit in 1 week
            autoInvested: true,
            autoInvestedAt: new Date(),
          },
        })

        // Update transaction to link investment
        await tx.transaction.update({
          where: { id: deposit.id },
          data: {
            investmentId: investment.id,
          },
        })

        // Update user invested balance
        await updateUserBalances(deposit.userId, {
          investedBalance: { increment: depositAmount },
        })

        // Create notification
        await createNotification({
          userId: deposit.userId,
          type: 'INVESTMENT_APPROVED',
          priority: 'HIGH',
          title: 'Investment Activated',
          message: `Your deposit of ${depositAmount} has been invested in the ${plan.name} plan.`,
          link: `/dashboard/investments/${investment.id}`,
        })

        results.processed++
      })
    } catch (error) {
      console.error(`Error auto-investing deposit ${deposit.id}:`, error)
      results.errors++
    }
  }

  return results
}
