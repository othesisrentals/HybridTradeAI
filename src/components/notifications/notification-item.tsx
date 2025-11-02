'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

interface NotificationItemProps {
  notification: {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    createdAt: string
    link?: string
    priority?: string
  }
  onRead: () => void
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onRead()
    }
  }

  const content = (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent ${
        !notification.read ? 'border-primary/50 bg-primary/5' : ''
      }`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {notification.read ? (
                <Circle className="h-4 w-4 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              {notification.priority === 'URGENT' && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(notification.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>
  }

  return content
}
