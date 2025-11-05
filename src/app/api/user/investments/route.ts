import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = { userId: session.user.id }
    if (status) {
      where.status = status
    }

    const investments = await prisma.investment.findMany({
      where,
      include: {
        plan: true,
        profitHistory: {
          orderBy: { distributedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { profitHistory: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ investments })
  } catch (error) {
    console.error('Investments fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    )
  }
}

