import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: true,
  display: 'swap',
});

const APP_URL = "https://www.mon-syndic-benevole.fr";
const TITLE   = "Logiciel syndic bénévole : gestion de copropriété simple | Mon Syndic Bénévole";
const DESC    = "Logiciel pour syndic bénévole : gérez appels de fonds, charges, AG, documents et incidents simplement. Essai gratuit 14 jours. Dès 300 €/an.";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

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
    "logiciel gestion copropriété",
    "logiciel syndic bénévole",
    "assemblée générale copropriété",
    "appel de fonds",
    "charges copropriété",
    "PV assemblée générale",
    "convocation AG",
    "tantièmes",
    "copropriété logiciel",
    "syndic non professionnel",
    "gestion copropriété sans syndic professionnel",
    "petite copropriété",
    "fonds de travaux ALUR",
    "loi ALUR copropriété",
    "répartition charges copropriété",
    "incidents copropriété",
    "documents copropriété",
  ],

  authors: [{ name: "Mon Syndic Bénévole", url: APP_URL }],
  creator: "Mon Syndic Bénévole",
  publisher: "Mon Syndic Bénévole",

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
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
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const hasGoogleTagging = Boolean(gtmId || gaId);

  return (
    <html lang="fr">
      <body className={`${geist.variable} ${geist.className} antialiased overflow-x-hidden`}>
        {/* Pas de fallback <noscript> GTM : cela peut déclencher des requêtes Google avant le consentement JS. */}
        {children}
        {hasGoogleTagging && (
          <>
            {/* Définition de gtag + consent par défaut AVANT toute hydratation React
                → partagé par GA4 et Google Tag Manager via la même dataLayer */}
            <Script id="gtag-consent" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                window.gtag = function gtag(){window.dataLayer.push(arguments);};
                gtag('consent', 'default', {
                  analytics_storage: 'denied',
                  ad_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  functionality_storage: 'granted',
                  security_storage: 'granted',
                  wait_for_update: 2000
                });
                gtag('set', 'ads_data_redaction', true);
                gtag('set', 'url_passthrough', false);
              `}
            </Script>
            {gtmId ? (
              <Script id="gtm-init" strategy="beforeInteractive">
                {`
                  (function(w,d,s,l,i){
                    w[l]=w[l]||[];
                    w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
                    var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),
                        dl=l!='dataLayer'?'&l='+l:'';
                    j.async=true;
                    j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                    f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');
                `}
              </Script>
            ) : gaId ? (
              <>
                {/* Fallback historique si GTM n'est pas configuré */}
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                  strategy="beforeInteractive"
                />
                <Script id="gtag-init" strategy="beforeInteractive">
                  {`
                    gtag('js', new Date());
                    gtag('config', '${gaId}', {
                      send_page_view: false,
                      anonymize_ip: true,
                      allow_google_signals: false,
                      allow_ad_personalization_signals: false
                    });
                  `}
                </Script>
              </>
            ) : null}
            <GoogleAnalytics />
          </>
        )}
        <CookieBanner />
        <SpeedInsights />
      </body>
    </html>
  );
}
