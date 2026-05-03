import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer mon compte — Essai gratuit 14 jours',
  description: 'Créez votre compte Mon Syndic Bénévole et commencez à gérer votre copropriété en quelques minutes. Essai gratuit 14 jours, sans engagement.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Créer mon compte — Mon Syndic Bénévole',
    description: 'Gérez votre copropriété simplement, sans syndic professionnel.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
