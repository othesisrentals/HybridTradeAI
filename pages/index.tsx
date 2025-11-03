import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="p-8">
        <h1 className="text-3xl font-bold">HybridTradeAI</h1>
        <p className="mt-4">Low-risk hybrid investment platform.</p>
        <div className="mt-6">
          <Link href="/plans">View Plans</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
