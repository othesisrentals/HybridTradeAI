import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { profitEngine } from '@/lib/profit/engine';
import { logger } from '@/lib/utils/logger';

/**
 * Admin endpoint to manually trigger profit distribution
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    logger.info('Manual profit distribution triggered', { adminId: admin.id });

    const result = await profitEngine.distributeWeeklyProfits();

    return NextResponse.json({
      success: true,
      message: 'Profit distribution completed',
      result,
    });
  } catch (error: any) {
    logger.error('Manual profit distribution failed', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to distribute profits',
      },
      { status: error.statusCode || 500 }
    );
  }
}
