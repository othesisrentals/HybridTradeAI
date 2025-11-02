import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Shield, Zap, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">HybridTradeAI</span>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            AI-Powered Investment
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Platform
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Grow your wealth with automated trading strategies powered by artificial intelligence. 
            Weekly profits, transparent operations, and secure investments.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8">
                Start Investing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-lg px-8">
                View Plans
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="glass rounded-2xl p-8 text-white">
            <TrendingUp className="h-12 w-12 text-purple-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3">High Returns</h3>
            <p className="text-gray-300">
              Earn 5-25% weekly ROI based on your investment plan. Automated profit distribution every Sunday.
            </p>
          </div>
          <div className="glass rounded-2xl p-8 text-white">
            <Shield className="h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Secure & Transparent</h3>
            <p className="text-gray-300">
              KYC verification, reserve buffer system, and real-time transaction tracking for complete peace of mind.
            </p>
          </div>
          <div className="glass rounded-2xl p-8 text-white">
            <Zap className="h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Multiple Revenue Streams</h3>
            <p className="text-gray-300">
              Diversified income from algorithmic trading, crypto staking, copy-trading, and ad tasks.
            </p>
          </div>
        </div>

        {/* Plans Preview */}
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Choose Your Investment Plan
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="glass rounded-2xl p-8 text-white hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">??</div>
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-300 mb-4">Perfect for beginners</p>
              <div className="text-3xl font-bold mb-4">5-12% <span className="text-lg font-normal">weekly</span></div>
              <div className="text-gray-300 mb-6">$100 - $5,000</div>
              <Link href="/auth/register">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="glass rounded-2xl p-8 text-white hover:scale-105 transition-transform border-2 border-purple-500">
              <div className="text-4xl mb-4">??</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-gray-300 mb-4">For experienced investors</p>
              <div className="text-3xl font-bold mb-4">8-18% <span className="text-lg font-normal">weekly</span></div>
              <div className="text-gray-300 mb-6">$5,000 - $50,000</div>
              <Link href="/auth/register">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Elite */}
            <div className="glass rounded-2xl p-8 text-white hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">??</div>
              <h3 className="text-2xl font-bold mb-2">Elite</h3>
              <p className="text-gray-300 mb-4">Maximum returns</p>
              <div className="text-3xl font-bold mb-4">12-25% <span className="text-lg font-normal">weekly</span></div>
              <div className="text-gray-300 mb-6">$50,000+</div>
              <Link href="/auth/register">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-32 text-center text-gray-400 pb-12">
          <p>? 2025 HybridTradeAI. All rights reserved.</p>
          <p className="mt-2">Investment involves risk. Past performance is not indicative of future results.</p>
        </div>
      </div>
    </div>
  );
}
