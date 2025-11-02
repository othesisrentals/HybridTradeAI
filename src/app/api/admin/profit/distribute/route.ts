import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { distributeWeeklyProfits } from '@/lib/profit/distribution'

/**
 * Manual trigger for weekly profit distribution
 * Should normally be run via cron job
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await distributeWeeklyProfits()

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Profit distribution error:', error)
    return NextResponse.json(
      { error: 'Failed to distribute profits' },
      { status: 500 }
    )
  }
}
