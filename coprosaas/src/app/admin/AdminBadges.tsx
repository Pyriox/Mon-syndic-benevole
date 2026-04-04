type Role = 'admin' | 'syndic' | 'membre';

export function RoleBadge({ role }: { role: Role }) {
  if (role === 'admin') {
    return <span className="inline-flex text-xs px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-700">Admin</span>;
  }

  if (role === 'syndic') {
    return <span className="inline-flex text-xs px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Syndic</span>;
  }

  return <span className="inline-flex text-xs px-2 py-0.5 rounded font-semibold bg-teal-50 text-teal-700 border border-teal-200">Membre</span>;
}

export function PlanBadge({ plan, planId }: { plan: string | null; planId: string | null }) {
  if (plan === 'actif') {
    const cfg: Record<string, { label: string; cls: string }> = {
      essentiel: { label: 'Essentiel', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      confort: { label: 'Confort', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      illimite: { label: 'Illimité', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    };

    const current = cfg[planId ?? ''] ?? { label: 'Actif', cls: 'bg-green-50 text-green-700 border-green-200' };
    return <span className={`inline-flex text-xs px-2 py-0.5 rounded-md font-medium border ${current.cls}`}>{current.label}</span>;
  }

  if (plan === 'passe_du') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-600 border border-red-200">Impayé</span>;
  if (plan === 'resilie') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-orange-50 text-orange-600 border border-orange-200">Résilié</span>;
  if (plan === 'inactif') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactif</span>;
  if (plan === 'essai' || !plan) return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">Essai</span>;

  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">—</span>;
}
