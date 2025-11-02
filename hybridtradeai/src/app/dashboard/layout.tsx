import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">
              HybridTradeAI
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="flex flex-col text-right text-sm text-gray-700">
              <span>{user.email}</span>
              <span
                className={`mt-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.role === "ADMIN" || user.role === "SUPER_ADMIN"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
