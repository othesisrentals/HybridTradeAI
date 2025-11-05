import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navbar from '../../../components/Navbar'
import Footer from '../../../components/Footer'

export default function PublicLandingPage ()
{
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <Navbar />

            {/* Hero Section */ }
            <section className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                    Welcome to <span className="text-blue-600">HybridTradeAI</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                    A complete investment platform with AI-powered trading, real-time notifications,
                    and automated profit distribution. Start your journey to financial freedom today.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/auth/signup">
                        <Button size="lg" className="text-lg px-8 py-3">
                            Get Started
                        </Button>
                    </Link>
                    <Link href="/auth/signin">
                        <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Features Section */ }
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                    Powerful Features
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-blue-600">🤖 AI Trading</CardTitle>
                            <CardDescription>
                                Advanced algorithmic trading powered by AI for optimal returns
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-green-600">📊 Real-time Updates</CardTitle>
                            <CardDescription>
                                Live notifications and cross-tab synchronization for all activities
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-purple-600">💰 Ad Revenue</CardTitle>
                            <CardDescription>
                                Earn extra income through ad tasks with 70/30 revenue sharing
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-orange-600">🔒 Secure Platform</CardTitle>
                            <CardDescription>
                                Bank-level security with KYC verification and audit logging
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* Investment Plans */ }
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                    Investment Plans
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Starter Plan */ }
                    <Card className="relative">
                        <CardHeader>
                            <CardTitle className="text-2xl text-blue-600">Starter Plan</CardTitle>
                            <CardDescription>$100 - $5,000 Investment</CardDescription>
                            <div className="text-3xl font-bold text-blue-600">$100 - $5,000</div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 mb-6">
                                <li>✅ 5-12% Weekly ROI</li>
                                <li>✅ 12 Week Duration</li>
                                <li>✅ 10% Management Fee</li>
                                <li>✅ Basic Ad Tasks</li>
                                <li>✅ Email Support</li>
                            </ul>
                            <Badge variant="secondary" className="mb-4">Most Popular</Badge>
                        </CardContent>
                    </Card>

                    {/* Pro Plan */ }
                    <Card className="relative border-green-500 border-2">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-green-500">Recommended</Badge>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-2xl text-green-600">Pro Plan</CardTitle>
                            <CardDescription>$5,000 - $50,000 Investment</CardDescription>
                            <div className="text-3xl font-bold text-green-600">$5,000 - $50,000</div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 mb-6">
                                <li>✅ 8-18% Weekly ROI</li>
                                <li>✅ 12 Week Duration</li>
                                <li>✅ 10% Management Fee</li>
                                <li>✅ Premium Ad Tasks</li>
                                <li>✅ Priority Support</li>
                                <li>✅ Advanced Analytics</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Elite Plan */ }
                    <Card className="relative">
                        <CardHeader>
                            <CardTitle className="text-2xl text-purple-600">Elite Plan</CardTitle>
                            <CardDescription>$50,000 - $500,000 Investment</CardDescription>
                            <div className="text-3xl font-bold text-purple-600">$50,000 - $500,000</div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 mb-6">
                                <li>✅ 12-25% Weekly ROI</li>
                                <li>✅ 12 Week Duration</li>
                                <li>✅ 10% Management Fee</li>
                                <li>✅ VIP Ad Tasks</li>
                                <li>✅ 24/7 VIP Support</li>
                                <li>✅ Personal Account Manager</li>
                                <li>✅ Exclusive Strategies</li>
                            </ul>
                            <Badge variant="outline">Premium</Badge>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Revenue Streams */ }
            <section className="bg-gray-50 dark:bg-gray-800 py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                        Our Revenue Streams
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-600 mb-2">40%</div>
                            <div className="text-lg font-semibold">Algorithmic Trading</div>
                            <div className="text-gray-600 dark:text-gray-300">AI-powered automated trading</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 mb-2">25%</div>
                            <div className="text-lg font-semibold">Crypto Staking</div>
                            <div className="text-gray-600 dark:text-gray-300">High-yield staking rewards</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-purple-600 mb-2">15%</div>
                            <div className="text-lg font-semibold">Copy Trading</div>
                            <div className="text-gray-600 dark:text-gray-300">Follow successful traders</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-orange-600 mb-2">20%</div>
                            <div className="text-lg font-semibold">Advertising</div>
                            <div className="text-gray-600 dark:text-gray-300">Ad network partnerships</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */ }
            <section className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                    Ready to Start Investing?
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                    Join thousands of investors who trust HybridTradeAI with their financial future.
                    Start with as little as $100 and watch your money grow.
                </p>
                <Link href="/auth/signup">
                    <Button size="lg" className="text-lg px-12 py-4">
                        Create Your Account
                    </Button>
                </Link>
            </section>

            <Footer />
        </div>
    )
}