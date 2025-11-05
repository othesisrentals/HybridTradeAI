import Link from 'next/link'

export default function Footer ()
{
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-blue-400 mb-4">HybridTradeAI</h3>
            <p className="text-gray-300">
              AI-powered investment platform for modern wealth building.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/public" className="hover:text-white">Home</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white">Sign Up</Link></li>
              <li><Link href="/auth/signin" className="hover:text-white">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="mailto:support@hybridtradeai.com" className="hover:text-white">Email Support</a></li>
              <li><span>24/7 Available</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-300">
              <li><span>Privacy Policy</span></li>
              <li><span>Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 HybridTradeAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
