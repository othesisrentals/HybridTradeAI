'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'react-hot-toast'
import { CheckCircle2, XCircle, Clock, Upload, FileText } from 'lucide-react'

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState('PENDING')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    documentType: 'PASSPORT',
    documentNumber: '',
    frontImageUrl: '',
    backImageUrl: '',
    selfieImageUrl: '',
  })

  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        const response = await fetch('/api/user/kyc/status')
        if (response.ok) {
          const data = await response.json()
          setKycStatus(data.status)
          if (data.document) {
            setFormData({
              documentType: data.document.documentType,
              documentNumber: data.document.documentNumber || '',
              frontImageUrl: data.document.frontImageUrl,
              backImageUrl: data.document.backImageUrl || '',
              selfieImageUrl: data.document.selfieImageUrl || '',
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch KYC status:', error)
      }
    }

    fetchKYCStatus()
  }, [])

  const handleFileUpload = async (file: File, type: 'front' | 'back' | 'selfie') => {
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll use a data URL approach
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back' | 'selfie'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    const url = await handleFileUpload(file, type)
    setFormData((prev) => ({
      ...prev,
      [`${type}ImageUrl`]: url,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.frontImageUrl) {
      toast.error('Please upload front image of your document')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit KYC')
      }

      toast.success('KYC documents submitted! Waiting for admin approval.')
      setKycStatus('PENDING')
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit KYC')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (kycStatus) {
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
      case 'UNDER_REVIEW':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-muted-foreground mt-2">
          Verify your identity to enable withdrawals and investments
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verification Status</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            {kycStatus === 'APPROVED'
              ? 'Your identity has been verified. You can now make withdrawals.'
              : kycStatus === 'REJECTED'
              ? 'Your verification was rejected. Please resubmit your documents.'
              : kycStatus === 'UNDER_REVIEW'
              ? 'Your documents are being reviewed by our team.'
              : 'Please submit your identity documents for verification.'}
          </CardDescription>
        </CardHeader>
      </Card>

      {kycStatus !== 'APPROVED' && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Documents</CardTitle>
            <CardDescription>
              Upload clear images of your identity documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <select
                  id="documentType"
                  value={formData.documentType}
                  onChange={(e) =>
                    setFormData({ ...formData, documentType: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={loading}
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                  <option value="NATIONAL_ID">National ID</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentNumber">Document Number</Label>
                <Input
                  id="documentNumber"
                  type="text"
                  placeholder="Enter document number"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frontImage">Front Image *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="frontImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'front')}
                    disabled={loading}
                    className="flex-1"
                  />
                  {formData.frontImageUrl && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Uploaded
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload front side of your document
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backImage">Back Image (if applicable)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="backImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'back')}
                    disabled={loading}
                    className="flex-1"
                  />
                  {formData.backImageUrl && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Uploaded
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selfieImage">Selfie Photo *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="selfieImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'selfie')}
                    disabled={loading}
                    className="flex-1"
                  />
                  {formData.selfieImageUrl && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Uploaded
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Take a selfie holding your document
                </p>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Ensure all images are clear and readable. Documents
                  must be valid and not expired. Your information will be kept secure and
                  confidential.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
