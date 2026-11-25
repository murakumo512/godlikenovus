import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GODLIKE NOVUS — Esports Organization | Est. 2013",
  description:
    "Gamers Don't Die, They Respawn. Official website of Godlike Novus Esports — Honor of Kings & RF Online divisions, Brand Ambassador, Store, and Events.",
  icons: {
    icon: "/images/logo-red.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${barlow.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans selection:bg-[#E11D2E] selection:text-white">
        {children}
      </body>
    </html>
  );
}
