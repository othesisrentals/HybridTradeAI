import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='POST') return res.status(405).end();
  const { type, reward } = req.body;
  const { data:{ user } } = await supabase.auth.getUser();
  if(!user) return res.status(401).json({ error: 'Unauthorized' });
  await supabase.from('users').update({ withdrawable_balance: supabase.raw('withdrawable_balance + ?', [reward]) }).eq('id', user.id);
  await supabase.from('transactions').insert({ user_id: user.id, type: 'ad_reward', amount: reward, meta: { ad_type: type } });
  return res.status(200).json({ message: 'Reward credited' });
}
