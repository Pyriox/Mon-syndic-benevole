// ============================================================
// Page : Détail d'une copropriété + gestion des lots
// ============================================================
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
import CoproDelete from './CoproDelete';
import CoproSettingsPanel from './CoproSettingsPanel';
import LotsTable from './LotsTable';
import TransfertSyndic from './TransfertSyndic';
import { formatDate } from '@/lib/utils';
import { getLotLimit } from '@/lib/subscription';
import { MapPin, Hash, CalendarDays, Layers, UserCheck, Building2 } from 'lucide-react';

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
    title: copro?.nom ? `${copro.nom}` : 'Copropriete',
  };
}

export default async function CopropriétéDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Récupération de la copropriété
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('id, nom, adresse, code_postal, ville, created_at, plan, plan_id')
    .eq('id', id)
    .eq('syndic_id', user.id)   // Sécurité : seul le syndic propriétaire peut voir
    .single();

  if (!copro) notFound();

  // Récupération des lots (sans join implicite pour éviter les problèmes de FK)
  const { data: lots } = await supabase
    .from('lots')
    .select('id, numero, type, tantiemes, coproprietaire_id, batiment, groupes_repartition, tantiemes_groupes, position')
    .eq('copropriete_id', id)
    .order('position', { ascending: true, nullsFirst: false });

  // Copropriétaires de cette copropriété (pour afficher le nom dans le tableau)
  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('id, nom, prenom, raison_sociale, user_id')
    .eq('copropriete_id', id);
  const coproMap = Object.fromEntries((coproprietaires ?? []).map((c) => [c.id, c]));

  // Calcul du total des tantièmes
  const totalTantiemes = lots?.reduce((sum, lot) => sum + (lot.tantiemes ?? 0), 0) ?? 0;

  // Limite de lots selon le plan d'abonnement
  const lotCount = lots?.length ?? 0;
  const nbAttribues = (lots ?? []).filter(l => l.coproprietaire_id).length;
  const lotLimit = getLotLimit(copro.plan, copro.plan_id);
  const canAddLot = lotCount < lotLimit;

  return (
    <div className="space-y-6">


      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{copro.nom}</h2>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {copro.adresse}, {copro.code_postal} {copro.ville}
            </span>
            <span className="flex items-center gap-1">
              <Hash size={14} /> {lots?.length ?? 0} lots
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> Créée le {formatDate(copro.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TransfertSyndic coproprieteId={copro.id} coproprieteNom={copro.nom} />
          <CoproDelete coproprieteId={copro.id} coproprieteNom={copro.nom} />
        </div>
      </div>

      {/* Stats lots */}
      {lots && lots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card padding="sm" className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg shrink-0"><Layers size={18} className="text-blue-500" /></div>
            <div>
              <p className="text-xs text-gray-500">Lots</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{lotCount}</p>
            </div>
          </Card>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg shrink-0"><UserCheck size={18} className="text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Attribués</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">
                {nbAttribues} <span className="text-sm font-normal text-gray-500">/ {lotCount}</span>
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

      <CoproSettingsPanel
        key={`${copro.id}:${JSON.stringify(lots ?? [])}:${copro.nom}:${copro.adresse}:${copro.code_postal}:${copro.ville}`}
        copropriete={copro}
        initialLots={lots ?? []}
        coproMap={coproMap}
        canAddLot={canAddLot}
        lotLimit={lotLimit === Infinity ? undefined : lotLimit}
      />

      {lots && lots.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Aperçu des lots</h3>
            <p className="text-sm text-gray-500">Vous pouvez encore réordonner les lots visuellement si besoin.</p>
          </div>
          <Card>
            <LotsTable initialLots={lots} coproMap={coproMap} coproprieteId={id} currentUserId={user.id} />
          </Card>
        </div>
      )}

    </div>
  );
}
