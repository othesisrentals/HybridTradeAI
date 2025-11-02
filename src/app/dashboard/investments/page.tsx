'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, Calendar, DollarSign } from 'lucide-react'

interface Investment {
  id: string
  amount: string
  status: string
  createdAt: string
  startDate: string | null
  endDate: string | null
  totalProfitEarned: string
  nextProfitDate: string | null
  plan: {
    name: string
    type: string
    roiMin: string
    roiMax: string
  }
  _count: {
    profitHistory: number
  }
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await fetch('/api/user/investments')
        if (response.ok) {
          const data = await response.json()
          setInvestments(data.investments || [])
        }
      } catch (error) {
        console.error('Failed to fetch investments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvestments()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading investments...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Investments</h1>
        <p className="text-muted-foreground mt-2">
          Track your active and completed investments
        </p>
      </div>

      {investments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No investments yet</p>
            <a href="/dashboard/deposit" className="text-primary hover:underline">
              Make your first deposit
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {investments.map((investment) => (
            <Card key={investment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{investment.plan.name}</CardTitle>
                  <Badge
                    variant={
                      investment.status === 'ACTIVE'
                        ? 'default'
                        : investment.status === 'COMPLETED'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {investment.status}
                  </Badge>
                </div>
                <CardDescription>
                  ROI Range: {investment.plan.roiMin}% - {investment.plan.roiMax}% per week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invested Amount</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(investment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Earned</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(investment.totalProfitEarned)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Started
                    </span>
                    <span>
                      {investment.startDate
                        ? formatDate(investment.startDate)
                        : 'Pending'}
                    </span>
                  </div>
                  {investment.nextProfitDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Next Profit
                      </span>
                      <span>{formatDate(investment.nextProfitDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Profit Distributions
                    </span>
                    <span>{investment._count.profitHistory}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
