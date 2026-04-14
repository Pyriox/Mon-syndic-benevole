'use client';

import dynamic from 'next/dynamic';

const AdminStorageExplorer = dynamic(() => import('./AdminStorageExplorer'), {
  ssr: false,
  loading: () => (
    <div className="py-6 text-sm text-gray-400">Chargement de l'explorateur…</div>
  ),
});

export default function AdminStorageExplorerLazy({ coproId }: { coproId: string }) {
  return <AdminStorageExplorer coproId={coproId} />;
}
