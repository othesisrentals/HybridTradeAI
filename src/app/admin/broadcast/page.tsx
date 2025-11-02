'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function AdminBroadcastPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'MEDIUM',
    link: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.message) {
      toast.error('Title and message are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send broadcast')
      }

      toast.success('Broadcast sent successfully to all users!')
      setFormData({
        title: '',
        message: '',
        priority: 'MEDIUM',
        link: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to send broadcast')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Send Broadcast</h1>
        <p className="text-muted-foreground mt-2">
          Send a notification to all users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Broadcast Message</CardTitle>
          <CardDescription>
            This message will be sent to all users as a notification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Broadcast title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Broadcast message..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={5}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                placeholder="/dashboard/investments"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Optional link users can click from the notification
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
