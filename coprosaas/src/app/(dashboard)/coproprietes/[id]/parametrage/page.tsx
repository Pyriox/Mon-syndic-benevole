import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { hasChargesSpecialesAddon } from '@/lib/subscription';
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
    title: copro?.nom ? `Paramétrage — ${copro.nom}` : 'Paramétrage',
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

  const [{ data: coproprietaires }, { data: coproAddons }] = await Promise.all([
    supabase
      .from('coproprietaires')
      .select('id, nom, prenom, raison_sociale, user_id')
      .eq('copropriete_id', id),
    supabase
      .from('copro_addons')
      .select('addon_key, status, current_period_end, cancel_at_period_end')
      .eq('copropriete_id', id),
  ]);
  const coproMap = Object.fromEntries((coproprietaires ?? []).map((c) => [c.id, c]));

  const specialChargesEnabled = hasChargesSpecialesAddon(coproAddons ?? []);
  const lotCount = lots?.length ?? 0;
  const assignedLotsCount = (lots ?? []).filter((lot) => Object.keys(lot.tantiemes_groupes ?? {}).length > 0).length;
  const specialKeyCount = new Set(
    (lots ?? []).flatMap((lot) => Object.keys(lot.tantiemes_groupes ?? {}))
  ).size;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Paramétrage</h2>
        <p className="mt-1 text-sm font-medium text-gray-600">{copro.nom}</p>
        <p className="mt-1 text-sm text-gray-600">
          <strong>Paramétrez ici les bases de répartition de la copropriété.</strong>
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Les tantièmes généraux, les éventuelles clés spéciales et les informations de la copropriété définis sur cette page seront utilisés dans les dépenses, les appels de fonds et la régularisation.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{lotCount} lots</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{assignedLotsCount} lots avec clé spéciale</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{specialKeyCount} clés spéciales</span>
        </div>
        {!specialChargesEnabled && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-4 text-white shadow-md">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-snug">Option Charges spéciales non activée.</p>
              <p className="text-sm opacity-90 mt-0.5">
                Les clés de répartition spéciales font partie de l&apos;option payante <strong>Charges spéciales</strong>.
              </p>
            </div>
            <Link
              href="/abonnement"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors shadow-sm whitespace-nowrap"
            >
              L&apos;activer depuis l&apos;abonnement
            </Link>
          </div>
        )}
      </div>

      <CoproSettingsPanel
        key={`${copro.id}:${JSON.stringify(lots ?? [])}:${copro.nom}:${copro.adresse}:${copro.code_postal}:${copro.ville}`}
        copropriete={copro}
        initialLots={lots ?? []}
        coproMap={coproMap}
        specialChargesEnabled={specialChargesEnabled}
      />
    </div>
  );
}
