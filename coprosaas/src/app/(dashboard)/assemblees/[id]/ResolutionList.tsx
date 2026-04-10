// ============================================================
// Client Component : Liste triable de résolutions (drag-and-drop)
// ============================================================
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle, XCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatRepartitionScope, TYPES_RESOLUTION } from '@/lib/utils';
import { ResolutionEdit, ResolutionDelete } from './ResolutionActions';
import VoteParCopro from './VoteParCopro';
import VoteActions from './VoteActions';
import MajoriteTooltip from './MajoriteTooltip';

type AnyResolution = {
  id: string;
  numero: number;
  titre: string;
  description: string | null;
  majorite: string | null;
  statut: string;
  voix_pour: number;
  voix_contre: number;
  voix_abstention: number;
  type_resolution?: string | null;
  budget_postes?: {
    libelle: string;
    montant: number;
    repartition_type?: 'generale' | 'groupe' | null;
    repartition_cible?: string | null;
  }[] | null;
  fonds_travaux_montant?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  designation_resultats?: any[] | null;
};

interface ResolutionListProps {
  resolutions: AnyResolution[];
  agStatut: string;
  agId: string;
  canEdit: boolean;
  canVote: boolean;
  hasPresences: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  voteurs: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  votesCopro: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coproprietaires: any[];
  tantiemesMap: Record<string, number>;
  totalTantiemes: number;
  specialChargesEnabled?: boolean;
}

const badgeVariant = (statut: string): 'success' | 'danger' | 'warning' | 'default' => {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
    approuvee: 'success', refusee: 'danger', reportee: 'warning', en_attente: 'default',
  };
  return map[statut] ?? 'default';
};

const labelStatut: Record<string, string> = {
  approuvee: 'Approuvée', refusee: 'Refusée', reportee: 'Reportée', en_attente: 'En attente',
};

// ── Carte triable ────────────────────────────────────────────

function SortableCard({
  res,
  agStatut,
  canEdit,
  canVote,
  hasPresences,
  voteurs,
  votesCopro,
  coproprietaires,
  tantiemesMap,
  totalTantiemes,
  specialChargesEnabled,
  onResolutionUpdated,
  onResolutionDeleted,
}: {
  res: AnyResolution;
  onResolutionUpdated: (resolution: AnyResolution) => void;
  onResolutionDeleted: (resolutionId: string) => void;
} & Omit<ResolutionListProps, 'resolutions' | 'agId'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: res.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const tr = res.type_resolution ?? null;
  const cfg = tr ? TYPES_RESOLUTION[tr] : null;
  const isPreLaunch = agStatut === 'creation' || agStatut === 'planifiee';

  const cardColor = cfg?.hasBudget
    ? 'border-indigo-200 bg-indigo-50'
    : cfg?.hasFondsTravaux
    ? 'border-amber-200 bg-amber-50'
    : tr === 'calendrier_financement'
    ? 'border-green-200 bg-green-50'
    : cfg?.designation
    ? 'border-blue-200 bg-blue-50'
    : 'border-slate-200 bg-slate-50';

  const numColor = cfg?.hasBudget
    ? 'bg-indigo-100 text-indigo-500'
    : cfg?.hasFondsTravaux
    ? 'bg-amber-100 text-amber-600'
    : tr === 'calendrier_financement'
    ? 'bg-green-100 text-green-600'
    : cfg?.designation
    ? 'bg-blue-100 text-blue-500'
    : 'bg-slate-200 text-slate-500';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border overflow-hidden transition-colors ${cardColor} ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2 px-3 py-3">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            type="button"
            className="mt-0.5 p-0.5 text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing shrink-0 touch-none"
            title="Déplacer"
          >
            <GripVertical size={16} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${numColor}`}>#{res.numero}</span>
            <h4 className="font-semibold text-gray-800 text-sm leading-snug">{res.titre}</h4>
            {!isPreLaunch && (
              <Badge variant={badgeVariant(res.statut)}>{labelStatut[res.statut] ?? res.statut}</Badge>
            )}
            <MajoriteTooltip majorite={res.majorite ?? null} />
          </div>

          {res.description && (
            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{res.description}</p>
          )}

          {/* Aperçu des données structurées (pré-lancement) */}
          {isPreLaunch && (
            <div className="mt-2 space-y-1.5">
              {(res.budget_postes?.length ?? 0) > 0 && tr !== 'calendrier_financement' && (
                <div className="text-xs text-indigo-700 bg-white/70 rounded-lg px-3 py-1.5 border border-indigo-100">
                  <span className="font-semibold">Budget estimatif : </span>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                    (res.budget_postes ?? []).reduce((s, p) => s + p.montant, 0)
                  )}
                  <span className="text-indigo-400 ml-1">
                    ({res.budget_postes!.length} poste{res.budget_postes!.length > 1 ? 's' : ''})
                  </span>
                </div>
              )}
              {res.fonds_travaux_montant != null && (
                <div className="text-xs text-amber-700 bg-white/70 rounded-lg px-3 py-1.5 border border-amber-100">
                  <span className="font-semibold">Cotisation fonds de travaux : </span>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(res.fonds_travaux_montant)}
                </div>
              )}
              {tr === 'calendrier_financement' && (res.budget_postes?.length ?? 0) > 0 && (
                <div className="text-xs text-green-700 bg-white/70 rounded-lg px-3 py-1.5 border border-green-100">
                  <span className="font-semibold">Dates d&apos;appel de fonds : </span>
                  {res.budget_postes!.map((p, i) => (
                    <span key={i} className="inline-block mr-2">
                      {new Date(p.libelle).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Zone de vote */}
          {canVote ? (
            hasPresences && voteurs.length > 0 ? (
              <VoteParCopro
                resolutionId={res.id}
                resolutionStatut={res.statut}
                majorite={res.majorite ?? null}
                typeResolution={res.type_resolution ?? null}
                tantiemesMap={tantiemesMap}
                totalTantiemes={totalTantiemes}
                initialVotes={votesCopro
                  .filter((v) => v.resolution_id === res.id)
                  .map((v) => ({ coproprietaire_id: v.coproprietaire_id, vote: v.vote as 'pour' | 'contre' | 'abstention' }))}
                presences={voteurs}
                coproprietaires={coproprietaires}
                canEdit={agStatut === 'en_cours'}
                designationResultats={res.designation_resultats ?? null}
                initialBudgetPostes={res.budget_postes ?? null}
                initialFondsTravaux={res.fonds_travaux_montant ?? null}
              />
            ) : (
              <VoteActions
                resolutionId={res.id}
                voixPour={res.voix_pour ?? 0}
                voixContre={res.voix_contre ?? 0}
                voixAbstention={res.voix_abstention ?? 0}
                statut={res.statut}
                budgetPostes={res.budget_postes ?? []}
              />
            )
          ) : !isPreLaunch ? (
            <div>
              {(() => {
                const desig = res.designation_resultats as { id: string; nom: string; prenom: string }[] | null;
                if (cfg?.designation && desig && desig.length > 0) {
                  return (
                    <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
                      <span className="font-medium">Désigné{desig.length > 1 ? 's' : ''} : </span>
                      {desig.map((d) => `${d.prenom} ${d.nom}`).join(', ')}
                    </div>
                  );
                }
                return null;
              })()}
              {res.fonds_travaux_montant != null && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  <span className="font-medium">Cotisation fonds de travaux : </span>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(res.fonds_travaux_montant)}
                </div>
              )}
              {!cfg?.designation && (
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={12} /> Pour : {res.voix_pour ?? 0} tant.
                  </span>
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle size={12} /> Contre : {res.voix_contre ?? 0} tant.
                  </span>
                  <span className="flex items-center gap-1">
                    ○ Abst. : {res.voix_abstention ?? 0} tant.
                  </span>
                </div>
              )}
              {(res.budget_postes?.length ?? 0) > 0 && (
                <div className="mt-2 border border-indigo-100 rounded-lg overflow-hidden text-xs">
                  <div className="bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">
                    Budget voté —{' '}
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                      (res.budget_postes ?? []).reduce((s, p) => s + p.montant, 0)
                    )}
                  </div>
                  <table className="w-full">
                    <tbody>
                      {(res.budget_postes ?? []).map((p, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-1.5 text-gray-700">
                            <div>
                              <div>{p.libelle}</div>
                              <div className="text-[10px] text-gray-400">{formatRepartitionScope(p.repartition_type, p.repartition_cible)}</div>
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold text-gray-900">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.montant)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canEdit && <ResolutionEdit resolution={res} agStatut={agStatut} onUpdated={onResolutionUpdated} specialChargesEnabled={specialChargesEnabled} />}
          {canEdit && <ResolutionDelete resolutionId={res.id} onDeleted={onResolutionDeleted} />}
        </div>
      </div>
    </div>
  );
}

// ── Conteneur DnD ────────────────────────────────────────────

export default function ResolutionList({
  resolutions: initialResolutions,
  agStatut,
  canEdit,
  ...rest
}: ResolutionListProps) {
  const supabase = createClient();
  const [resolutions, setResolutions] = useState(initialResolutions);

  const handleResolutionUpdated = (updated: AnyResolution) => {
    setResolutions((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  };

  const handleResolutionDeleted = (resolutionId: string) => {
    setResolutions((prev) => prev.filter((r) => r.id !== resolutionId));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = resolutions.findIndex((r) => r.id === active.id);
    const newIndex = resolutions.findIndex((r) => r.id === over.id);
    const previous = resolutions;
    const reordered = arrayMove(resolutions, oldIndex, newIndex).map((r, i) => ({ ...r, numero: i + 1 }));
    setResolutions(reordered);
    const updates = await Promise.all(
      reordered.map((r, i) => supabase.from('resolutions').update({ numero: i + 1 }).eq('id', r.id))
    );
    if (updates.some((u) => u.error)) {
      setResolutions(previous);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={canEdit ? handleDragEnd : undefined}
    >
      <SortableContext items={resolutions.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {resolutions.map((res) => (
            <SortableCard
              key={res.id}
              res={res}
              agStatut={agStatut}
              canEdit={canEdit}
              onResolutionUpdated={handleResolutionUpdated}
              onResolutionDeleted={handleResolutionDeleted}
              {...rest}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
