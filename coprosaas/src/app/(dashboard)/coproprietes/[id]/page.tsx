// ============================================================
// Page : Vue d'ensemble d'une copropriété
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageHelp from '@/components/ui/PageHelp';
import CoproDelete from './CoproDelete';
import LotActions from './LotActions';
import LotsTable from './LotsTable';
import TransfertSyndic from './TransfertSyndic';
import { formatDate } from '@/lib/utils';
import { getLotLimit, isSubscribed } from '@/lib/subscription';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';
import {
  Building2,
  CalendarDays,
  Hash,
  Layers,
  MapPin,
  Settings2,
  UserCheck,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { title: 'Copropriete' };
  }

  const { data: copro } = await supabase
    .from('coproprietes')
    .select('nom')
    .eq('id', id)
    .eq('syndic_id', user.id)
    .maybeSingle();

  return {
    title: copro?.nom ? `Lots & bâtiment — ${copro.nom}` : 'Lots & bâtiment',
  };
}

export default async function CopropriétéDetailPage({ params }: Props) {
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

  const totalTantiemes = lots?.reduce((sum, lot) => sum + (lot.tantiemes ?? 0), 0) ?? 0;
  const lotCount = lots?.length ?? 0;
  const nbAttribues = (lots ?? []).filter((lot) => lot.coproprietaire_id).length;
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

  const canWrite = isSubscribed(copro.plan);

  return (
    <div className="space-y-6">
      {!canWrite && (
        <ReadOnlyBanner
          freemium
          description={`Gestion limitée à ${lotLimit === Infinity ? '∞' : lotLimit} lots en version gratuite. Abonnez-vous pour gérer jusqu'à 20 ou en illimité.`}
        />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lots & bâtiment</h2>
          <p className="mt-1 text-sm font-medium text-gray-600">{copro.nom}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {copro.adresse}, {copro.code_postal} {copro.ville}
            </span>
            <span className="flex items-center gap-1">
              <Hash size={14} /> {lotCount} lots
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> Créée le {formatDate(copro.created_at)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/coproprietes/${copro.id}/parametrage`}>
            <Button variant="secondary">
              <Settings2 size={14} /> Paramétrage
            </Button>
          </Link>
          <TransfertSyndic coproprieteId={copro.id} coproprieteNom={copro.nom} />
          <CoproDelete coproprieteId={copro.id} coproprieteNom={copro.nom} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 shrink-0"><Layers size={18} className="text-blue-500" /></div>
          <div>
            <p className="text-xs text-gray-500">Lots</p>
            <p className="text-lg font-bold leading-tight text-gray-900">{lotCount}</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="rounded-lg bg-green-50 p-2 shrink-0"><UserCheck size={18} className="text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Attribués</p>
            <p className="text-lg font-bold leading-tight text-gray-900">
              {nbAttribues} <span className="text-sm font-normal text-gray-500">/ {lotCount}</span>
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2 shrink-0"><Building2 size={18} className="text-purple-500" /></div>
          <div>
            <p className="text-xs text-gray-500">Tantièmes totaux</p>
            <p className="text-lg font-bold leading-tight text-gray-900">{totalTantiemes}</p>
          </div>
        </Card>
        <Card padding="sm" className="col-span-2 flex items-center gap-3 lg:col-span-1">
          <div className="rounded-lg bg-amber-50 p-2 shrink-0"><Settings2 size={18} className="text-amber-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Clés spéciales</p>
            <p className="text-lg font-bold leading-tight text-gray-900">{specialKeyCount}</p>
            <p className="text-xs text-gray-500">{batimentCount} bâtiment{batimentCount > 1 ? 's' : ''} / entrée{batimentCount > 1 ? 's' : ''}</p>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-gray-900">Lots de la copropriété</h3>
          <LotActions
            coproprieteId={copro.id}
            showLabel
            canAdd={canAddLot}
            lotLimit={lotLimit === Infinity ? undefined : lotLimit}
          />
        </div>

        <PageHelp>
          Créez, identifiez et réordonnez vos lots ici. Les tantièmes généraux et les clés spéciales se règlent ensuite dans le Paramétrage.
        </PageHelp>

        {lotCount > 0 ? (
          <Card>
            <LotsTable initialLots={lots ?? []} coproMap={coproMap} coproprieteId={id} currentUserId={user.id} />
          </Card>
        ) : (
          <Card>
            <div className="space-y-3 text-sm text-gray-600">
              <p>Aucun lot n&apos;est encore enregistré pour cette copropriété.</p>
              <div className="flex flex-wrap gap-2">
                <LotActions
                  coproprieteId={copro.id}
                  showLabel
                  canAdd={canAddLot}
                  lotLimit={lotLimit === Infinity ? undefined : lotLimit}
                />
                <Link href={`/coproprietes/${copro.id}/parametrage`}>
                  <Button variant="secondary">
                    <Settings2 size={14} /> Ouvrir le paramétrage
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
