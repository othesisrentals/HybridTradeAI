import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export default async function Home ()
{
  const session = await getServerSession( authOptions )

  if ( session )
  {
    // Redirect based on user role
    if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  redirect( '/public' )
}
