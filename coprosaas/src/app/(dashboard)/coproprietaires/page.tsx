// ============================================================
// Page : Liste des copropriétaires (vue tableau)
// Filtrée sur la copropriété sélectionnée (cookie selected_copro_id)
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import CoproprietaireActions from './CoproprietaireActions';
import CoproprietairesTable from './CoproprietairesTable';
import { Users } from 'lucide-react';

export default async function CoproprietairesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  const { data: copropriete } = selectedCoproId
    ? await supabase.from('coproprietes').select('id, nom, syndic_id').eq('id', selectedCoproId).maybeSingle()
    : { data: null };

  // Seul le syndic gérant cette copropriété peut voir la liste complète
  if (!copropriete || copropriete.syndic_id !== user.id) {
    redirect('/dashboard');
  }

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('*')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .order('position', { ascending: true, nullsFirst: false });

  // Tous les lots de la copropriété
  const { data: allLots } = await supabase
    .from('lots')
    .select('id, numero, type, tantiemes, coproprietaire_id')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .order('position', { ascending: true, nullsFirst: false });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Copropriétaires</h2>
          <p className="text-gray-500 mt-1">{coproprietaires?.length ?? 0} copropriétaire(s)</p>
        </div>
        <CoproprietaireActions coproprietes={coproprietes} />
      </div>

      {coproprietaires && coproprietaires.length > 0 ? (
        <Card>
          <CoproprietairesTable
            initialCoproprietaires={coproprietaires}
            lotsByOwner={lotsByOwner}
            lotsForSelect={lotsForSelect}
            totalTantiemes={totalTantiemes}
          />
        </Card>
      ) : (
        <EmptyState
          icon={<Users size={48} strokeWidth={1.5} />}
          title="Aucun copropriétaire"
          description="Ajoutez les copropriétaires en les associant à leurs lots."
          action={<CoproprietaireActions coproprietes={coproprietes} showLabel />}
        />
      )}
    </div>
  );
}
