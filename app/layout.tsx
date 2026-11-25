import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GODLIKE NOVUS — Esports Organization | Est. 2013",
  description:
    "Gamers Don't Die, They Respawn. Official website of Godlike Novus Esports — Honor of Kings & RF Online divisions, Store, Events, and Management.",
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
      className={`${inter.variable} ${rajdhani.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[#070709] text-white font-sans selection:bg-[#E11D2E] selection:text-white">
        {children}
      </body>
    </html>
  );
}
