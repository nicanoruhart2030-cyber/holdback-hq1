import type { Metadata, Viewport } from "next";
import { DM_Mono, Inter, Syne } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { dictionaries } from "@/lib/i18n/dictionary";
import { site } from "@/lib/site";
import "./globals.css";

// "latin" already covers Spanish (á é í ó ú ü ñ ¿ ¡); latin-ext would double the font payload.
const syne = Syne({ subsets: ["latin"], weight: ["800"], variable: "--font-syne", display: "swap" });
// Mono is mostly below the fold, so it is not preloaded and does not compete with the hero fonts.
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-dm-mono", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const en = dictionaries.en;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: en.meta.title,
  description: en.meta.description,
  applicationName: site.name,
  authors: [{ name: site.founder, url: site.linkedin }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: en.meta.title,
    description: en.meta.description,
    locale: "en_US",
    alternateLocale: ["es_419"],
  },
  twitter: { card: "summary_large_image", title: en.meta.title, description: en.meta.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#080810",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Structured data: the firm and its founder. Only facts from the brief. */
function JsonLd() {
  const person = {
    "@type": "Person",
    "@id": `${site.url}/#fernando-uhart`,
    name: site.founder,
    jobTitle: "Founder",
    worksFor: { "@id": `${site.url}/#organization` },
    sameAs: [site.linkedin],
    knowsLanguage: ["en", "es"],
    knowsAbout: [
      "Post-merger integration",
      "Banking operations",
      "Core banking modernization",
      "Artificial intelligence adoption in financial services",
    ],
  };
  const org = {
    "@type": "ProfessionalService",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    description: en.meta.description,
    founder: { "@id": `${site.url}/#fernando-uhart` },
    sameAs: [site.linkedin],
    knowsLanguage: ["en", "es"],
    areaServed: ["Argentina", "Canada", "Peru", "Uruguay", "Mexico", "Colombia", "United States", "Puerto Rico"],
    serviceType: en.services.items.map((s) => s.title),
    ...(site.email ? { email: site.email } : {}),
    ...(site.phone ? { telephone: site.phone } : {}),
  };
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": [org, person] }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmMono.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <JsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
