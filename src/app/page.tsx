import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getRedirectPath } from '@/lib/auth/redirect'

export default async function Home ()
{
  const session = await getServerSession( authOptions )

  if ( session )
  {
    // Redirect based on user role using utility function
    const redirectPath = getRedirectPath(session.user.role)
    redirect(redirectPath)
  }

  redirect( '/public' )
}
