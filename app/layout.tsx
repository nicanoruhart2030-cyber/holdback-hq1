import type { Metadata } from "next";
import { DM_Mono, Inter } from "next/font/google";
import "./globals.css";

const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-dm-mono", display: "swap" });
const inter = Inter({ subsets: ["latin"], axes: ["opsz"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Holdback HQ", template: "%s · Holdback HQ" },
  description: "Payment deadlines, holdback and WSIB clearances for Ontario trade subcontractors.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={`${dmMono.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ink text-body">{children}</body>
    </html>
  );
}
