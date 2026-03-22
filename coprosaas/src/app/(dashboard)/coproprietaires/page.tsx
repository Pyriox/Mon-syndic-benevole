// ============================================================
// Page : Liste des copropriétaires (vue tableau)
// Filtrée sur la copropriété sélectionnée (cookie selected_copro_id)
// ============================================================
export const revalidate = 60;

import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import CoproprietaireActions from './CoproprietaireActions';
import CoproprietairesTable from './CoproprietairesTable';
import { Building2, UserCheck, Users } from 'lucide-react';

export default async function CoproprietairesPage() {
  const supabase = await createClient();
  // Syndic : accès complet + actions | Copropriétaire : lecture seule (sans email/telephone/solde)
  const { selectedCoproId, role, copro: copropriete, user } = await requireCoproAccess();
  const isSyndic = role === 'syndic';

  // Si syndic mais pas gérant de cette copropriété → redirect (requireCoproAccess gère déjà ce cas)
  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  // Copropriétaires + tous les lots de la copropriété, en parallèle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coproResult, { data: allLots }] = await Promise.all([
    isSyndic
      ? supabase.from('coproprietaires').select('*').eq('copropriete_id', selectedCoproId ?? 'none').order('position', { ascending: true, nullsFirst: false })
      : supabase.from('coproprietaires').select('id, nom, prenom, raison_sociale, adresse, code_postal, ville, user_id').eq('copropriete_id', selectedCoproId ?? 'none').order('position', { ascending: true, nullsFirst: false }),
    supabase
      .from('lots')
      .select('id, numero, type, tantiemes, coproprietaire_id')
      .eq('copropriete_id', selectedCoproId ?? 'none')
      .order('position', { ascending: true, nullsFirst: false }),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coproprietaires = (coproResult as { data: any[] | null }).data;

  // Lots disponibles (non assignés) + lots déjà assignés à chaque proprio
  const lotsByOwner = (allLots ?? []).reduce<Record<string, { id: string; numero: string; type: string; tantiemes: number }[]>>(
    (acc, lot) => {
      if (!lot.coproprietaire_id) return acc;
      acc[lot.coproprietaire_id] = [...(acc[lot.coproprietaire_id] ?? []), lot];
      return acc;
    }, {}
  );

  // Lots disponibles pour la modale d'ajout/édition (tous, avec coproprietaire_id pour gérer les lots déjà attribués)
  const lotsForSelect = (allLots ?? []).map((l) => ({ id: l.id, numero: l.numero, coproprietaire_id: l.coproprietaire_id }));

  const totalTantiemes = (allLots ?? []).reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nbInscrits = (coproprietaires ?? []).filter((c: any) => c.user_id).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Copropriétaires</h2>
          <p className="text-gray-500 mt-1">{coproprietaires?.length ?? 0} copropriétaire(s)</p>
        </div>
        {isSyndic && (coproprietaires?.length ?? 0) > 0 && <CoproprietaireActions coproprietes={coproprietes} />}
      </div>

      {/* Bande de stats */}
      {coproprietaires && coproprietaires.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card padding="sm" className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg shrink-0"><Users size={18} className="text-blue-500" /></div>
            <div>
              <p className="text-xs text-gray-500">Copropriétaires</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{coproprietaires.length}</p>
            </div>
          </Card>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg shrink-0"><UserCheck size={18} className="text-green-500" /></div>
            <div>
              <p className="text-xs text-gray-500">Inscrits</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">
                {nbInscrits} <span className="text-sm font-normal text-gray-400">/ {coproprietaires.length}</span>
              </p>
            </div>
          </Card>
          <Card padding="sm" className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2 bg-purple-50 rounded-lg shrink-0"><Building2 size={18} className="text-purple-500" /></div>
            <div>
              <p className="text-xs text-gray-500">Tantièmes totaux</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{totalTantiemes}</p>
            </div>
          </Card>
        </div>
      )}

      {coproprietaires && coproprietaires.length > 0 ? (
        <Card>
          <CoproprietairesTable
            initialCoproprietaires={coproprietaires}
            lotsByOwner={lotsByOwner}
            lotsForSelect={isSyndic ? lotsForSelect : undefined}
            totalTantiemes={totalTantiemes}
            readOnly={!isSyndic}
            currentUserId={user.id}
          />
        </Card>
      ) : (
        <EmptyState
          icon={<Users size={48} strokeWidth={1.5} />}
          title="Aucun copropriétaire"
          description={isSyndic ? "Ajoutez les copropriétaires en les associant à leurs lots." : "Aucun copropriétaire n'est encore enregistré pour cette copropriété."}
          action={isSyndic ? <CoproprietaireActions coproprietes={coproprietes} showLabel /> : undefined}
        />
      )}
    </div>
  );
}
