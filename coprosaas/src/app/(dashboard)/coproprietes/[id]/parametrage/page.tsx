import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import CoproSettingsPanel from '../CoproSettingsPanel';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { title: 'Parametrage copropriete' };
  }

  const { data: copro } = await supabase
    .from('coproprietes')
    .select('nom')
    .eq('id', id)
    .eq('syndic_id', user.id)
    .maybeSingle();

  return {
    title: copro?.nom ? `${copro.nom} — Paramétrage` : 'Parametrage copropriete',
  };
}

export default async function CoproprieteParametragePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id, nom, adresse, code_postal, ville, created_at, plan, plan_id')
    .eq('id', id)
    .eq('syndic_id', user.id)
    .single();

  if (!copro) notFound();

  const { data: lots } = await supabase
    .from('lots')
    .select('id, numero, type, tantiemes, coproprietaire_id, batiment, groupes_repartition, tantiemes_groupes, position')
    .eq('copropriete_id', id)
    .order('position', { ascending: true, nullsFirst: false });

  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('id, nom, prenom, raison_sociale, user_id')
    .eq('copropriete_id', id);
  const coproMap = Object.fromEntries((coproprietaires ?? []).map((c) => [c.id, c]));

  const lotCount = lots?.length ?? 0;
  const assignedLotsCount = (lots ?? []).filter((lot) => Object.keys(lot.tantiemes_groupes ?? {}).length > 0).length;
  const specialKeyCount = new Set(
    (lots ?? []).flatMap((lot) => Object.keys(lot.tantiemes_groupes ?? {}))
  ).size;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paramétrage de {copro.nom}</h2>
        <p className="mt-1 text-sm text-gray-600">
          Utilisez <strong>Répartition des charges</strong> pour les tantièmes et <strong>Fiche copropriété</strong> pour les informations d’identité.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{lotCount} lots</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{assignedLotsCount} lots avec clé spéciale</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{specialKeyCount} clés spéciales</span>
        </div>
      </div>

      <CoproSettingsPanel
        key={`${copro.id}:${JSON.stringify(lots ?? [])}:${copro.nom}:${copro.adresse}:${copro.code_postal}:${copro.ville}`}
        copropriete={copro}
        initialLots={lots ?? []}
        coproMap={coproMap}
      />
    </div>
  );
}
