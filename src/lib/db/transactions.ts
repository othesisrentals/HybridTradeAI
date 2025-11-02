import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

/**
 * Execute a database transaction with proper error handling
 */
export async function dbTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    try {
      return await callback(tx)
    } catch (error) {
      console.error('Transaction error:', error)
      throw error
    }
  })
}

/**
 * Atomic balance update - ensures consistency
 */
export async function updateUserBalances(
  userId: string,
  updates: {
    investedBalance?: { increment?: number; decrement?: number; set?: number }
    withdrawalBalance?: { increment?: number; decrement?: number; set?: number }
    totalEarnings?: { increment?: number; decrement?: number; set?: number }
  }
) {
  return await dbTransaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        investedBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Build update object
    const updateData: Prisma.UserUpdateInput = {}

    if (updates.investedBalance) {
      if (updates.investedBalance.set !== undefined) {
        updateData.investedBalance = updates.investedBalance.set
      } else {
        const current = Number(user.investedBalance)
        const increment = updates.investedBalance.increment || 0
        const decrement = updates.investedBalance.decrement || 0
        updateData.investedBalance = current + increment - decrement
      }
    }

    if (updates.withdrawalBalance) {
      if (updates.withdrawalBalance.set !== undefined) {
        updateData.withdrawalBalance = updates.withdrawalBalance.set
      } else {
        const current = Number(user.withdrawalBalance)
        const increment = updates.withdrawalBalance.increment || 0
        const decrement = updates.withdrawalBalance.decrement || 0
        updateData.withdrawalBalance = current + increment - decrement
      }
    }

    if (updates.totalEarnings) {
      if (updates.totalEarnings.set !== undefined) {
        updateData.totalEarnings = updates.totalEarnings.set
      } else {
        const current = Number(user.totalEarnings)
        const increment = updates.totalEarnings.increment || 0
        const decrement = updates.totalEarnings.decrement || 0
        updateData.totalEarnings = current + increment - decrement
      }
    }

    // Validate balances are not negative
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        investedBalance: true,
        withdrawalBalance: true,
        totalEarnings: true,
      },
    })

    if (Number(updatedUser.investedBalance) < 0 || Number(updatedUser.withdrawalBalance) < 0) {
      throw new Error('Balance cannot be negative')
    }

    return updatedUser
  })
}
