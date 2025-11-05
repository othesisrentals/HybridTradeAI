import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { dbTransaction } from '@/lib/db/transactions'
import { createNotification } from '@/lib/notifications/notifications'
import { z } from 'zod'

const approveSchema = z.object({
  documentId: z.string(),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { documentId, approved, rejectionReason } = approveSchema.parse(body)

    const result = await dbTransaction(async (tx) => {
      const document = await tx.kycDocument.findUnique({
        where: { id: documentId },
        include: { user: true },
      })

      if (!document) {
        throw new Error('KYC document not found')
      }

      if (approved) {
        // Approve KYC
        await tx.kycDocument.update({
          where: { id: documentId },
          data: {
            status: 'APPROVED',
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
          },
        })

        // Update user KYC status
        await tx.user.update({
          where: { id: document.userId },
          data: {
            kycStatus: 'APPROVED',
            kycVerifiedAt: new Date(),
          },
        })

        await createNotification({
          userId: document.userId,
          type: 'KYC_APPROVED',
          priority: 'HIGH',
          title: 'KYC Verification Approved',
          message: 'Your KYC documents have been approved. You can now make investments and withdrawals.',
          link: '/dashboard/kyc',
        })
      } else {
        // Reject KYC
        await tx.kycDocument.update({
          where: { id: documentId },
          data: {
            status: 'REJECTED',
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            rejectionReason,
          },
        })

        await tx.user.update({
          where: { id: document.userId },
          data: {
            kycStatus: 'REJECTED',
          },
        })

        await createNotification({
          userId: document.userId,
          type: 'KYC_REJECTED',
          priority: 'HIGH',
          title: 'KYC Verification Rejected',
          message: `Your KYC verification was rejected. ${rejectionReason || 'Please resubmit your documents.'}`,
          link: '/dashboard/kyc',
        })
      }

      return document
    })

    return NextResponse.json({
      success: true,
      document: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('KYC approval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process KYC approval' },
      { status: 500 }
    )
  }
}

