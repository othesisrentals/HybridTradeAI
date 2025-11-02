import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch {
    redirect('/dashboard');
  }

  // Fetch admin stats
  const [
    totalUsers,
    activeInvestments,
    pendingDeposits,
    totalAUM,
    totalProfitsDistributed,
    recentTransactions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.investment.count({ where: { status: 'ACTIVE' } }),
    prisma.investment.count({ where: { status: 'PENDING_DEPOSIT' } }),
    prisma.investment.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { currentValue: true },
    }),
    prisma.profitHistory.aggregate({
      _sum: { netProfit: true },
    }),
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">Platform overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-blue-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="glass border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Active Investments
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {activeInvestments}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total AUM
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totalAUM._sum.currentValue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-orange-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Pending Deposits
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {pendingDeposits}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profits Distributed */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="text-white">Platform Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Profits Distributed</span>
              <span className="text-xl font-bold text-green-400">
                {formatCurrency(totalProfitsDistributed._sum.netProfit || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div>
                    <p className="text-white font-medium">
                      {transaction.user.name || transaction.user.email}
                    </p>
                    <p className="text-sm text-gray-400">
                      {transaction.description}
                    </p>
                  </div>
                  <div
                    className={`font-bold ${
                      transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {transaction.amount >= 0 ? '+' : ''}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
