import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { createNotification } from '@/lib/notifications/notifications'
import { z } from 'zod'

const kycSubmitSchema = z.object({
  documentType: z.enum(['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID']),
  documentNumber: z.string().optional(),
  frontImageUrl: z.string().url(),
  backImageUrl: z.string().url().optional(),
  selfieImageUrl: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = kycSubmitSchema.parse(body)

    // Create KYC document
    const document = await prisma.kycDocument.create({
      data: {
        userId: session.user.id,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        frontImageUrl: data.frontImageUrl,
        backImageUrl: data.backImageUrl,
        selfieImageUrl: data.selfieImageUrl,
        status: 'PENDING',
      },
    })

    // Update user KYC status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        kycStatus: 'UNDER_REVIEW',
      },
    })

    // Create notification
    await createNotification({
      userId: session.user.id,
      type: 'KYC_SUBMITTED',
      priority: 'MEDIUM',
      title: 'KYC Documents Submitted',
      message: 'Your KYC documents have been submitted and are under review.',
      link: '/dashboard/kyc',
    })

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('KYC submit error:', error)
    return NextResponse.json(
      { error: 'Failed to submit KYC' },
      { status: 500 }
    )
  }
}

