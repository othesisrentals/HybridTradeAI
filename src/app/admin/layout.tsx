import { redirect } from 'next/navigation'
import React from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { Navbar } from '@/components/layout/navbar'

export default async function AdminLayout ( {
  children,
}: {
  children: React.ReactNode
} )
{
  const session = await getServerSession( authOptions )

  if ( !session )
  {
    redirect( '/auth/signin' )
  }

  if ( session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' )
  {
    redirect( '/dashboard' )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">{ children }</main>
    </div>
  )
}
