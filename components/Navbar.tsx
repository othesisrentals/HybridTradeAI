import Link from 'next/link';
export default function Navbar(){
  return (
    <nav className="p-4 bg-white shadow">
      <div className="container mx-auto flex justify-between">
        <Link href="/">HybridTradeAI</Link>
        <div className="space-x-4">
          <Link href="/plans">Plans</Link>
          <Link href="/auth/login">Login</Link>
        </div>
      </div>
    </nav>
  );
}
