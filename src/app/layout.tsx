import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { Providers } from './providers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export const metadata: Metadata = {
  title: 'HybridTradeAI - Investment Platform',
  description: 'Professional investment platform with real-time notifications and AI support',
}

export default async function RootLayout ( {
  children,
}: {
  children: React.ReactNode
} )
{
  const session = await getServerSession( authOptions )

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers session={ session }>{ children }</Providers>
      </body>
    </html>
  )
}
