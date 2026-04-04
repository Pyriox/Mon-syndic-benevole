// ============================================================
// IncidentGroups — liste groupée par statut (client component)
// Sections : Ouverts · Devis demandé · Devis reçu · En cours · Résolus
// ============================================================
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import IncidentCard from './IncidentCard';
import type { Incident, StatutIncident } from '@/types';

// ---- Config des groupes, dans l'ordre d'affichage ----
const GROUPS: {
  statut: StatutIncident;
  label: string;
  colorClass: string;      // cercle + texte
  bgClass: string;         // fond du header
  defaultOpen: boolean;
}[] = [
  {
    statut:      'ouvert',
    label:       'Ouverts',
    colorClass:  'text-red-700',
    bgClass:     'bg-red-50 border-red-100',
    defaultOpen: true,
  },
  {
    statut:      'devis_demande',
    label:       'Devis demandé',
    colorClass:  'text-yellow-700',
    bgClass:     'bg-yellow-50 border-yellow-100',
    defaultOpen: true,
  },
  {
    statut:      'devis_recu',
    label:       'Devis reçu',
    colorClass:  'text-purple-700',
    bgClass:     'bg-purple-50 border-purple-100',
    defaultOpen: true,
  },
  {
    statut:      'en_cours',
    label:       'En cours',
    colorClass:  'text-blue-700',
    bgClass:     'bg-blue-50 border-blue-100',
    defaultOpen: true,
  },
  {
    statut:      'resolu',
    label:       'Résolus',
    colorClass:  'text-green-700',
    bgClass:     'bg-green-50 border-green-100',
    defaultOpen: false,  // collapsed par défaut
  },
];

interface IncidentGroupsProps {
  incidents: Incident[];
  isSyndic: boolean;
  canWrite: boolean;
}

export default function IncidentGroups({ incidents, isSyndic, canWrite }: IncidentGroupsProps) {
  const [open, setOpen] = useState<Record<StatutIncident, boolean>>(() =>
    Object.fromEntries(GROUPS.map(g => [g.statut, g.defaultOpen])) as Record<StatutIncident, boolean>
  );

  const toggle = (statut: StatutIncident) =>
    setOpen(prev => ({ ...prev, [statut]: !prev[statut] }));

  const priorityRank: Record<string, number> = {
    urgente: 0,
    haute: 1,
    moyenne: 2,
    faible: 3,
  };

  return (
    <div className="space-y-3">
      {GROUPS.map(group => {
        const items = incidents.filter(i => i.statut === group.statut);
        if (items.length === 0) return null;

        const sortedItems = [...items].sort((a, b) => {
          const aNature = a.nature === 'travaux' ? 'travaux' : 'incident';
          const bNature = b.nature === 'travaux' ? 'travaux' : 'incident';

          if (aNature === 'travaux' && bNature === 'travaux') {
            const aDate = a.date_intervention_prevue ? new Date(a.date_intervention_prevue).getTime() : Number.POSITIVE_INFINITY;
            const bDate = b.date_intervention_prevue ? new Date(b.date_intervention_prevue).getTime() : Number.POSITIVE_INFINITY;
            if (aDate !== bDate) return aDate - bDate;
          }

          const byPriority = (priorityRank[a.priorite] ?? 99) - (priorityRank[b.priorite] ?? 99);
          if (byPriority !== 0) return byPriority;

          return new Date(b.date_declaration).getTime() - new Date(a.date_declaration).getTime();
        });

        const isOpen  = open[group.statut];
        const urgents = items.filter(i => i.priorite === 'urgente').length;

        return (
          <div key={group.statut} className="rounded-xl border border-gray-200 overflow-hidden">

            {/* Group header */}
            <button
              onClick={() => toggle(group.statut)}
              className={`w-full flex items-center justify-between px-4 py-3 border-b ${group.bgClass} hover:brightness-95 transition-all`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${group.colorClass}`}>{group.label}</span>
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${group.colorClass} bg-white border`}>
                  {items.length}
                </span>
                {urgents > 0 && (
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    {urgents} urgent{urgents !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {isOpen
                ? <ChevronDown size={15} className={group.colorClass} />
                : <ChevronRight size={15} className={group.colorClass} />
              }
            </button>

            {/* Cards */}
            {isOpen && (
              <div className="bg-gray-50 p-3 space-y-2">
                {sortedItems.map(incident => (
                  <IncidentCard key={incident.id} incident={incident} isSyndic={isSyndic} canWrite={canWrite} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
