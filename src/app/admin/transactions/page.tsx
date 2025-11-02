'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Transaction {
  id: string
  type: string
  status: string
  amount: string
  description: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
    kycStatus: string
  }
}

export default function AdminTransactionsPage() {
  const [deposits, setDeposits] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const [depositsRes, withdrawalsRes] = await Promise.all([
        fetch('/api/admin/transactions/pending?type=DEPOSIT'),
        fetch('/api/admin/transactions/pending?type=WITHDRAWAL'),
      ])

      if (depositsRes.ok) {
        const depositsData = await depositsRes.json()
        setDeposits(depositsData.transactions || [])
      }

      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json()
        setWithdrawals(withdrawalsData.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approved: boolean) => {
    if (!selectedTransaction) return

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/transactions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          approved,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process transaction')
      }

      toast.success(
        approved
          ? 'Transaction approved successfully'
          : 'Transaction rejected successfully'
      )

      setApproveDialogOpen(false)
      setSelectedTransaction(null)
      setNotes('')
      fetchTransactions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to process transaction')
    } finally {
      setProcessing(false)
    }
  }

  const openApproveDialog = (transaction: Transaction, approved: boolean) => {
    setSelectedTransaction(transaction)
    setNotes('')
    setApproveDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Transaction Management</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve pending deposits and withdrawals
        </p>
      </div>

      <Tabs defaultValue="deposits" className="w-full">
        <TabsList>
          <TabsTrigger value="deposits">
            Deposits ({deposits.length})
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            Withdrawals ({withdrawals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposits" className="space-y-4">
          {deposits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending deposits</p>
              </CardContent>
            </Card>
          ) : (
            deposits.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <ArrowDownRight className="h-8 w-8 text-green-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{transaction.user.name || transaction.user.email}</h3>
                          <Badge variant={transaction.user.kycStatus === 'APPROVED' ? 'default' : 'outline'}>
                            KYC: {transaction.user.kycStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openApproveDialog(transaction, true)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openApproveDialog(transaction, false)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          {withdrawals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending withdrawals</p>
              </CardContent>
            </Card>
          ) : (
            withdrawals.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <ArrowUpRight className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{transaction.user.name || transaction.user.email}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => openApproveDialog(transaction, true)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openApproveDialog(transaction, false)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction?.type === 'DEPOSIT' ? 'Approve' : 'Reject'} Transaction
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction && (
                <>
                  {selectedTransaction.type} of {formatCurrency(selectedTransaction.amount)} by{' '}
                  {selectedTransaction.user.name || selectedTransaction.user.email}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedTransaction?.type === 'DEPOSIT' ? 'default' : 'destructive'}
              onClick={() => handleApprove(selectedTransaction?.type === 'DEPOSIT')}
              disabled={processing}
            >
              {processing
                ? 'Processing...'
                : selectedTransaction?.type === 'DEPOSIT'
                ? 'Approve Deposit'
                : 'Reject Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
