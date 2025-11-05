import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { createNotification } from '@/lib/notifications/notifications'
import { z } from 'zod'

const broadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  link: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, message, priority, link } = broadcastSchema.parse(body)

    // Create broadcast notification (userId is null for broadcasts)
    const notification = await createNotification({
      userId: null, // null = broadcast to all users
      type: 'ADMIN_BROADCAST',
      priority: priority || 'MEDIUM',
      title,
      message,
      link,
    })

    return NextResponse.json({
      success: true,
      notification,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Broadcast error:', error)
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    )
  }
}

