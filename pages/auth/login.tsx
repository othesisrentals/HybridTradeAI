import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e:any) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) router.push('/dashboard');
    else alert('Login failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md p-6 glass-card">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full mb-3 p-2" />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full mb-3 p-2" />
        <button className="w-full bg-primary text-white p-2">Login</button>
      </form>
    </div>
  );
}
