import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const APP_URL = "https://mon-syndic-benevole.fr";
const TITLE   = "Mon Syndic Bénévole — La gestion de copropriété simple & abordable";
const DESC    = "Mon Syndic Bénévole simplifie la gestion des copropriétés pour les syndics bénévoles. Charges, appels de fonds, assemblées générales, documents et plus. Essai gratuit 30 jours, puis à partir de 20 €/mois.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },

  title: {
    default: TITLE,
    template: "%s | Mon Syndic Bénévole",
  },
  description: DESC,

  keywords: [
    "syndic bénévole",
    "gestion copropriété",
    "logiciel syndic",
    "assemblée générale copropriété",
    "appel de fonds",
    "charges copropriété",
    "PV assemblée générale",
    "convocation AG",
    "tantièmes",
    "copropriété logiciel",
  ],

  authors: [{ name: "Mon Syndic Bénévole", url: APP_URL }],
  creator: "Mon Syndic Bénévole",
  publisher: "Mon Syndic Bénévole",

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  alternates: {
    canonical: APP_URL,
  },

  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: APP_URL,
    siteName: "Mon Syndic Bénévole",
    title: TITLE,
    description: DESC,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Mon Syndic Bénévole — Logiciel de gestion de copropriété",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="fr">
      <body className={`${geist.variable} antialiased`}>
        {children}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
            <GoogleAnalytics />
          </>
        )}
      </body>
    </html>
  );
}
