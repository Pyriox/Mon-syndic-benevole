// ============================================================
// Page : Incidents & travaux — distinction entre urgence et planification
// ============================================================
import type { Metadata } from 'next';
import { AlertTriangle, CalendarClock, Wrench } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import EmptyState from '@/components/ui/EmptyState';
import IncidentActions from './IncidentActions';
import IncidentGroups from './IncidentGroups';
import { isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';
import type { Incident } from '@/types';

export const metadata: Metadata = { title: 'Incidents & travaux' };

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { selectedCoproId, role: userRole, copro: copropriete } = await requireCoproAccess();

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];
  const isSyndic = userRole === 'syndic';
  const canWrite = isSubscribed(copropriete?.plan);

  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .order('date_declaration', { ascending: false });

  const list = (incidents ?? []) as Incident[];
  const incidentList = list.filter((item) => (item.nature ?? 'incident') !== 'travaux');
  const travauxList = list.filter((item) => item.nature === 'travaux');

  const nbIncidentsActifs = incidentList.filter((item) => item.statut !== 'resolu').length;
  const nbTravauxActifs = travauxList.filter((item) => item.statut !== 'resolu').length;
  const nbUrgents = incidentList.filter((item) => item.priorite === 'urgente' && item.statut !== 'resolu').length;
  const nbPlanifies = travauxList.filter((item) => !!item.date_intervention_prevue && item.statut !== 'resolu').length;
  const nbResolus = list.filter((item) => item.statut === 'resolu').length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!canWrite && <ReadOnlyBanner />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Incidents & travaux</h2>
          <p className="mt-1 text-sm text-gray-500">
            {nbIncidentsActifs} incident{nbIncidentsActifs !== 1 ? 's' : ''} actif{nbIncidentsActifs !== 1 ? 's' : ''}
            {nbUrgents > 0 && <span className="ml-1 font-medium text-red-600">· {nbUrgents} urgent{nbUrgents !== 1 ? 's' : ''}</span>}
            {` · ${nbTravauxActifs} travaux en suivi`}
            {nbPlanifies > 0 && <span className="ml-1 font-medium text-blue-600">· {nbPlanifies} planifié{nbPlanifies !== 1 ? 's' : ''}</span>}
            {nbResolus > 0 && ` · ${nbResolus} résolu${nbResolus !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div>
          {list.length > 0 && (canWrite ? <IncidentActions coproprietes={coproprietes} /> : <UpgradeBanner compact />)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle size={16} />
            <p className="text-sm font-semibold">Incident = imprévu à traiter rapidement</p>
          </div>
          <p className="mt-1 text-sm text-red-700">
            Exemple : dégât des eaux, panne électrique, souci de sécurité ou ascenseur bloqué.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <CalendarClock size={16} />
            <p className="text-sm font-semibold">Travaux = opération planifiée et suivie dans le temps</p>
          </div>
          <p className="mt-1 text-sm text-blue-700">
            Exemple : réfection toiture, ravalement, changement de porte, travaux votés en AG.
          </p>
        </div>
      </div>

      {list.length > 0 ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <h3 className="text-base font-semibold text-gray-900">Incidents imprévus</h3>
            </div>
            {incidentList.length > 0 ? (
              <IncidentGroups incidents={incidentList} isSyndic={isSyndic} canWrite={canWrite} />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
                Aucun incident imprévu pour le moment.
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Travaux planifiés</h3>
            </div>
            {travauxList.length > 0 ? (
              <IncidentGroups incidents={travauxList} isSyndic={isSyndic} canWrite={canWrite} />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
                Aucun travaux planifié n’est encore suivi ici.
              </div>
            )}
          </section>
        </div>
      ) : (
        <EmptyState
          icon={<AlertTriangle size={48} strokeWidth={1.5} />}
          title="Aucun incident ni travaux"
          description="Suivez ici à la fois les urgences imprévues et les travaux planifiés de la copropriété."
          action={canWrite ? <IncidentActions coproprietes={coproprietes} showLabel /> : <UpgradeBanner />}
        />
      )}
    </div>
  );
}
