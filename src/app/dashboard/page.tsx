import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/currency';
import { TrendingUp, Wallet, DollarSign, Activity } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user data
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      investments: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
      },
      transactions: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          investment: {
            include: { plan: true },
          },
        },
      },
    },
  });

  if (!userData) {
    redirect('/auth/login');
  }

  // Calculate stats
  const totalInvested = userData.investedBalance;
  const availableBalance = userData.withdrawalBalance;
  const totalBalance = totalInvested + availableBalance;
  const activeInvestments = userData.investments.length;

  // Calculate total earnings
  const totalEarnings = await prisma.profitHistory.aggregate({
    where: { userId: user.id },
    _sum: { netProfit: true },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {userData.name || user.email}!
          </h1>
          <p className="text-gray-300">Here's your investment overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-purple-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Invested + Available
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-blue-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Invested
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totalInvested)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {activeInvestments} active {activeInvestments === 1 ? 'investment' : 'investments'}
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-green-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Available
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(availableBalance)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Ready to withdraw
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-yellow-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total Earned
              </CardTitle>
              <Activity className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totalEarnings._sum.netProfit || 0)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                All-time profits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Investments */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="text-white">Active Investments</CardTitle>
          </CardHeader>
          <CardContent>
            {userData.investments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No active investments yet.</p>
                <p className="mt-2">Start investing to see your portfolio grow!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userData.investments.map((investment) => (
                  <div
                    key={investment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{investment.plan.icon}</span>
                        <div>
                          <h3 className="text-white font-medium">
                            {investment.plan.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {investment.plan.minRoiPercent}% - {investment.plan.maxRoiPercent}% weekly ROI
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">
                        {formatCurrency(investment.currentValue)}
                      </div>
                      <div className="text-sm text-green-400">
                        +{formatCurrency(investment.totalEarned)} earned
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {userData.transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No transactions yet.
              </div>
            ) : (
              <div className="space-y-3">
                {userData.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
