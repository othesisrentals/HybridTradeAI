'use client'

import { useSession, signOut } from '../../../lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bell, LogOut, User, Settings } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function Navbar ()
{
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () =>
  {
    await signOut()
    router.push( '/auth/signin' )
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link 
            href={session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'} 
            className="flex items-center gap-2"
          >
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              HybridTradeAI
            </span>
          </Link>
          { session && (
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/investments"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Investments
              </Link>
              <Link
                href="/dashboard/ads"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Ads
              </Link>
              <Link
                href="/dashboard/kyc"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                KYC
              </Link>
              { ( session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN' ) && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              ) }
            </div>
          ) }
        </div>

        { session ? (
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={ handleSignOut }
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        ) }
      </div>
    </nav>
  )
}
