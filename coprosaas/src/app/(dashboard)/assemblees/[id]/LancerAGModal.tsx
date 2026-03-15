// ============================================================
// Client Component : Feuille de présence + lancement / édition
// Utilisé par AGStatusActions (mode launch) et PresencePanel (mode edit)
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { PlayCircle, UserCheck, UserX, Users } from 'lucide-react';

interface Copro {
  id: string;
  nom: string;
  prenom: string;
}

type PresenceStatut = 'present' | 'absent' | 'represente';

interface PresenceEntry {
  statut: PresenceStatut;
  represente_par_id: string;
}

export interface ExistingPresence {
  coproprietaire_id: string;
  statut: string;
  represente_par_id: string | null;
}

interface LancerAGModalProps {
  agId: string;
  coproprieteId: string;
  existingPresences?: ExistingPresence[];
  mode?: 'launch' | 'edit';
}

const STATUS_OPTIONS: { value: PresenceStatut; label: string; activeClass: string }[] = [
  { value: 'present',    label: 'Présent',     activeClass: 'bg-green-100 border-green-300 text-green-700' },
  { value: 'absent',     label: 'Absent',      activeClass: 'bg-gray-200 border-gray-300 text-gray-600' },
  { value: 'represente', label: 'Représenté',  activeClass: 'bg-blue-100 border-blue-300 text-blue-700' },
];

export default function LancerAGModal({
  agId,
  coproprieteId,
  existingPresences = [],
  mode = 'launch',
}: LancerAGModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copros, setCopros] = useState<Copro[]>([]);
  const [presences, setPresences] = useState<Record<string, PresenceEntry>>({});

  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from('coproprietaires')
      .select('id, nom, prenom')
      .eq('copropriete_id', coproprieteId)
      .order('nom')
      .then(({ data }) => {
        if (!data) return;
        setCopros(data);
        const init: Record<string, PresenceEntry> = {};
        data.forEach((c) => {
          const ex = existingPresences.find((p) => p.coproprietaire_id === c.id);
          init[c.id] = {
            statut: (ex?.statut as PresenceStatut) ?? 'present',
            represente_par_id: ex?.represente_par_id ?? '',
          };
        });
        setPresences(init);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, coproprieteId]);

  const setStatut = (id: string, statut: PresenceStatut) =>
    setPresences((p) => ({ ...p, [id]: { ...p[id], statut } }));

  const setRepresentant = (id: string, val: string) =>
    setPresences((p) => ({ ...p, [id]: { ...p[id], represente_par_id: val } }));

  const handleConfirm = async () => {
    setLoading(true);
    const rows = copros.map((c) => ({
      ag_id: agId,
      coproprietaire_id: c.id,
      statut: presences[c.id]?.statut ?? 'absent',
      represente_par_id:
        presences[c.id]?.statut === 'represente' && presences[c.id]?.represente_par_id
          ? presences[c.id].represente_par_id
          : null,
    }));

    await supabase
      .from('ag_presences')
      .upsert(rows, { onConflict: 'ag_id,coproprietaire_id' });

    if (mode === 'launch') {
      await supabase
        .from('assemblees_generales')
        .update({ statut: 'en_cours' })
        .eq('id', agId);
    }

    setIsOpen(false);
    setLoading(false);
    router.refresh();
  };

  const presentCount = copros.filter(
    (c) => presences[c.id]?.statut === 'present' || presences[c.id]?.statut === 'represente',
  ).length;

  const isLaunch = mode === 'launch';

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        {isLaunch ? <PlayCircle size={14} /> : <Users size={14} />}
        {isLaunch ? "Démarrer l'AG" : 'Présences'}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isLaunch ? "Lancer l'AG — Feuille de présence" : 'Modifier la feuille de présence'}
        size="lg"
      >
        <div className="space-y-4">
          {copros.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              Chargement des copropriétaires…
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Indiquez la situation de chaque copropriétaire pour cette assemblée.{' '}
                <span className="font-semibold text-blue-700">
                  {presentCount} présent(s) / représenté(s)
                </span>
              </p>

              <div className="max-h-[28rem] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                {copros.map((c) => {
                  const entry = presences[c.id] ?? { statut: 'absent', represente_par_id: '' };
                  return (
                    <div key={c.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {c.prenom} {c.nom}
                        </span>
                        <div className="flex items-center gap-1">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStatut(c.id, opt.value)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                entry.statut === opt.value
                                  ? opt.activeClass
                                  : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              {opt.value === 'present'    && <UserCheck size={11} />}
                              {opt.value === 'absent'     && <UserX    size={11} />}
                              {opt.value === 'represente' && <Users    size={11} />}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {entry.statut === 'represente' && (
                        <div className="flex items-center gap-2 pl-3">
                          <span className="text-xs text-gray-500 shrink-0">Représenté par :</span>
                          <select
                            value={entry.represente_par_id}
                            onChange={(e) => setRepresentant(c.id, e.target.value)}
                            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="">— choisir —</option>
                            {copros
                              .filter((o) => o.id !== c.id)
                              .map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.prenom} {o.nom}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Button onClick={handleConfirm} loading={loading} disabled={copros.length === 0}>
              {isLaunch && <PlayCircle size={14} />}
              {isLaunch ? "Lancer l'AG" : 'Enregistrer'}
            </Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
