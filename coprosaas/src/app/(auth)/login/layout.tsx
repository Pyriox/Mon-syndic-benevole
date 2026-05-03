import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — Mon Syndic Bénévole',
  description: 'Connectez-vous à votre espace Mon Syndic Bénévole pour gérer votre copropriété.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Connexion — Mon Syndic Bénévole',
    description: 'Connectez-vous à votre espace de gestion de copropriété.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
