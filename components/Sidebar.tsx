import Link from 'next/link';
export default function Sidebar(){
  return (
    <aside className="w-64 p-4 border-r"> 
      <ul className="space-y-2">
        <li><Link href="/dashboard">Overview</Link></li>
        <li><Link href="/dashboard/earn">Earn</Link></li>
      </ul>
    </aside>
  );
}
