'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function WithdrawPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [withdrawalBalance, setWithdrawalBalance] = useState('0')
  const [kycStatus, setKycStatus] = useState('PENDING')
  const [formData, setFormData] = useState({
    amount: '',
    bankAccount: '',
    bankName: '',
    accountName: '',
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats')
        if (response.ok) {
          const data = await response.json()
          setWithdrawalBalance(data.withdrawalBalance)
          setKycStatus(data.kycStatus)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (kycStatus !== 'APPROVED') {
      toast.error('KYC verification required for withdrawals')
      router.push('/dashboard/kyc')
      return
    }

    const amountNum = parseFloat(formData.amount)
    const balanceNum = parseFloat(withdrawalBalance)

    if (amountNum < 10) {
      toast.error('Minimum withdrawal amount is $10')
      return
    }

    if (amountNum > balanceNum) {
      toast.error('Insufficient withdrawal balance')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          bankAccount: formData.bankAccount,
          bankName: formData.bankName,
          accountName: formData.accountName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create withdrawal')
      }

      toast.success('Withdrawal request submitted! Waiting for admin approval.')
      router.push('/dashboard/transactions')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create withdrawal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Withdraw Funds</h1>
        <p className="text-muted-foreground mt-2">
          Withdraw your profits to your bank account
        </p>
      </div>

      {kycStatus !== 'APPROVED' && (
        <Alert>
          <AlertDescription>
            KYC verification is required for withdrawals. Please{' '}
            <a href="/dashboard/kyc" className="text-primary underline">
              verify your identity
            </a>{' '}
            first.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
          <CardDescription>
            Available balance: {formatCurrency(withdrawalBalance)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <Input
                id="amount"
                type="number"
                min="10"
                max={withdrawalBalance}
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                disabled={loading || kycStatus !== 'APPROVED'}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: $10.00
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                type="text"
                placeholder="Your Bank Name"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                required
                disabled={loading || kycStatus !== 'APPROVED'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                type="text"
                placeholder="Account Holder Name"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                required
                disabled={loading || kycStatus !== 'APPROVED'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">Account Number</Label>
              <Input
                id="bankAccount"
                type="text"
                placeholder="Bank Account Number"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                required
                disabled={loading || kycStatus !== 'APPROVED'}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || kycStatus !== 'APPROVED'}
            >
              {loading ? 'Processing...' : 'Submit Withdrawal Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
