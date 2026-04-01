import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer mon compte — Essai gratuit 14 jours',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
