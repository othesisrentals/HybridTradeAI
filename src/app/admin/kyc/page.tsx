'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock, FileText, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface KYCDocument {
  id: string
  userId: string
  documentType: string
  documentNumber: string | null
  frontImageUrl: string
  backImageUrl: string | null
  selfieImageUrl: string | null
  status: string
  createdAt: string
  user: {
    email: string
    name: string | null
  }
}

export default function AdminKYCPage() {
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/kyc/pending')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to fetch KYC documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approved: boolean) => {
    if (!selectedDocument) return

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/kyc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          approved,
          rejectionReason: approved ? undefined : rejectionReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process KYC')
      }

      toast.success(
        approved
          ? 'KYC approved successfully'
          : 'KYC rejected successfully'
      )

      setReviewDialogOpen(false)
      setSelectedDocument(null)
      setRejectionReason('')
      fetchDocuments()
    } catch (error: any) {
      toast.error(error.message || 'Failed to process KYC')
    } finally {
      setProcessing(false)
    }
  }

  const openReviewDialog = (document: KYCDocument) => {
    setSelectedDocument(document)
    setRejectionReason('')
    setReviewDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading KYC documents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground mt-2">
          Review and verify user identity documents
        </p>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No pending KYC documents</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle>{document.user.name || document.user.email}</CardTitle>
                  </div>
                  {getStatusBadge(document.status)}
                </div>
                <CardDescription>
                  {document.documentType.replace('_', ' ')} ? {formatDateTime(document.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Front Image</p>
                    <a
                      href={document.frontImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={document.frontImageUrl}
                        alt="Front"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </a>
                  </div>
                  {document.backImageUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Back Image</p>
                      <a
                        href={document.backImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={document.backImageUrl}
                          alt="Back"
                          className="w-full h-32 object-cover rounded border"
                        />
                      </a>
                    </div>
                  )}
                </div>

                {document.selfieImageUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Selfie</p>
                    <a
                      href={document.selfieImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={document.selfieImageUrl}
                        alt="Selfie"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </a>
                  </div>
                )}

                {document.documentNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Document Number</p>
                    <p className="font-mono text-sm">{document.documentNumber}</p>
                  </div>
                )}

                {document.status === 'PENDING' && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      onClick={() => openReviewDialog(document)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review KYC Document</DialogTitle>
            <DialogDescription>
              {selectedDocument && (
                <>
                  Review KYC submission for {selectedDocument.user.name || selectedDocument.user.email}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Front Image</p>
                  <img
                    src={selectedDocument.frontImageUrl}
                    alt="Front"
                    className="w-full rounded border"
                  />
                </div>
                {selectedDocument.backImageUrl && (
                  <div>
                    <p className="text-sm font-medium mb-2">Back Image</p>
                    <img
                      src={selectedDocument.backImageUrl}
                      alt="Back"
                      className="w-full rounded border"
                    />
                  </div>
                )}
              </div>

              {selectedDocument.selfieImageUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Selfie</p>
                  <img
                    src={selectedDocument.selfieImageUrl}
                    alt="Selfie"
                    className="w-full max-w-md rounded border"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why this KYC is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleApprove(false)}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button onClick={() => handleApprove(true)} disabled={processing}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
