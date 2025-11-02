'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Shield, Zap, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">HybridTradeAI</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered Investment Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Invest smartly with our AI-driven platform. Earn consistent returns through
            algorithmic trading, crypto staking, and copy trading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Start Investing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose HybridTradeAI?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <CardTitle>High Returns</CardTitle>
                <CardDescription>
                  Earn up to 25% weekly returns with our Elite investment plan
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Secure & Verified</CardTitle>
                <CardDescription>
                  KYC verified accounts with bank-level security and encryption
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-4" />
                <CardTitle>AI-Powered</CardTitle>
                <CardDescription>
                  Advanced AI algorithms optimize your investment strategies
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Investment Plans */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Investment Plans</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: 'Starter',
              min: '$100',
              max: '$5,000',
              roi: '5-12%',
              duration: '12 weeks',
            },
            {
              name: 'Pro',
              min: '$5,000',
              max: '$50,000',
              roi: '8-18%',
              duration: '12 weeks',
              featured: true,
            },
            {
              name: 'Elite',
              min: '$50,000',
              max: '$500,000',
              roi: '12-25%',
              duration: '12 weeks',
            },
          ].map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className={plan.featured ? 'border-primary border-2' : ''}>
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name} Plan</CardTitle>
                  <CardDescription>
                    {plan.min} - {plan.max}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Weekly ROI</p>
                      <p className="text-2xl font-bold">{plan.roi}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-lg">{plan.duration}</p>
                    </div>
                    <Link href="/auth/signup">
                      <Button className="w-full" variant={plan.featured ? 'default' : 'outline'}>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features List */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <div>
            <h3 className="text-2xl font-bold mb-6">Platform Features</h3>
            <ul className="space-y-4">
              {[
                'Real-time profit tracking',
                'Automated weekly distributions',
                'Multiple payment gateways',
                'Multi-currency support',
                'AI investment advisor',
                'Ad task earnings',
              ].map((feature) => (
                <li key={feature} className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-6">Revenue Streams</h3>
            <ul className="space-y-4">
              {[
                'Algorithmic Trading (40%)',
                'Crypto Staking (25%)',
                'Copy Trading (15%)',
                'Advertising & Tasks (20%)',
              ].map((stream) => (
                <li key={stream} className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{stream}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Ready to Start Investing?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of investors earning consistent returns with HybridTradeAI
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">HybridTradeAI</span>
          </div>
          <div className="text-sm text-muted-foreground">
            ? {new Date().getFullYear()} HybridTradeAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
