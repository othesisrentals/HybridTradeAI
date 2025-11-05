import { prisma } from '@/lib/db/prisma'
import { dbTransaction, updateUserBalances } from '@/lib/db/transactions'
import { createNotification } from '@/lib/notifications/notifications'
import { addHours, startOfDay } from 'date-fns'
import type { AdTaskType, AdCompletionStatus, PlanType } from '@prisma/client'

/**
 * Complete an ad task and credit rewards
 */
export async function completeAdTask(
  userId: string,
  adTaskId: string,
  proofUrl?: string
) {
  return await dbTransaction(async (tx) => {
    // Get ad task
    const adTask = await tx.adTask.findUnique({
      where: { id: adTaskId },
    })

    if (!adTask || adTask.status !== 'ACTIVE') {
      throw new Error('Ad task not available')
    }

    // Get user and check plan eligibility
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        investments: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
        adTaskCompletions: {
          where: {
            adTaskId,
            completedAt: {
              gte: startOfDay(new Date()),
            },
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check plan eligibility
    const userPlan = user.investments[0]?.plan?.type || null
    if (adTask.requiredPlan && userPlan !== adTask.requiredPlan) {
      // Check if user has required plan
      const hasRequiredPlan = user.investments.some(
        (inv) => inv.plan.type === adTask.requiredPlan
      )
      if (!hasRequiredPlan) {
        throw new Error('Plan upgrade required for this task')
      }
    }

    // Check daily limit
    if (adTask.dailyLimit) {
      const todayCompletions = user.adTaskCompletions.length
      if (todayCompletions >= adTask.dailyLimit) {
        throw new Error('Daily limit reached for this task')
      }
    }

    // Check cooldown (get last completion)
    const lastCompletion = await tx.adTaskCompletion.findFirst({
      where: {
        userId,
        adTaskId,
        status: 'VERIFIED',
      },
      orderBy: { completedAt: 'desc' },
    })

    if (lastCompletion) {
      const cooldownEnd = addHours(lastCompletion.completedAt, adTask.cooldownHours)
      if (new Date() < cooldownEnd) {
        throw new Error('Task is on cooldown')
      }
    }

    // Check total limit
    if (adTask.totalLimit && adTask.currentCompletions >= adTask.totalLimit) {
      throw new Error('Task limit reached')
    }

    // Create completion record
    const completion = await tx.adTaskCompletion.create({
      data: {
        userId,
        adTaskId,
        rewardAmount: adTask.rewardAmount,
        platformCommission: adTask.platformCommission,
        proofUrl,
        status: adTask.requiresVerification ? 'PENDING_VERIFICATION' : 'VERIFIED',
      },
    })

    // If no verification required, credit immediately
    if (!adTask.requiresVerification) {
      await creditAdReward(userId, completion.id, tx)
    }

    // Update task completion count
    await tx.adTask.update({
      where: { id: adTaskId },
      data: {
        currentCompletions: {
          increment: 1,
        },
      },
    })

    // Update user ad stats
    await updateUserAdStats(userId, Number(adTask.rewardAmount), tx)

    return completion
  })
}

/**
 * Verify and credit ad task completion
 */
export async function verifyAdTaskCompletion(
  completionId: string,
  verifiedBy: string,
  approved: boolean,
  rejectionReason?: string
) {
  return await dbTransaction(async (tx) => {
    const completion = await tx.adTaskCompletion.findUnique({
      where: { id: completionId },
      include: { adTask: true },
    })

    if (!completion) {
      throw new Error('Completion not found')
    }

    if (completion.status !== 'PENDING_VERIFICATION') {
      throw new Error('Completion already processed')
    }

    if (approved) {
      await tx.adTaskCompletion.update({
        where: { id: completionId },
        data: {
          status: 'VERIFIED',
          verifiedBy,
          verifiedAt: new Date(),
        },
      })

      await creditAdReward(completion.userId, completionId, tx)

      await createNotification({
        userId: completion.userId,
        type: 'AD_TASK_COMPLETED',
        priority: 'MEDIUM',
        title: 'Ad Task Verified',
        message: `Your ${completion.adTask.title} task has been verified. $${Number(completion.rewardAmount).toFixed(2)} has been credited to your account.`,
        link: '/dashboard/ads',
      })
    } else {
      await tx.adTaskCompletion.update({
        where: { id: completionId },
        data: {
          status: 'REJECTED',
          verifiedBy,
          verifiedAt: new Date(),
          rejectionReason,
        },
      })
    }

    return completion
  })
}

/**
 * Credit ad reward to user balance
 */
async function creditAdReward(
  userId: string,
  completionId: string,
  tx: any
) {
  const completion = await tx.adTaskCompletion.findUnique({
    where: { id: completionId },
  })

  if (!completion || completion.status !== 'VERIFIED') {
    throw new Error('Invalid completion')
  }

  // Credit to withdrawal balance
  await updateUserBalances(userId, {
    withdrawalBalance: { increment: Number(completion.rewardAmount) },
    totalEarnings: { increment: Number(completion.rewardAmount) },
  })

  // Create transaction record
  await tx.transaction.create({
    data: {
      userId,
      type: 'AD_EARNING',
      status: 'COMPLETED',
      amount: completion.rewardAmount,
      description: `Ad task completion reward`,
    },
  })
}

/**
 * Update user ad statistics
 */
async function updateUserAdStats(
  userId: string,
  earnings: number | string,
  tx: any
) {
  const amount = typeof earnings === 'string' ? parseFloat(earnings) : earnings
  const today = startOfDay(new Date())

  const stats = await tx.userAdStats.findUnique({
    where: { userId },
  })

  if (!stats) {
        await tx.userAdStats.create({
      data: {
        userId,
        totalEarnings: amount,
        totalTasksCompleted: 1,
        todayEarnings: amount,
        todayTasksCompleted: 1,
        lastTaskCompletedAt: new Date(),
        lastResetDate: today,
      },
    })
  } else {
    // Check if we need to reset daily stats
    const lastReset = startOfDay(stats.lastResetDate)
    const shouldReset = lastReset < today

    await tx.userAdStats.update({
      where: { userId },
      data: {
        totalEarnings: { increment: amount },
        totalTasksCompleted: { increment: 1 },
        todayEarnings: shouldReset ? amount : { increment: amount },
        todayTasksCompleted: shouldReset ? 1 : { increment: 1 },
        lastTaskCompletedAt: new Date(),
        lastResetDate: shouldReset ? today : stats.lastResetDate,
      },
    })
  }
}

/**
 * Get available ad tasks for user
 */
export async function getAvailableAdTasks(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      investments: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
      },
      adTaskCompletions: {
        where: {
          completedAt: {
            gte: startOfDay(new Date()),
          },
        },
        include: { adTask: true },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const userPlan = user.investments[0]?.plan?.type || null

  // Get all active tasks
  const allTasks = await prisma.adTask.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { requiredPlan: null },
        { requiredPlan: userPlan },
      ],
    },
    include: {
      completions: {
        where: {
          userId,
          completedAt: {
            gte: startOfDay(new Date()),
          },
        },
      },
    },
  })

  // Filter tasks based on eligibility and limits
  const availableTasks = allTasks.filter((task) => {
    // Check daily limit
    if (task.dailyLimit) {
      const todayCompletions = task.completions.length
      if (todayCompletions >= task.dailyLimit) {
        return false
      }
    }

    // Check total limit
    if (task.totalLimit && task.currentCompletions >= task.totalLimit) {
      return false
    }

    return true
  })

  return availableTasks
}

