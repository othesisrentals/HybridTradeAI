import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PlanCard from '@/components/PlanCard';

export default function Plans() {
  return (
    <div>
      <Navbar />
      <main className="p-8">
        <h2 className="text-2xl font-bold mb-4">Investment Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlanCard title="Starter Plan" price="$100" />
          <PlanCard title="Growth Plan" price="$1000" />
          <PlanCard title="Pro Plan" price="$5000" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
