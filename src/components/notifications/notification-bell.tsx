'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationCenter } from './notification-center'
import { useUnreadNotificationCount } from '@/hooks/useUserNotifications'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { count } = useUnreadNotificationCount()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {count > 9 ? '9+' : count}
          </Badge>
        )}
      </Button>
      <NotificationCenter open={open} onOpenChange={setOpen} />
    </>
  )
}
