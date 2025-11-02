import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      pendingDeposits,
      pendingWithdrawals,
      pendingKYC,
      totalAUMResult,
      totalUsers,
      activeInvestments,
    ] = await Promise.all([
      prisma.transaction.count({
        where: { type: 'DEPOSIT', status: 'PENDING' },
      }),
      prisma.transaction.count({
        where: { type: 'WITHDRAWAL', status: 'PENDING' },
      }),
      prisma.kycDocument.count({
        where: { status: 'PENDING' },
      }),
      prisma.investment.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
      }),
      prisma.user.count(),
      prisma.investment.count({
        where: { status: 'ACTIVE' },
      }),
    ])

    return NextResponse.json({
      pendingDeposits,
      pendingWithdrawals,
      pendingKYC,
      totalAUM: totalAUMResult._sum.amount?.toString() || '0',
      totalUsers,
      activeInvestments,
    })
  } catch (error) {
    console.error('Admin stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}
