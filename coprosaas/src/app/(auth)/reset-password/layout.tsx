import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réinitialiser mon mot de passe',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
