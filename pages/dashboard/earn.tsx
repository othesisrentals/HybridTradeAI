import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AdTasks from '@/components/AdTasks';
import Footer from '@/components/Footer';

export default function Earn(){
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">Earn Extra</h1>
          <AdTasks />
        </main>
      </div>
      <Footer />
    </div>
  );
}
