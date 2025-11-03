'use client'

import React from 'react'
import { SessionProvider } from '../../lib/auth'
import { Toaster } from 'react-hot-toast'

export function Providers ( { children }: { children: React.ReactNode } )
{
  return (
    <SessionProvider>
      { children }
      <Toaster position="top-right" />
    </SessionProvider>
  )
}
