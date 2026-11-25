import { Suspense } from "react";
import { connection } from "next/server";
import { getSiteData } from "@/lib/storage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

async function AdminContent() {
  await connection();
  const data = await getSiteData();
  return <AdminDashboard initialData={data} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-red-600 font-display text-xl tracking-widest uppercase">
          Loading cPanel...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
