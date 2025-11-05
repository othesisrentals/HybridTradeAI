'use client'

import React, { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

export default function SignInPage ()
{
  const router = useRouter()
  const [ loading, setLoading ] = useState( false )
  const [ formData, setFormData ] = useState( {
    email: '',
    password: '',
  } )

  const handleSubmit = async ( e: React.FormEvent ) =>
  {
    e.preventDefault()
    setLoading( true )

    try
    {
      const result = await signIn( 'credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      } )

      if ( result?.error )
      {
        toast.error( 'Invalid email or password' )
      } else if ( result?.ok )
      {
        toast.success( 'Signed in successfully' )
        
        // Fetch session to get user role and redirect accordingly
        const response = await fetch('/api/auth/session')
        const session = await response.json()
        
        // Redirect based on user role
        if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch ( error )
    {
      toast.error( 'An error occurred. Please try again.' )
    } finally
    {
      setLoading( false )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={ handleSubmit } className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={ formData.email }
                onChange={ ( e ) => setFormData( { ...formData, email: e.target.value } ) }
                required
                disabled={ loading }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={ formData.password }
                onChange={ ( e ) => setFormData( { ...formData, password: e.target.value } ) }
                required
                disabled={ loading }
              />
            </div>
            <Button type="submit" className="w-full" disabled={ loading }>
              { loading ? 'Signing in...' : 'Sign In' }
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
