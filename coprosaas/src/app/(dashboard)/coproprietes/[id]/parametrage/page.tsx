import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CoproSettingsPanel from '../CoproSettingsPanel';
import { formatDate } from '@/lib/utils';
import { getLotLimit } from '@/lib/subscription';
import { ArrowLeft, Building2, Hash, MapPin, Settings2 } from 'lucide-react';

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
  const lotLimit = getLotLimit(copro.plan, copro.plan_id);
  const canAddLot = lotCount < lotLimit;
  const batimentCount = new Set(
    (lots ?? [])
      .map((lot) => lot.batiment?.trim())
      .filter((value): value is string => Boolean(value))
  ).size;
  const specialKeyCount = new Set(
    (lots ?? []).flatMap((lot) => Object.keys(lot.tantiemes_groupes ?? {}))
  ).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/coproprietes/${copro.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={14} /> Retour à la vue d&apos;ensemble
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Paramétrage de {copro.nom}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Regroupez ici la fiche copropriété, les lots et les clés de répartition spéciales dans un écran dédié.
          </p>
        </div>
        <Link href={`/coproprietes/${copro.id}`}>
          <Button variant="secondary">
            <ArrowLeft size={14} /> Vue d&apos;ensemble
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5">
            <Building2 size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Lots</p>
            <p className="text-lg font-bold text-gray-900">{lotCount}</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5">
            <MapPin size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Bâtiments / entrées</p>
            <p className="text-lg font-bold text-gray-900">{batimentCount}</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2.5">
            <Settings2 size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Clés spéciales</p>
            <p className="text-lg font-bold text-gray-900">{specialKeyCount}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-gray-900">{copro.nom}</p>
            <p>{copro.adresse}, {copro.code_postal} {copro.ville}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1"><Hash size={13} /> {lotCount} lots</span>
            <span>Créée le {formatDate(copro.created_at)}</span>
          </div>
        </div>
      </Card>

      <CoproSettingsPanel
        key={`${copro.id}:${JSON.stringify(lots ?? [])}:${copro.nom}:${copro.adresse}:${copro.code_postal}:${copro.ville}`}
        copropriete={copro}
        initialLots={lots ?? []}
        coproMap={coproMap}
        canAddLot={canAddLot}
        lotLimit={lotLimit === Infinity ? undefined : lotLimit}
      />
    </div>
  );
}
