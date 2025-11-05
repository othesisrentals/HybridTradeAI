import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getAvailableAdTasks } from '@/lib/ads/admob'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await getAvailableAdTasks(session.user.id)

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Ad tasks fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad tasks' },
      { status: 500 }
    )
  }
}

