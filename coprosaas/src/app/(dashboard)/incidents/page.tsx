// ============================================================
// Page : Incidents et travaux — Pipeline de suivi par statut
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import EmptyState from '@/components/ui/EmptyState';
import IncidentActions from './IncidentActions';
import IncidentCard from './IncidentCard';
import IncidentGroups from './IncidentGroups';
import { AlertTriangle } from 'lucide-react';
import { isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import type { Incident } from '@/types';

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  const { data: copropriete } = selectedCoproId
    ? await supabase
        .from('coproprietes')
        .select('id, nom, syndic_id, plan, plan_id')
        .eq('id', selectedCoproId)
        .maybeSingle()
    : { data: null };

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];
  const isSyndic   = copropriete?.syndic_id === user.id;
  const canCreate  = isSubscribed(copropriete?.plan);

  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .order('date_declaration', { ascending: false });

  const list = (incidents ?? []) as Incident[];

  // Compteurs pour le header
  const nbActifs  = list.filter(i => i.statut !== 'resolu').length;
  const nbUrgents = list.filter(i => i.priorite === 'urgente' && i.statut !== 'resolu').length;
  const nbResolus = list.filter(i => i.statut === 'resolu').length;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Incidents / Travaux</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {nbActifs} actif{nbActifs !== 1 ? 's' : ''}
            {nbUrgents > 0 && (
              <span className="ml-1 text-red-600 font-medium">· {nbUrgents} urgent{nbUrgents !== 1 ? 's' : ''}</span>
            )}
            {nbResolus > 0 && ` · ${nbResolus} résolu${nbResolus !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div>
          {canCreate
            ? <IncidentActions coproprietes={coproprietes} />
            : <UpgradeBanner compact />}
        </div>
      </div>

      {/* ── Liste groupée par statut ── */}
      {list.length > 0 ? (
        <IncidentGroups incidents={list} isSyndic={isSyndic} />
      ) : (
        <EmptyState
          icon={<AlertTriangle size={48} strokeWidth={1.5} />}
          title="Aucun incident signalé"
          description="Signalez les problèmes et suivez leur résolution en temps réel."
          action={canCreate ? <IncidentActions coproprietes={coproprietes} showLabel /> : <UpgradeBanner />}
        />
      )}
    </div>
  );
}
