import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { investmentService } from '@/lib/investment/service';
import { profitEngine } from '@/lib/profit/engine';
import { adTaskService } from '@/lib/ads/service';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const [
      userStats,
      investmentStats,
      profitStats,
      adStats,
      pendingDeposits,
      recentTransactions,
    ] = await Promise.all([
      // User stats
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      // Investment stats
      investmentService.getInvestmentStats(),
      // Profit stats
      profitEngine.getProfitAnalytics(),
      // Ad stats
      adTaskService.getAdminAnalytics(),
      // Pending deposits count
      prisma.investment.count({
        where: { status: 'PENDING_DEPOSIT' },
      }),
      // Recent transactions
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const totalUsers = userStats.reduce((sum, stat) => sum + stat._count, 0);

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: userStats,
      },
      investments: investmentStats,
      profits: profitStats,
      adTasks: adStats,
      pending: {
        deposits: pendingDeposits,
      },
      recentTransactions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: error.statusCode || 500 }
    );
  }
}
