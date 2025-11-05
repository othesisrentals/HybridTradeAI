import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Navbar ()
{
  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          HybridTradeAI
        </Link>
        <div className="hidden md:flex space-x-8">
          <Link href="/public" className="text-gray-700 hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link href="/public#plans" className="text-gray-700 hover:text-blue-600 transition-colors">
            Plans
          </Link>
          <Link href="/public#features" className="text-gray-700 hover:text-blue-600 transition-colors">
            Features
          </Link>
        </div>
        <div className="flex space-x-4">
          <Link href="/auth/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
