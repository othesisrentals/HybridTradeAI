'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Play, CheckCircle2, Clock, Video, FileText, Download, Gift } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AdTask {
  id: string
  title: string
  description: string
  type: string
  rewardAmount: string
  dailyLimit: number | null
  cooldownHours: number
  requiresVerification: boolean
  status: string
  completions: Array<{
    completedAt: string
    status: string
  }>
}

export default function AdTasksPage() {
  const [tasks, setTasks] = useState<AdTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<AdTask | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/ads/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch ad tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'VIDEO_AD':
        return <Video className="h-5 w-5" />
      case 'SURVEY':
        return <FileText className="h-5 w-5" />
      case 'APP_INSTALL':
        return <Download className="h-5 w-5" />
      case 'OFFER_WALL':
        return <Gift className="h-5 w-5" />
      default:
        return <Play className="h-5 w-5" />
    }
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'VIDEO_AD':
        return 'Video Ad'
      case 'SURVEY':
        return 'Survey'
      case 'APP_INSTALL':
        return 'App Install'
      case 'OFFER_WALL':
        return 'Offer Wall'
      default:
        return type
    }
  }

  const canCompleteTask = (task: AdTask) => {
    if (task.status !== 'ACTIVE') return false
    if (task.dailyLimit) {
      const todayCompletions = task.completions.filter(
        (c) => new Date(c.completedAt).toDateString() === new Date().toDateString()
      ).length
      if (todayCompletions >= task.dailyLimit) return false
    }
    return true
  }

  const handleCompleteTask = async () => {
    if (!selectedTask) return

    setCompleting(true)

    try {
      const response = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adTaskId: selectedTask.id,
          proofUrl: proofUrl || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete task')
      }

      toast.success(
        selectedTask.requiresVerification
          ? 'Task completed! Waiting for verification.'
          : `Task completed! ${formatCurrency(selectedTask.rewardAmount)} credited.`
      )

      setSelectedTask(null)
      setProofUrl('')
      fetchTasks()
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete task')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading ad tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ad Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Complete tasks to earn extra rewards
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No ad tasks available at the moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id} className={!canCompleteTask(task) ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTaskIcon(task.type)}
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                  </div>
                  <Badge variant="secondary">{getTaskTypeLabel(task.type)}</Badge>
                </div>
                <CardDescription>{task.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reward</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(task.rewardAmount)}
                  </span>
                </div>

                {task.dailyLimit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Daily Limit</span>
                    <span>
                      {task.completions.filter(
                        (c) =>
                          new Date(c.completedAt).toDateString() ===
                          new Date().toDateString()
                      ).length}{' '}
                      / {task.dailyLimit}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cooldown</span>
                  <span>{task.cooldownHours} hours</span>
                </div>

                {task.requiresVerification && (
                  <div className="text-xs text-yellow-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Requires verification
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => setSelectedTask(task)}
                  disabled={!canCompleteTask(task)}
                >
                  {canCompleteTask(task) ? 'Complete Task' : 'Unavailable'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>{selectedTask?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reward Amount</span>
                <span className="text-lg font-bold text-green-600">
                  {selectedTask && formatCurrency(selectedTask.rewardAmount)}
                </span>
              </div>
            </div>

            {selectedTask?.requiresVerification && (
              <div className="space-y-2">
                <Label htmlFor="proofUrl">Proof URL (Optional)</Label>
                <Input
                  id="proofUrl"
                  type="url"
                  placeholder="https://example.com/screenshot.png"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot or proof of completion
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              {selectedTask?.requiresVerification
                ? 'Your completion will be reviewed by an admin before rewards are credited.'
                : 'Rewards will be credited immediately upon completion.'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteTask} disabled={completing}>
              {completing ? 'Completing...' : 'Complete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
