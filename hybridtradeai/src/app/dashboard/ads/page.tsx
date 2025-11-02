import { redirect } from "next/navigation";

import { AdTasksDashboard } from "@/components/ads/AdTasksDashboard";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function DashboardAdsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="mx-auto max-w-6xl py-6">
      <AdTasksDashboard />
    </div>
  );
}
