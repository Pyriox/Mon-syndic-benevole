// ============================================================
// Client Component : Feuille de présence — affichage + édition
// ============================================================
'use client';

import Card, { CardHeader } from '@/components/ui/Card';
import { UserCheck, UserX, Users } from 'lucide-react';
import LancerAGModal from './LancerAGModal';

interface Copro {
  id: string;
  nom: string;
  prenom: string;
}

interface Presence {
  coproprietaire_id: string;
  statut: string;
  represente_par_id: string | null;
}

interface PresencePanelProps {
  agId: string;
  coproprieteId: string;
  presences: Presence[];
  coproprietaires: Copro[];
  canEdit: boolean;
}

export default function PresencePanel({
  agId,
  coproprieteId,
  presences,
  coproprietaires,
  canEdit,
}: PresencePanelProps) {
  const getName = (id: string) => {
    const c = coproprietaires.find((x) => x.id === id);
    return c ? `${c.prenom} ${c.nom}` : '–';
  };

  const presents   = presences.filter((p) => p.statut === 'present').length;
  const representes = presences.filter((p) => p.statut === 'represente').length;
  const absents    = presences.filter((p) => p.statut === 'absent').length;

  return (
    <Card>
      <CardHeader
        title="Feuille de présence"
        description={
          presences.length === 0
            ? 'Aucune présence enregistrée'
            : `${presents} présent(s) · ${representes} représenté(s) · ${absents} absent(s)`
        }
        actions={
          canEdit ? (
            <LancerAGModal
              agId={agId}
              coproprieteId={coproprieteId}
              existingPresences={presences}
              mode="edit"
            />
          ) : undefined
        }
      />

      {presences.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400 italic text-center py-2">
          La feuille de présence sera complétée au démarrage de l&apos;AG.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-gray-50">
          {presences.map((p) => (
            <div
              key={p.coproprietaire_id}
              className="flex items-center justify-between py-2 px-1 text-sm"
            >
              <span className="font-medium text-gray-800">{getName(p.coproprietaire_id)}</span>
              <div className="flex items-center gap-1.5">
                {p.statut === 'present' && (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <UserCheck size={12} /> Présent
                  </span>
                )}
                {p.statut === 'absent' && (
                  <span className="flex items-center gap-1 text-gray-400 text-xs">
                    <UserX size={12} /> Absent
                  </span>
                )}
                {p.statut === 'represente' && (
                  <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                    <Users size={12} />
                    Représenté par {p.represente_par_id ? getName(p.represente_par_id) : '–'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
