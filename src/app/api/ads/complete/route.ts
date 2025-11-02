import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { completeAdTask } from '@/lib/ads/admob'
import { z } from 'zod'

const completeSchema = z.object({
  adTaskId: z.string(),
  proofUrl: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { adTaskId, proofUrl } = completeSchema.parse(body)

    const completion = await completeAdTask(session.user.id, adTaskId, proofUrl)

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

    console.error('Ad task completion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete ad task' },
      { status: 500 }
    )
  }
}
