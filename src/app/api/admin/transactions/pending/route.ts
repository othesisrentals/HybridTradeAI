import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // DEPOSIT or WITHDRAWAL

    const where: any = {
      status: 'PENDING',
    }

    if (type) {
      where.type = type
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            kycStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Pending transactions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending transactions' },
      { status: 500 }
    )
  }
}

