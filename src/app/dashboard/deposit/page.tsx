'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

const PLANS = [
  {
    type: 'STARTER',
    name: 'Starter Plan',
    min: 100,
    max: 5000,
    roiMin: 5,
    roiMax: 12,
  },
  {
    type: 'PRO',
    name: 'Pro Plan',
    min: 5000,
    max: 50000,
    roiMin: 8,
    roiMax: 18,
  },
  {
    type: 'ELITE',
    name: 'Elite Plan',
    min: 50000,
    max: 500000,
    roiMin: 12,
    roiMax: 25,
  },
]

export default function DepositPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('STARTER')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('stripe')

  const plan = PLANS.find((p) => p.type === selectedPlan)!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = parseFloat(amount)
    if (amountNum < plan.min || amountNum > plan.max) {
      toast.error(`Amount must be between ${formatCurrency(plan.min)} and ${formatCurrency(plan.max)}`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          planType: selectedPlan,
          paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create deposit')
      }

      toast.success('Deposit request submitted! Waiting for admin approval.')
      router.push('/dashboard/transactions')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create deposit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Make a Deposit</h1>
        <p className="text-muted-foreground mt-2">
          Choose an investment plan and deposit amount
        </p>
      </div>

      <Tabs value={selectedPlan} onValueChange={setSelectedPlan} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {PLANS.map((p) => (
            <TabsTrigger key={p.type} value={p.type}>
              {p.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {PLANS.map((p) => (
          <TabsContent key={p.type} value={p.type}>
            <Card>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>
                  ROI Range: {p.roiMin}% - {p.roiMax}% per week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Deposit Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={p.min}
                      max={p.max}
                      step="0.01"
                      placeholder={`${formatCurrency(p.min)} - ${formatCurrency(p.max)}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum: {formatCurrency(p.min)} | Maximum: {formatCurrency(p.max)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={loading}
                    >
                      <option value="stripe">Stripe (Credit Card)</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weekly ROI Range:</span>
                      <span className="font-medium">{p.roiMin}% - {p.roiMax}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Management Fee:</span>
                      <span className="font-medium">10% of profits</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">12 weeks</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit Deposit Request'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
