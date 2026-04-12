'use client';

import dynamic from 'next/dynamic';

const AdminSupportShell = dynamic(() => import('./AdminSupportShell'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-8 text-sm text-gray-400">
      Chargement du module support...
    </div>
  ),
});

export default function AdminSupportShellLazy(props: {
  initialTickets: unknown[];
  initialSearch?: string;
  initialFilterStatus?: 'all' | 'ouvert' | 'en_cours' | 'resolu';
  initialTicketId?: string | null;
}) {
  return <AdminSupportShell {...(props as any)} />;
}
