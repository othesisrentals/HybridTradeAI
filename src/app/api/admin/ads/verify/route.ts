import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { verifyAdTaskCompletion } from '@/lib/ads/admob'
import { z } from 'zod'

const verifySchema = z.object({
  completionId: z.string(),
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
    const { completionId, approved, rejectionReason } = verifySchema.parse(body)

    const completion = await verifyAdTaskCompletion(
      completionId,
      session.user.id,
      approved,
      rejectionReason
    )

    return NextResponse.json({
      success: true,
      completion,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Ad verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify ad task' },
      { status: 500 }
    )
  }
}
