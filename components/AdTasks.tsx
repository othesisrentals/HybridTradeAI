import { useState } from 'react';
export default function AdTasks(){
  const [reward,setReward]=useState(0);
  const claim = async(type:string)=>{
    const res = await fetch('/api/ad-complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type, reward: type==='video'?0.1:0.05})});
    if(res.ok){ setReward(prev=>prev + (type==='video'?0.1:0.05)); alert('Reward credited'); }
  };
  return (
    <div className="p-4 border rounded">
      <button onClick={()=>claim('video')} className="mr-2 bg-blue-500 text-white px-3 py-2 rounded">Watch Video ($0.10)</button>
      <button onClick={()=>claim('click')} className="bg-green-500 text-white px-3 py-2 rounded">Click Ad ($0.05)</button>
      <p className="mt-4">Total earned: ${reward.toFixed(2)}</p>
    </div>
  );
}
