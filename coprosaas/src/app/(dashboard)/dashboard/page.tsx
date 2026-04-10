// ============================================================
// Dashboard principal — Vue synthétique de la copropriété
// Affiche les KPIs, dépenses récentes, incidents et AG à venir
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Tableau de bord' };

import { Suspense } from 'react';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import PageHelp from '@/components/ui/PageHelp';
import { Building2 } from 'lucide-react';
import {
  CoproDashboardAlert,
  CoproDashboardHeader,
  CoproDashboardMain,
  DashboardAlertSkeleton,
  DashboardHeaderSkeleton,
  DashboardKpiGridSkeleton,
  DashboardPanelSkeleton,
  SyndicDashboardAlert,
  SyndicDashboardAssemblies,
  SyndicDashboardBudgetPanels,
  SyndicDashboardHeader,
  SyndicDashboardMetrics,
  SyndicDashboardTasks,
} from './DashboardSections';

export default async function DashboardPage() {
  const { user, selectedCoproId, role: userRole, copro: copropriete } = await requireCoproAccess();
  const scopeId = selectedCoproId ?? 'none';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Suspense fallback={<DashboardHeaderSkeleton />}>
        {userRole === 'copropriétaire' ? (
          <CoproDashboardHeader
            userId={user.id}
            coproId={scopeId}
            coproprieteName={copropriete?.nom ?? null}
          />
        ) : (
          <SyndicDashboardHeader coproId={scopeId} coproprieteName={copropriete?.nom ?? null} />
        )}
      </Suspense>

      {copropriete && (
        <PageHelp tone={userRole === 'copropriétaire' ? 'slate' : 'blue'}>
          {userRole === 'copropriétaire'
            ? 'Retrouvez ici vos soldes, documents partagés et prochaines échéances liées à votre copropriété.'
            : 'Ce tableau de bord centralise les points de gestion quotidiens : budget, appels de fonds, incidents et assemblées générales.'}
        </PageHelp>
      )}

      {!copropriete &&
        (userRole === 'copropriétaire' ? (
          <Card className="text-center py-12">
            <Building2 size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">Vous n&apos;êtes rattaché à aucune copropriété</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
              Attendez l&apos;invitation de votre syndic pour accéder à votre espace copropriétaire.
            </p>
          </Card>
        ) : (
          <Card className="text-center py-14">
            <Building2 size={52} className="mx-auto text-blue-200 mb-5" />
            <h3 className="text-xl font-bold text-gray-800">Bienvenue sur Mon Syndic Bénévole !</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
              Commencez par créer votre première copropriété pour configurer lots, copropriétaires, finances et documents.
            </p>
            <Link
              href="/coproprietes/nouvelle"
              className="inline-flex items-center gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
            >
              <Building2 size={18} />
              Créer ma première copropriété
            </Link>
          </Card>
        ))}

      {copropriete && userRole === 'copropriétaire' && (
        <>
          <Suspense fallback={<DashboardAlertSkeleton />}>
            <CoproDashboardAlert userId={user.id} coproId={scopeId} />
          </Suspense>

          <Suspense
            fallback={
              <>
                <DashboardKpiGridSkeleton columns={2} />
                <DashboardPanelSkeleton cards={1} />
                <DashboardPanelSkeleton cards={1} />
              </>
            }
          >
            <CoproDashboardMain userId={user.id} coproId={scopeId} />
          </Suspense>
        </>
      )}

      {copropriete && userRole !== 'copropriétaire' && (
        <>
          <Suspense fallback={<DashboardAlertSkeleton />}>
            <SyndicDashboardAlert coproId={scopeId} />
          </Suspense>

          <Suspense
            fallback={
              <>
                <DashboardKpiGridSkeleton columns={3} />
                <DashboardKpiGridSkeleton columns={3} />
              </>
            }
          >
            <SyndicDashboardMetrics coproId={scopeId} />
          </Suspense>

          <Suspense fallback={<DashboardPanelSkeleton cards={2} />}>
            <SyndicDashboardBudgetPanels coproId={scopeId} />
          </Suspense>

          <Suspense fallback={<DashboardPanelSkeleton cards={1} />}>
            <SyndicDashboardTasks coproId={scopeId} />
          </Suspense>

          <Suspense fallback={<DashboardPanelSkeleton cards={1} />}>
            <SyndicDashboardAssemblies coproId={scopeId} />
          </Suspense>
        </>
      )}
    </div>
  );
}
