import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Home,
  TrendingUp,
  Wallet,
  Gift,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Sparkles,
} from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/investments', label: 'Investments', icon: TrendingUp },
    { href: '/dashboard/transactions', label: 'Transactions', icon: Wallet },
    { href: '/dashboard/tasks', label: 'Ad Tasks', icon: Gift },
    { href: '/dashboard/ai-support', label: 'AI Support', icon: MessageSquare },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold text-white">HybridTradeAI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </div>
              <span className="hidden md:block">{user.name || user.email}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Navigation */}
      <div className="flex">
        <aside className="w-64 glass min-h-[calc(100vh-73px)] p-6 hidden md:block">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-full">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
