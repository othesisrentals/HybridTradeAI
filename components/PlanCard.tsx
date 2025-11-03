export default function PlanCard({ title='Plan', price='$0' }: any){
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2">{price}</p>
    </div>
  );
}
