// ============================================================
// Page : Incidents et travaux — Signalement et suivi
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import IncidentActions from './IncidentActions';
import AnneeSelector from '@/components/ui/AnneeSelector';
import { formatDate, LABELS_STATUT_INCIDENT, LABELS_PRIORITE } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

// Couleur du badge de statut
function variantStatut(statut: string): 'danger' | 'warning' | 'success' {
  if (statut === 'ouvert') return 'danger';
  if (statut === 'en_cours') return 'warning';
  return 'success';
}

// Couleur du badge de priorité
function variantPriorite(p: string): 'info' | 'warning' | 'danger' | 'default' {
  if (p === 'faible') return 'info';
  if (p === 'moyenne') return 'default';
  if (p === 'haute') return 'warning';
  return 'danger';
}

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const { annee: anneeParam } = await searchParams;
  const annee = parseInt(anneeParam ?? String(new Date().getFullYear()));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  const { data: copropriete } = selectedCoproId
    ? await supabase.from('coproprietes').select('id, nom, syndic_id').eq('id', selectedCoproId).maybeSingle()
    : { data: null };

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  const { data: incidents } = await supabase
    .from('incidents')
    .select('*, coproprietes(nom)')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .gte('date_declaration', `${annee}-01-01`)
    .lt('date_declaration', `${annee + 1}-01-01`)
    .order('date_declaration', { ascending: false });

  // Compteurs par statut
  const nbOuverts = incidents?.filter((i) => i.statut === 'ouvert').length ?? 0;
  const nbEnCours = incidents?.filter((i) => i.statut === 'en_cours').length ?? 0;
  const nbResolus = incidents?.filter((i) => i.statut === 'resolu').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Incidents / Travaux</h2>
          <p className="text-gray-500 mt-1">
            {nbOuverts} ouvert(s) · {nbEnCours} en cours · {nbResolus} résolu(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AnneeSelector annee={annee} />
          <IncidentActions coproprietes={coproprietes ?? []} />
        </div>
      </div>

      {/* Compteurs rapides */}
      {incidents && incidents.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{nbOuverts}</p>
            <p className="text-xs text-red-600 font-medium mt-1">Ouvert(s)</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{nbEnCours}</p>
            <p className="text-xs text-yellow-600 font-medium mt-1">En cours</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{nbResolus}</p>
            <p className="text-xs text-green-600 font-medium mt-1">Résolu(s)</p>
          </div>
        </div>
      )}

      {incidents && incidents.length > 0 ? (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{incident.titre}</h3>
                    <Badge variant={variantStatut(incident.statut)}>
                      {LABELS_STATUT_INCIDENT[incident.statut] ?? incident.statut}
                    </Badge>
                    <Badge variant={variantPriorite(incident.priorite)}>
                      {LABELS_PRIORITE[incident.priorite] ?? incident.priorite}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{incident.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{incident.coproprietes?.nom}</span>
                    <span>Déclaré le {formatDate(incident.date_declaration)}</span>
                    {incident.date_resolution && (
                      <span>Résolu le {formatDate(incident.date_resolution)}</span>
                    )}
                  </div>
                </div>

                {/* Actions de mise à jour du statut */}
                <IncidentActions
                  coproprietes={coproprietes ?? []}
                  incident={incident}
                  mode="update"
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<AlertTriangle size={48} strokeWidth={1.5} />}
          title="Aucun incident signalé"
          description="Signalez les problèmes et suivez leur résolution."
          action={<IncidentActions coproprietes={coproprietes ?? []} showLabel />}
        />
      )}
    </div>
  );
}
