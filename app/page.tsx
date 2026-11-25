import { Suspense } from "react";
import { connection } from "next/server";
import { getSiteData } from "@/lib/storage";
import { PublicSite } from "@/components/public/PublicSite";

async function HomeContent() {
  await connection();
  const data = await getSiteData();
  return <PublicSite data={data} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center text-red-500 font-display text-xl tracking-widest uppercase">
          Loading Godlike Novus...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
