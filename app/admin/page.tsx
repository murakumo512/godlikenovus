import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getSiteData } from "@/lib/storage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

async function AdminContent() {
  await connection();
  const [data, currentUser] = await Promise.all([
    getSiteData(),
    getCurrentAdmin(),
  ]);
  return <AdminDashboard initialData={data} initialUser={currentUser} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c]" />}>
      <AdminContent />
    </Suspense>
  );
}
