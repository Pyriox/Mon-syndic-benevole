'use client';

import dynamic from 'next/dynamic';

const AdminCoproprietaireActions = dynamic(() => import('./AdminCoproprietaireActions'), {
  ssr: false,
  loading: () => <span className="text-xs text-gray-300">...</span>,
});

interface Coproprietaire {
  id: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  complement_adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  solde: number | null;
}

export default function AdminCoproprietaireActionsLazy({ cp }: { cp: Coproprietaire }) {
  return <AdminCoproprietaireActions cp={cp} />;
}
