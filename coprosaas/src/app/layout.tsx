import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mon Syndic Bénévole — La gestion de copropriété simple & abordable",
  description:
    "Mon Syndic Bénévole simplifie la gestion des copropriétés pour les syndics bénévoles. Charges, appels de fonds, assemblées générales et plus. Essai gratuit 30 jours, puis 25€/mois.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geist.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
