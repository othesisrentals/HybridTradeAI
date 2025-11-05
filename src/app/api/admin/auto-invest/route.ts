import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { autoInvestApprovedDeposits } from '@/lib/profit/distribution'

/**
 * Manual trigger for auto-investment
 * Should normally run automatically after deposit approval
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await autoInvestApprovedDeposits()

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Auto-invest error:', error)
    return NextResponse.json(
      { error: 'Failed to process auto-investment' },
      { status: 500 }
    )
  }
}

