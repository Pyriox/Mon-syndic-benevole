import Link from 'next/link';
import { cache } from 'react';
import Card from '@/components/ui/Card';
import CoproprietaireBalanceHistory from '../coproprietaires/CoproprietaireBalanceHistory';
import { getCoproprietaireDashboardSnapshot, getSyndicDashboardSnapshot } from '@/lib/cached-queries';
import { formatDate, formatEuros, LABELS_CATEGORIE } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Banknote,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Minus,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

const catColorMap: Record<string, { bar: string; dot: string }> = {
  entretien: { bar: 'bg-orange-400', dot: 'bg-orange-400' },
  assurance: { bar: 'bg-blue-400', dot: 'bg-blue-400' },
  eau: { bar: 'bg-cyan-400', dot: 'bg-cyan-400' },
  electricite: { bar: 'bg-purple-400', dot: 'bg-purple-400' },
  ascenseur: { bar: 'bg-indigo-400', dot: 'bg-indigo-400' },
  espaces_verts: { bar: 'bg-green-400', dot: 'bg-green-400' },
  nettoyage: { bar: 'bg-teal-400', dot: 'bg-teal-400' },
  administration: { bar: 'bg-gray-400', dot: 'bg-gray-400' },
  travaux: { bar: 'bg-yellow-400', dot: 'bg-yellow-400' },
  fonds_travaux_alur: { bar: 'bg-amber-400', dot: 'bg-amber-400' },
  syndic_benevole: { bar: 'bg-blue-600', dot: 'bg-blue-600' },
  autre: { bar: 'bg-slate-300', dot: 'bg-slate-300' },
};

const getCoproDashboardSnapshotCached = cache(
  async (userId: string, coproId: string) => getCoproprietaireDashboardSnapshot(userId, coproId)
);

const getSyndicDashboardSnapshotCached = cache(
  async (coproId: string) => getSyndicDashboardSnapshot(coproId)
);

export function DashboardHeaderSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-8 w-52 rounded bg-gray-200" />
      <div className="h-4 w-72 rounded bg-gray-100" />
    </div>
  );
}

export function DashboardAlertSkeleton() {
  return <div className="h-20 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />;
}

export function DashboardKpiGridSkeleton({ columns = 3 }: { columns?: 2 | 3 }) {
  const gridClass = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-4`}>
      {Array.from({ length: columns }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <div className="h-20 rounded bg-gray-100" />
        </Card>
      ))}
    </div>
  );
}

export function DashboardPanelSkeleton({ cards = 1 }: { cards?: number }) {
  return (
    <div className={`grid grid-cols-1 ${cards > 1 ? 'lg:grid-cols-2' : ''} gap-6`}>
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <div className="h-48 rounded bg-gray-100" />
        </Card>
      ))}
    </div>
  );
}

export async function CoproDashboardHeader({
  userId,
  coproId,
  coproprieteName,
}: {
  userId: string;
  coproId: string;
  coproprieteName: string | null;
}) {
  const data = await getCoproDashboardSnapshotCached(userId, coproId);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">
        {data.displayFirstName ? `Bonjour, ${data.displayFirstName}` : 'Tableau de bord'}
      </h2>
      <p className="text-gray-500 mt-1">
        {coproprieteName ?? 'Sélectionnez une copropriété dans le menu de navigation'}
      </p>
    </div>
  );
}

export async function CoproDashboardAlert({ userId, coproId }: { userId: string; coproId: string }) {
  const data = await getCoproDashboardSnapshotCached(userId, coproId);

  if (!data.prochaineAG || data.joursAvantAG === null || data.joursAvantAG > 30) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <BellRing size={18} className="text-amber-700 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          Assemblée Générale dans{' '}
          <span className="inline-flex items-center bg-amber-100 text-amber-700 rounded-md px-2 py-0.5 text-xs font-bold">
            J&minus;{data.joursAvantAG}
          </span>
        </p>
        <p className="text-xs text-amber-700 mt-0.5 truncate">
          {data.prochaineAG.titre} &middot;{' '}
          {new Date(data.prochaineAG.date_ag).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>
      <Link
        href={`/assemblees/${data.prochaineAG.id}`}
        className="shrink-0 text-xs text-amber-700 hover:text-amber-900 font-semibold underline-offset-2 hover:underline"
      >
        Voir &rarr;
      </Link>
    </div>
  );
}

export async function CoproDashboardMain({ userId, coproId }: { userId: string; coproId: string }) {
  const data = await getCoproDashboardSnapshotCached(userId, coproId);

  if (!data.fiche) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500 text-sm italic">
          Votre fiche copropriétaire n&apos;est pas encore associée à ce compte. Contactez votre syndic.
        </p>
      </Card>
    );
  }

  const hasDebt = data.solde > 0;
  const hasCredit = data.solde < 0;
  const displayedSolde = hasDebt ? -Math.abs(data.solde) : hasCredit ? Math.abs(data.solde) : 0;
  const displayName = data.fiche.raison_sociale ?? ([data.fiche.prenom, data.fiche.nom].filter(Boolean).join(' ') || 'Mon compte');

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${hasDebt ? 'bg-red-100' : hasCredit ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Scale size={24} className={hasDebt ? 'text-red-600' : hasCredit ? 'text-green-600' : 'text-gray-500'} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Mon solde</p>
            <p className={`text-2xl font-bold ${hasDebt ? 'text-red-600' : hasCredit ? 'text-green-700' : 'text-gray-900'}`}>
              {hasCredit ? '+' : ''}{formatEuros(displayedSolde)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasDebt ? 'Charges à régler' : hasCredit ? 'Avance de trésorerie' : 'Solde à jour'}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl shrink-0">
            <CalendarDays size={24} className="text-purple-600" />
          </div>
          {data.prochaineAG ? (
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Prochaine AG</p>
              <p className="font-bold text-gray-900 truncate">{data.prochaineAG.titre}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(data.prochaineAG.date_ag).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Prochaine AG</p>
              <p className="text-sm text-gray-500 mt-1 italic">Aucune AG planifiée</p>
            </div>
          )}
        </Card>
      </div>

      {data.chargesImpayees.length > 0 ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Mes charges à régler</h3>
            <Link href="/appels-de-fonds" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="divide-y divide-gray-100">
            {data.chargesImpayees.map((ligne) => (
              <li key={ligne.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{ligne.appel?.titre ?? 'Appel de fonds'}</p>
                  {ligne.appel?.date_echeance && (
                    <p className="text-xs text-gray-500">Échéance : {formatDate(ligne.appel.date_echeance)}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-red-600 shrink-0 ml-3">
                  {formatEuros(ligne.montant_du)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-3 py-1">
            <div className="p-2 bg-green-100 rounded-lg shrink-0">
              <Banknote size={18} className="text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">Aucune charge en attente — vous êtes à jour !</p>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Historique de mes mouvements</h3>
            <p className="text-xs text-gray-500 mt-1">Suivez ici l’évolution de votre solde, les régularisations et les paiements enregistrés.</p>
          </div>
          <span className="text-xs text-gray-500">12 derniers mouvements</span>
        </div>
        <CoproprietaireBalanceHistory
          mode="inline"
          coproprietaireId={data.fiche.id}
          displayName={displayName}
          currentBalance={data.solde}
          initialEvents={data.balanceEvents ?? []}
          showSummary={false}
        />
      </Card>

      {data.assembleesUpcoming.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              <CalendarDays size={18} className="inline mr-2 text-purple-600" />
              Assemblées générales à venir
            </h3>
            <Link href="/assemblees" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.assembleesUpcoming.map((ag) => (
              <Link
                key={ag.id}
                href={`/assemblees/${ag.id}`}
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <p className="font-medium text-gray-800 text-sm">{ag.titre}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(ag.date_ag)}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

export async function SyndicDashboardHeader({
  coproId,
  coproprieteName,
}: {
  coproId: string;
  coproprieteName: string | null;
}) {
  const data = await getSyndicDashboardSnapshotCached(coproId);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
      <p className="text-gray-500 mt-1">
        {coproprieteName
          ? `${data.nbLots} lot(s) · ${data.nbCoproprietaires} copropriétaire(s)`
          : 'Sélectionnez une copropriété dans le menu de navigation'}
      </p>
    </div>
  );
}

export async function SyndicDashboardAlert({ coproId }: { coproId: string }) {
  const data = await getSyndicDashboardSnapshotCached(coproId);

  const overdueLineCount = data.nbLignesImpayees ?? data.nbImpayes ?? 0;
  const showUnpaidAlert = data.totalMontantImpaye > 0 && overdueLineCount > 0;
  const showAgAlert = Boolean(data.agUrgente && data.prochaineAG && data.joursAvantAG !== null);

  if (!showUnpaidAlert && !showAgAlert) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showUnpaidAlert && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <BellRing size={18} className="text-red-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {overdueLineCount} ligne{overdueLineCount > 1 ? 's' : ''} d&apos;appel de fonds en retard
            </p>
            <p className="text-xs text-red-700 mt-0.5 truncate">
              {formatEuros(data.totalMontantImpaye)} à régulariser · {data.nbImpayes} copropriétaire{data.nbImpayes > 1 ? 's' : ''} concerné{data.nbImpayes > 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/appels-de-fonds"
            className="shrink-0 text-xs text-red-700 hover:text-red-900 font-semibold underline-offset-2 hover:underline"
          >
            Voir &rarr;
          </Link>
        </div>
      )}

      {showAgAlert && data.prochaineAG && data.joursAvantAG !== null && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <BellRing size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              Assemblée Générale dans{' '}
              <span className="inline-flex items-center bg-amber-100 text-amber-700 rounded-md px-2 py-0.5 text-xs font-bold">
                J&minus;{data.joursAvantAG}
              </span>
            </p>
            <p className="text-xs text-amber-700 mt-0.5 truncate">
              {data.prochaineAG.titre} &middot;{' '}
              {new Date(data.prochaineAG.date_ag).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <Link
            href={`/assemblees/${data.prochaineAG.id}`}
            className="shrink-0 text-xs text-amber-700 hover:text-amber-900 font-semibold underline-offset-2 hover:underline"
          >
            Voir &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

export async function SyndicDashboardMetrics({ coproId }: { coproId: string }) {
  const data = await getSyndicDashboardSnapshotCached(coproId);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl shrink-0">
            <Wallet size={24} className="text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Provisions {data.currentYear}</p>
            {data.hasProvisions ? (
              <>
                <p className="text-2xl font-bold text-gray-900">{formatEuros(data.totalProvisions)}</p>
                {data.totalFondsTravaux > 0 ? (
                  <p className="text-xs text-amber-500 font-medium mt-0.5">
                    dont {formatEuros(data.totalFondsTravaux)} fonds travaux ALUR
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Charges appelées aux copro.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-gray-500">&mdash;</p>
                <p className="text-xs text-gray-500 mt-0.5">Aucune provision saisie pour {data.currentYear}</p>
              </>
            )}
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl shrink-0">
            <Receipt size={24} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dépenses réelles {data.currentYear}</p>
            <p className="text-2xl font-bold text-gray-900">{formatEuros(data.totalDepensesAvecFT)}</p>
            {data.totalFondsTravaux > 0 ? (
              <p className="text-xs text-amber-500 font-medium mt-0.5">
                dont {formatEuros(data.totalFondsTravaux)} fonds travaux ALUR
              </p>
            ) : (
              <>
                {data.tendanceDepenses === 'hausse' && (
                  <p className="text-xs text-red-600 flex items-center gap-0.5 mt-0.5 font-medium">
                    <ArrowUp size={11} />{data.pctTendance}% vs {data.prevYear}
                  </p>
                )}
                {data.tendanceDepenses === 'baisse' && (
                  <p className="text-xs text-green-600 flex items-center gap-0.5 mt-0.5 font-medium">
                    <ArrowDown size={11} />{Math.abs(data.pctTendance)}% vs {data.prevYear}
                  </p>
                )}
                {data.tendanceDepenses === 'stable' && (
                  <p className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5">
                    <Minus size={11} />Stable vs {data.prevYear}
                  </p>
                )}
              </>
            )}
          </div>
        </Card>

        {data.hasProvisions ? (
          <Card className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${data.ecartPrevisionnel > 0 ? 'bg-green-100' : data.ecartPrevisionnel < 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              {data.ecartPrevisionnel > 0 ? (
                <TrendingUp size={24} className="text-green-600" />
              ) : data.ecartPrevisionnel < 0 ? (
                <TrendingDown size={24} className="text-orange-600" />
              ) : (
                <Minus size={24} className="text-gray-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Écart prévisionnel</p>
              <p className={`text-2xl font-bold ${data.ecartPrevisionnel > 0 ? 'text-green-700' : data.ecartPrevisionnel < 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                {data.ecartPrevisionnel > 0 ? '+' : ''}{formatEuros(data.ecartPrevisionnel)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {data.ecartPrevisionnel > 0
                  ? 'Surplus (trop-perçu provisoire)'
                  : data.ecartPrevisionnel < 0
                    ? 'Déficit à régulariser'
                    : 'Provisions = dépenses'}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center gap-4 border-dashed border-gray-200">
            <div className="p-3 bg-gray-50 rounded-xl shrink-0">
              <Minus size={24} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Écart prévisionnel</p>
              <p className="text-sm text-gray-700 font-semibold mt-0.5">—</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Aucune provision saisie pour {data.currentYear}.{' '}
                <Link href="/appels-de-fonds" className="text-gray-600 hover:text-blue-600 hover:underline">
                  Saisir un appel de fonds
                </Link>
              </p>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${data.totalMontantImpaye > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
            <Banknote size={24} className={data.totalMontantImpaye > 0 ? 'text-red-600' : 'text-gray-500'} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Solde impayé</p>
            <p className={`text-2xl font-bold ${data.totalMontantImpaye > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatEuros(data.totalMontantImpaye)}
            </p>
            {data.nbImpayes > 0 ? (
              <p className="text-xs text-red-600 mt-0.5">
                {data.nbImpayes} copropriétaire{data.nbImpayes > 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">Aucun impayé</p>
            )}
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-xl shrink-0">
            <AlertTriangle size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Incidents en cours</p>
            <p className="text-2xl font-bold text-gray-900">{data.nbIncidentsOuverts}</p>
            {data.nbIncidentsOuverts === 0 && <p className="text-xs text-green-700 mt-0.5">Aucun incident ouvert</p>}
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl shrink-0">
            <Users size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Copropriétaires</p>
            <p className="text-2xl font-bold text-gray-900">{data.nbCoproprietaires}</p>
            <p className="text-xs text-gray-500 mt-0.5">{data.nbLots} lot{data.nbLots > 1 ? 's' : ''}</p>
          </div>
        </Card>
      </div>
    </>
  );
}

export async function SyndicDashboardBudgetPanels({ coproId }: { coproId: string }) {
  const data = await getSyndicDashboardSnapshotCached(coproId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Budget {data.currentYear}</h3>
          <Link href="/depenses" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        {data.depenses.length > 0 || data.totalFondsTravaux > 0 ? (
          <ul className="divide-y divide-gray-100">
            {data.depenses.map((depense) => {
              const colors = catColorMap[depense.categorie] ?? { bar: 'bg-gray-300', dot: 'bg-gray-300' };
              return (
                <li key={depense.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${colors.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{depense.titre}</p>
                      <p className="text-xs text-gray-500">
                        {LABELS_CATEGORIE[depense.categorie] ?? depense.categorie}
                        <span className="mx-1">·</span>
                        {formatDate(depense.date_depense)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 shrink-0 ml-3">
                    {formatEuros(depense.montant)}
                  </span>
                </li>
              );
            })}
            {data.totalFondsTravaux > 0 && (
              <li className="flex items-center justify-between py-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0 mt-1.5 bg-amber-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">Fonds travaux ALUR</p>
                    <p className="text-xs text-gray-500">{data.currentYear}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 shrink-0 ml-3">
                  {formatEuros(data.totalFondsTravaux)}
                </span>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Aucune dépense enregistrée</p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Répartition du budget</h3>
          <span className="text-xs text-gray-500">dépenses + FT {data.currentYear}</span>
        </div>
        {data.repartitionBudget.length > 0 ? (
          <div className="space-y-3">
            {data.repartitionBudget.map(({ cat, total, pct }) => {
              const colors = catColorMap[cat] ?? { bar: 'bg-gray-300', dot: 'bg-gray-300' };
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                      <span className="text-gray-600 font-medium">{LABELS_CATEGORIE[cat] ?? cat}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>{formatEuros(total)}</span>
                      <span className="font-semibold text-gray-700 w-9 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`${colors.bar} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100 text-right">
              Total : <span className="font-semibold text-gray-600">{formatEuros(data.totalBudget)}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Aucune dépense enregistrée</p>
        )}
      </Card>
    </div>
  );
}

export async function SyndicDashboardTasks({ coproId }: { coproId: string }) {
  const data = await getSyndicDashboardSnapshotCached(coproId);

  if (data.incidentsAnciens.length === 0) {
    return null;
  }

  return (
    <Card padding="md">
      <div className="flex items-center gap-2 mb-4">
        <BellRing size={16} className="text-red-500" />
        <h3 className="font-semibold text-gray-900">Alertes &amp; tâches à traiter</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {data.incidentsAnciens.length > 0 && (
          <div className="flex flex-wrap items-start gap-3 justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {data.incidentsAnciens.length} incident{data.incidentsAnciens.length > 1 ? 's' : ''} ouvert{data.incidentsAnciens.length > 1 ? 's' : ''} sans suivi depuis plus de 7 jours
                </p>
                <p className="text-xs text-gray-500 truncate max-w-xs">
                  {data.incidentsAnciens.map((incident) => incident.titre).join(', ')}
                </p>
              </div>
            </div>
            <Link href="/incidents" className="text-xs text-blue-600 hover:underline font-medium shrink-0">
              Voir &rarr;
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}

export async function SyndicNextAction({ coproId }: { coproId: string }) {
  const data = await getSyndicDashboardSnapshotCached(coproId);

  if (data.totalMontantImpaye > 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <Banknote size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {formatEuros(data.totalMontantImpaye)} d&apos;impayés à régulariser
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {data.nbImpayes} copropriétaire{data.nbImpayes > 1 ? 's' : ''} concerné{data.nbImpayes > 1 ? 's' : ''} — relancez-les ou enregistrez les paiements.
            </p>
          </div>
        </div>
        <Link
          href="/appels-de-fonds"
          className="shrink-0 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors"
        >
          Gérer les impayés →
        </Link>
      </div>
    );
  }

  if (data.incidentsAnciens.length > 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {data.incidentsAnciens.length} incident{data.incidentsAnciens.length > 1 ? 's' : ''} sans suivi depuis 7+ jours
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Mettez à jour ces incidents pour garder une trace et informer les copropriétaires.
            </p>
          </div>
        </div>
        <Link
          href="/incidents"
          className="shrink-0 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors"
        >
          Voir les incidents →
        </Link>
      </div>
    );
  }

  if (data.agUrgente && data.prochaineAG && data.joursAvantAG !== null) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <CalendarDays size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              AG dans J&minus;{data.joursAvantAG} — préparez l&apos;ordre du jour
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {data.prochaineAG.titre} &middot;{' '}
              {new Date(data.prochaineAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <Link
          href={`/assemblees/${data.prochaineAG.id}`}
          className="shrink-0 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors"
        >
          Préparer l&apos;AG →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
      <div className="p-2 bg-green-100 rounded-lg shrink-0">
        <CheckCircle2 size={18} className="text-green-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-green-800">Tout est à jour</p>
        <p className="text-xs text-green-700 mt-0.5">Aucune action urgente — la copropriété est bien gérée.</p>
      </div>
    </div>
  );
}

export async function SyndicDashboardAssemblies({ coproId }: { coproId: string }) {
  const data = await getSyndicDashboardSnapshotCached(coproId);

  if (data.assemblees.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          <CalendarDays size={18} className="inline mr-2 text-purple-600" />
          Assemblées générales à venir
        </h3>
        <Link href="/assemblees" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          Voir tout <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.assemblees.map((ag) => (
          <Link
            key={ag.id}
            href={`/assemblees/${ag.id}`}
            className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <p className="font-medium text-gray-800 text-sm">{ag.titre}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDate(ag.date_ag)}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
