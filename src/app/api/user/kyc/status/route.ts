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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        kycStatus: true,
        kycDocuments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            documentType: true,
            documentNumber: true,
            frontImageUrl: true,
            backImageUrl: true,
            selfieImageUrl: true,
            status: true,
            rejectionReason: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: user.kycStatus,
      document: user.kycDocuments[0] || null,
    })
  } catch (error) {
    console.error('KYC status fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
      { status: 500 }
    )
  }
}

