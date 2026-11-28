import { Suspense } from "react";
import { connection } from "next/server";
import { getSiteData } from "@/lib/storage";
import { ManagementPageClient } from "@/components/public/ManagementPageClient";

async function ManagementContent() {
  await connection();
  const data = await getSiteData();
  return <ManagementPageClient data={data} />;
}

export default function ManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-xs uppercase tracking-widest text-zinc-500">
          Loading Management...
        </div>
      }
    >
      <ManagementContent />
    </Suspense>
  );
}
