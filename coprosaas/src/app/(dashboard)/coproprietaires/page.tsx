// ============================================================
// Page : Liste des copropriétaires (vue tableau)
// Filtrée sur la copropriété sélectionnée (cookie selected_copro_id)
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Copropriétaires' };

export const revalidate = 60;

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import { isSubscribed } from '@/lib/subscription';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';
import type { CoproprietaireBalanceAccountType, CoproprietaireBalanceSourceType } from '@/lib/coproprietaire-balance';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHelp from '@/components/ui/PageHelp';
import CoproprietaireActions from './CoproprietaireActions';
import CoproprietairesTable from './CoproprietairesTable';
import { Building2, UserCheck, Users } from 'lucide-react';

export default async function CoproprietairesPage() {
  const supabase = await createClient();
  // Syndic : accès complet + actions | Copropriétaire : lecture seule (sans email/telephone/solde)
  const { selectedCoproId, role, copro: copropriete, user, trialUsed } = await requireCoproAccess();
  const isSyndic = role === 'syndic';
  const canWrite = isSubscribed(copropriete?.plan);

  // Aucune copropriété accessible (nouveau compte) → inviter à en créer une
  if (!copropriete) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Copropriétaires</h2>
          <p className="text-gray-500 mt-1">0 copropriétaire(s)</p>
        </div>
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1.5} />}
          title="Aucune copropriété"
          description="Créez votre première copropriété pour commencer à gérer vos copropriétaires."
          action={
            <Link
              href="/coproprietes/nouvelle"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Créer une copropriété →
            </Link>
          }
        />
      </div>
    );
  }

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  // Copropriétaires + tous les lots de la copropriété, en parallèle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coproResult, { data: allLots }, { data: balanceEventsRows }] = await Promise.all([
    isSyndic
      ? supabase.from('coproprietaires').select('id, nom, prenom, raison_sociale, email, telephone, adresse, code_postal, ville, solde, user_id').eq('copropriete_id', selectedCoproId ?? 'none').order('position', { ascending: true, nullsFirst: false })
      : supabase.from('coproprietaires').select('id, nom, prenom, raison_sociale, adresse, code_postal, ville, user_id').eq('copropriete_id', selectedCoproId ?? 'none').order('position', { ascending: true, nullsFirst: false }),
    supabase
      .from('lots')
      .select('id, numero, type, tantiemes, coproprietaire_id')
      .eq('copropriete_id', selectedCoproId ?? 'none')
      .order('position', { ascending: true, nullsFirst: false }),
    isSyndic
      ? supabase
          .from('coproprietaire_balance_events')
          .select('id, coproprietaire_id, event_date, source_type, account_type, label, reason, amount, balance_after, created_at')
          .eq('copropriete_id', selectedCoproId ?? 'none')
          .order('created_at', { ascending: false })
          .order('event_date', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] }),
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
  const lotsForSelect = (allLots ?? []).map((l) => ({
    id: l.id,
    numero: l.numero,
    coproprietaire_id: l.coproprietaire_id,
    type: l.type,
    tantiemes: l.tantiemes,
  }));

  const totalTantiemes = (allLots ?? []).reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const balanceEventsByCoproprietaire = (balanceEventsRows ?? []).reduce<Record<string, {
    id: string;
    event_date: string;
    source_type: CoproprietaireBalanceSourceType;
    account_type: CoproprietaireBalanceAccountType;
    label: string;
    reason: string | null;
    amount: number;
    balance_after: number;
    created_at: string;
  }[]>>((acc, row) => {
    const coproprietaireId = row.coproprietaire_id;
    if (!coproprietaireId) return acc;
    acc[coproprietaireId] = [...(acc[coproprietaireId] ?? []), {
      id: row.id,
      event_date: row.event_date,
      source_type: row.source_type as CoproprietaireBalanceSourceType,
      account_type: row.account_type as CoproprietaireBalanceAccountType,
      label: row.label,
      reason: row.reason,
      amount: row.amount,
      balance_after: row.balance_after,
      created_at: row.created_at,
    }];
    return acc;
  }, {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nbInscrits = (coproprietaires ?? []).filter((c: any) => c.user_id).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const syndicAlreadyLinked = isSyndic && (coproprietaires ?? []).some((c: any) => c.user_id === user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {isSyndic && !canWrite && <ReadOnlyBanner freemium trialUsed={trialUsed} />}

      {/* Bannière persistante si le syndic n'est pas encore lié comme copropriétaire */}
      {isSyndic && !syndicAlreadyLinked && (coproprietaires?.length ?? 0) > 0 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <span className="text-lg shrink-0">💡</span>
          <p>
            <span className="font-semibold">Vous êtes aussi copropriétaire de cet immeuble ?</span>{' '}
            Ne vous ajoutez pas via le bouton « Ajouter » — rendez-vous sur{' '}
            <Link href="/profil" className="font-semibold underline hover:text-blue-900">
              Mon profil
            </Link>{' '}
            puis « Mon statut de copropriétaire » pour vous lier directement à vos lots.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Copropriétaires</h2>
          <p className="text-gray-500 mt-1">{coproprietaires?.length ?? 0} copropriétaire(s)</p>
        </div>
        {isSyndic && (coproprietaires?.length ?? 0) > 0 && <CoproprietaireActions coproprietes={coproprietes} />}
      </div>

      <PageHelp tone={isSyndic ? 'blue' : 'slate'}>
        {isSyndic
          ? 'Tenez ici le registre des copropriétaires, utile pour les convocations d’AG, les appels de fonds, le suivi des lots et l’historique financier des soldes.'
          : 'Consultez ici la liste des copropriétaires et la répartition des tantièmes au sein de l’immeuble.'}
      </PageHelp>

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
            <div className="p-2 bg-green-50 rounded-lg shrink-0"><UserCheck size={18} className="text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Inscrits</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">
                {nbInscrits} <span className="text-sm font-normal text-gray-500">/ {coproprietaires.length}</span>
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
        <Card padding="none">
          <CoproprietairesTable
            initialCoproprietaires={coproprietaires}
            lotsByOwner={lotsByOwner}
            lotsForSelect={isSyndic ? lotsForSelect : undefined}
            totalTantiemes={totalTantiemes}
            readOnly={!isSyndic}
            currentUserId={user.id}
            coproprieteId={selectedCoproId ?? undefined}
            balanceEventsByCoproprietaire={balanceEventsByCoproprietaire}
          />
        </Card>
      ) : (
        <>
          <EmptyState
            icon={<Users size={48} strokeWidth={1.5} />}
            title="Aucun copropriétaire"
            description={isSyndic ? "Ajoutez les copropriétaires en les associant à leurs lots." : "Aucun copropriétaire n'est encore enregistré pour cette copropriété."}
            action={isSyndic ? <CoproprietaireActions coproprietes={coproprietes} showLabel /> : undefined}
          />
          {isSyndic && (
            <div className="flex items-start gap-3 max-w-lg mx-auto p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
              <span className="text-lg shrink-0">💡</span>
              <p>
                <span className="font-semibold">Vous êtes aussi copropriétaire de cet immeuble ?</span>{' '}
                Ne vous ajoutez pas via le bouton « Ajouter » — rendez-vous sur{' '}
                <Link href="/profil" className="font-semibold underline hover:text-blue-900">
                  Mon profil
                </Link>{' '}
                puis « Mon statut de copropriétaire » pour vous lier directement à vos lots.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
