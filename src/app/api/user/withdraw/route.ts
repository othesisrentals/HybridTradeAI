import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { dbTransaction } from '@/lib/db/transactions'
import { createNotification } from '@/lib/notifications/notifications'
import { z } from 'zod'

const withdrawSchema = z.object({
  amount: z.number().positive().min(10), // Minimum $10
  bankAccount: z.string().min(1),
  bankName: z.string().min(1),
  accountName: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, bankAccount, bankName, accountName } = withdrawSchema.parse(body)

    // Verify user and KYC status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.kycStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'KYC verification required for withdrawals' },
        { status: 400 }
      )
    }

    const withdrawalBalance = Number(user.withdrawalBalance)

    if (amount > withdrawalBalance) {
      return NextResponse.json(
        { error: 'Insufficient withdrawal balance' },
        { status: 400 }
      )
    }

    // Create withdrawal transaction
    const transaction = await dbTransaction(async (tx) => {
      const withdrawal = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          amount,
          description: `Withdrawal to ${bankName} - ${accountName}`,
          data: {
            bankAccount,
            bankName,
            accountName,
          },
        },
      })

      // Deduct from withdrawal balance immediately (locked until approved)
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          withdrawalBalance: {
            decrement: amount,
          },
        },
      })

      // Create notification
      await createNotification({
        userId: session.user.id,
        type: 'WITHDRAWAL_CREATED',
        priority: 'HIGH',
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of $${amount} is pending admin approval.`,
        link: '/dashboard/transactions',
      })

      return withdrawal
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Withdrawal error:', error)
    return NextResponse.json(
      { error: 'Failed to create withdrawal' },
      { status: 500 }
    )
  }
}
