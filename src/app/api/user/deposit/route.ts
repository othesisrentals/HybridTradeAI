import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { dbTransaction } from '@/lib/db/transactions'
import { createNotification } from '@/lib/notifications/notifications'
import { z } from 'zod'

const depositSchema = z.object({
  amount: z.number().positive().min(10), // Minimum $10
  planType: z.enum(['STARTER', 'PRO', 'ELITE']),
  paymentMethod: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, planType, paymentMethod } = depositSchema.parse(body)

    // Verify user KYC status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check plan limits
    const plan = await prisma.plan.findUnique({
      where: { type: planType },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (amount < Number(plan.minAmount) || amount > Number(plan.maxAmount)) {
      return NextResponse.json(
        { error: `Amount must be between $${plan.minAmount} and $${plan.maxAmount}` },
        { status: 400 }
      )
    }

    // Create deposit transaction
    const transaction = await dbTransaction(async (tx) => {
      const deposit = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'DEPOSIT',
          status: 'PENDING',
          amount,
          paymentMethod,
          description: `Deposit for ${plan.name} plan`,
          data: {
            planType,
          },
        },
      })

      // Create notification
      await createNotification({
        userId: session.user.id,
        type: 'DEPOSIT_CREATED',
        priority: 'MEDIUM',
        title: 'Deposit Request Submitted',
        message: `Your deposit of $${amount} is pending admin approval.`,
        link: '/dashboard/transactions',
      })

      return deposit
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
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Deposit error:', error)
    return NextResponse.json(
      { error: 'Failed to create deposit' },
      { status: 500 }
    )
  }
}

