'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

interface ProvidersProps
{
  children: React.ReactNode
  session?: any
}

export function Providers ( { children, session }: ProvidersProps )
{
  return (
    <SessionProvider session={ session }>
      { children }
      <Toaster position="top-right" />
    </SessionProvider>
  )
}
