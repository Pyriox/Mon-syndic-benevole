// ============================================================
// Page : Régularisation de charges
// Calcul exercice par exercice, déclenché manuellement après AG
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Régularisation' };

import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import AnneeSelector from '@/components/ui/AnneeSelector';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { formatEuros, formatDate } from '@/lib/utils';
import { isSubscribed } from '@/lib/subscription';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import { ArrowLeftRight, Info, Lock } from 'lucide-react';
import ExerciceCreate from './ExerciceCreate';
import RegularisationTable from './RegularisationTable';
import CloturerButton from './CloturerButton';

export default async function RegularisationPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string }>;
}) {
  const { annee: anneeParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  // Par défaut, afficher l'exercice de l'année précédente (le seul qui peut être régularisé)
  const annee = parseInt(anneeParam ?? String(currentYear - 1));

  const supabase = await createClient();
  const { selectedCoproId, role: userRole, copro: copropriete } = await requireCoproAccess();

  const isSyndic = userRole === 'syndic' || userRole === null;
  const canWrite = isSubscribed(copropriete?.plan);
  const scopeId = selectedCoproId ?? 'none';

  // Exercice pour l'année sélectionnée
  const { data: exercice } = await supabase
    .from('exercices')
    .select('id, copropriete_id, annee, statut, cloture_at')
    .eq('copropriete_id', scopeId)
    .eq('annee', annee)
    .maybeSingle();

  // Lignes de régularisation si exercice existe
  const { data: lignes } = exercice
    ? await supabase
        .from('regularisation_lignes')
        .select('*, coproprietaires(id, nom, prenom, raison_sociale)')
        .eq('exercice_id', exercice.id)
        // Trier : solde + élevé en premier (les débiteurs avant les créditeurs)
        .order('balance', { ascending: false })
    : { data: null };

  const isCloture = exercice?.statut === 'cloture';
  const canCalculate = annee < currentYear;

  // Stats globales (calculées côté serveur pour éviter l'hydratation)
  const totalAppele = (lignes ?? []).reduce((s, l) => s + l.montant_appele, 0);
  const totalReel = (lignes ?? []).reduce((s, l) => s + l.montant_reel, 0);
  const totalBalance = (lignes ?? []).reduce((s, l) => s + l.balance, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {isSyndic && !canWrite && <ReadOnlyBanner />}

      {/* ── En-tête ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Régularisation de charges</h2>
          <p className="text-gray-500 mt-1">
            Exercice {annee} — {isCloture ? 'clôturé' : exercice ? 'en cours de calcul' : 'non initialisé'}
          </p>
        </div>
        <AnneeSelector annee={annee} />
      </div>

      {/* ── Exercice non encore clôturé (année en cours ou future) ── */}
      {annee >= currentYear && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl shrink-0">
              <Lock size={18} className="text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Exercice {annee} en cours</p>
              <p className="text-sm text-gray-500 mt-1">
                La régularisation ne peut être calculée qu&apos;après la clôture de l&apos;exercice,
                à partir du <strong>1er janvier {annee + 1}</strong>.
                Les dépenses du 31 décembre {annee} doivent toutes être saisies avant de lancer le calcul.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Pas encore d'exercice (année passée) ── */}
      {canCalculate && !exercice && isSyndic && (
        <EmptyState
          icon={<ArrowLeftRight size={48} strokeWidth={1.5} />}
          title={`Exercice ${annee} non initialisé`}
          description={`Calculez la régularisation des charges pour l'exercice ${annee}. Les provisions appelées et les dépenses réelles seront comparées pour chaque copropriétaire.`}
          action={
            canWrite ? (
              <ExerciceCreate coproprieteId={scopeId} annee={annee} />
            ) : (
              <UpgradeBanner />
            )
          }
        />
      )}

      {/* ── Vue copropriétaire sans exercice ── */}
      {canCalculate && !exercice && !isSyndic && (
        <EmptyState
          icon={<ArrowLeftRight size={48} strokeWidth={1.5} />}
          title={`Aucune régularisation ${annee}`}
          description="Le syndic n'a pas encore calculé la régularisation pour cet exercice."
        />
      )}

      {/* ── Exercice trouvé ── */}
      {exercice && (
        <>
          {/* Statut */}
          <div className="flex items-center gap-3 flex-wrap">
            {isCloture ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                Clôturé le {formatDate(exercice.cloture_at)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                Calcul provisoire — non clôturé
              </span>
            )}
          </div>

          {/* Stats globales */}
          {(lignes ?? []).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card>
                <p className="text-xs text-gray-500 mb-1">Provisions appelées</p>
                <p className="text-xl font-bold text-gray-900">{formatEuros(totalAppele)}</p>
                <p className="text-xs text-gray-500 mb-1">hors fonds de travaux</p>
              </Card>
              <Card>
                <p className="text-xs text-gray-500 mb-1">Dépenses réelles</p>
                <p className="text-xl font-bold text-gray-900">{formatEuros(totalReel)}</p>
                <p className="text-xs text-gray-500 mb-1">hors fonds ALUR</p>
              </Card>
              <Card>
                <p className="text-xs text-gray-500 mb-1">Écart global</p>
                <p className={`text-xl font-bold ${totalBalance > 0 ? 'text-red-600' : totalBalance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {totalBalance > 0 ? '+' : ''}{formatEuros(totalBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {totalBalance > 0 ? 'à récupérer' : totalBalance < 0 ? 'à reverser / créditer' : 'équilibré'}
                </p>
              </Card>
            </div>
          )}

          {/* Note pédagogique */}
          <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p>
              Les provisions du <strong>fonds de travaux ALUR</strong> et les appels de type{' '}
              <strong>fonds de travaux</strong> sont exclus du calcul.
              Un solde <strong className="text-red-600">positif</strong> signifie que le copropriétaire
              doit un complément&nbsp;; un solde <strong className="text-green-600">négatif</strong>{' '}
              signifie qu&apos;il a un crédit (trop-perçu).
            </p>
          </div>

          {/* Table */}
          {lignes && lignes.length > 0 && (
            <RegularisationTable
              lignes={lignes as Parameters<typeof RegularisationTable>[0]['lignes']}
              isCloture={isCloture}
              isSyndic={isSyndic}
              canWrite={canWrite}
            />
          )}

          {lignes && lignes.length === 0 && (
            <Card>
              <p className="text-sm text-gray-500 text-center py-2">
                Aucun copropriétaire trouvé. Ajoutez des copropriétaires avant de calculer.
              </p>
            </Card>
          )}

          {/* Actions syndic */}
          {isSyndic && canWrite && !isCloture && (
            <div className="flex items-center gap-3 flex-wrap">
              <ExerciceCreate
                coproprieteId={scopeId}
                annee={annee}
                exerciceId={exercice.id}
                isRecalculate
              />
              <CloturerButton exerciceId={exercice.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
