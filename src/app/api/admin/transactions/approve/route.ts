import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { dbTransaction, updateUserBalances } from '@/lib/db/transactions'
import { createNotification } from '@/lib/notifications/notifications'
import { autoInvestApprovedDeposits } from '@/lib/profit/distribution'
import { z } from 'zod'

const approveSchema = z.object({
  transactionId: z.string(),
  approved: z.boolean(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { transactionId, approved, notes } = approveSchema.parse(body)

    const result = await dbTransaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true },
      })

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      if (transaction.status !== 'PENDING') {
        throw new Error('Transaction already processed')
      }

      if (approved) {
        // Approve transaction
        const updatedTransaction = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
            adminNotes: notes,
          },
        })

        // Handle deposit approval
        if (transaction.type === 'DEPOSIT') {
          // Update user withdrawal balance (deposits go to withdrawal balance first)
          await updateUserBalances(transaction.userId, {
            withdrawalBalance: { increment: Number(transaction.amount) },
          })

          // Create notification
          await createNotification({
            userId: transaction.userId,
            type: 'DEPOSIT_APPROVED',
            priority: 'HIGH',
            title: 'Deposit Approved',
            message: `Your deposit of $${transaction.amount} has been approved and credited to your account.`,
            link: '/dashboard/transactions',
          })

          // Trigger auto-investment (will run async)
          setTimeout(() => {
            autoInvestApprovedDeposits().catch(console.error)
          }, 1000)
        }

        // Handle withdrawal approval
        if (transaction.type === 'WITHDRAWAL') {
          // Withdrawal balance was already deducted when request was created
          // Just mark as completed
          await tx.transaction.update({
            where: { id: transactionId },
            data: { status: 'COMPLETED' },
          })

          await createNotification({
            userId: transaction.userId,
            type: 'WITHDRAWAL_APPROVED',
            priority: 'HIGH',
            title: 'Withdrawal Approved',
            message: `Your withdrawal of $${transaction.amount} has been approved and will be processed.`,
            link: '/dashboard/transactions',
          })
        }

        return updatedTransaction
      } else {
        // Reject transaction
        const updatedTransaction = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'REJECTED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
            adminNotes: notes,
          },
        })

        // Refund withdrawal balance if it was a withdrawal
        if (transaction.type === 'WITHDRAWAL') {
          await updateUserBalances(transaction.userId, {
            withdrawalBalance: { increment: Number(transaction.amount) },
          })
        }

        // Create notification
        await createNotification({
          userId: transaction.userId,
          type: transaction.type === 'DEPOSIT' ? 'DEPOSIT_REJECTED' : 'WITHDRAWAL_REJECTED',
          priority: 'HIGH',
          title: `${transaction.type} Rejected`,
          message: `Your ${transaction.type.toLowerCase()} request has been rejected. ${notes || ''}`,
          link: '/dashboard/transactions',
        })

        return updatedTransaction
      }
    })

    return NextResponse.json({
      success: true,
      transaction: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Transaction approval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process transaction' },
      { status: 500 }
    )
  }
}
