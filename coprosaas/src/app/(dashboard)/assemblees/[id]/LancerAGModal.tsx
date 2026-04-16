// ============================================================
// Client Component : Feuille de présence + lancement / édition
// Utilisé par AGStatusActions (mode launch) et PresencePanel (mode edit)
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logCurrentUserEvent } from '@/lib/actions/log-user-event';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, PlayCircle, UserCheck, UserX, Users } from 'lucide-react';

function replaceCurrentRoute(router: ReturnType<typeof useRouter>) {
  if (typeof window === 'undefined') return;
  router.replace(`${window.location.pathname}${window.location.search}`);
}

interface Copro {
  id: string;
  nom: string;
  prenom: string;
}

type PresenceStatut = 'present' | 'absent' | 'represente';

interface PresenceEntry {
  statut: PresenceStatut;
  represente_par_id: string;
  represente_par_nom: string;
  represente_type: 'interne' | 'externe';
}

export interface ExistingPresence {
  coproprietaire_id: string;
  statut: string;
  represente_par_id: string | null;
  represente_par_nom?: string | null;
}

interface LancerAGModalProps {
  agId: string;
  coproprieteId: string;
  existingPresences?: ExistingPresence[];
  mode?: 'launch' | 'edit';
  convocationEnvoyeeLe?: string | null;
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
  convocationEnvoyeeLe = null,
}: LancerAGModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copros, setCopros] = useState<Copro[]>([]);
  const [presences, setPresences] = useState<Record<string, PresenceEntry>>({});
  const isLaunch = mode === 'launch';
  const requiresConvocationConfirmation = isLaunch && !convocationEnvoyeeLe;
  const [confirmConvocationSent, setConfirmConvocationSent] = useState(!requiresConvocationConfirmation);

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
          const isExterne = ex?.statut === 'represente' && !ex.represente_par_id && Boolean(ex.represente_par_nom);
          init[c.id] = {
            statut: (ex?.statut as PresenceStatut) ?? 'present',
            represente_par_id: ex?.represente_par_id ?? '',
            represente_par_nom: ex?.represente_par_nom ?? '',
            represente_type: isExterne ? 'externe' : 'interne',
          };
        });
        setPresences(init);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, coproprieteId]);

  useEffect(() => {
    if (isOpen) {
      setConfirmConvocationSent(!requiresConvocationConfirmation);
    }
  }, [isOpen, requiresConvocationConfirmation]);

  const setStatut = (id: string, statut: PresenceStatut) =>
    setPresences((p) => ({ ...p, [id]: { ...p[id], statut } }));

  const setRepresentant = (id: string, val: string) =>
    setPresences((p) => ({ ...p, [id]: { ...p[id], represente_par_id: val } }));

  const setRepresentantNom = (id: string, val: string) =>
    setPresences((p) => ({ ...p, [id]: { ...p[id], represente_par_nom: val } }));

  const setRepresenteType = (id: string, type: 'interne' | 'externe') =>
    setPresences((p) => ({ ...p, [id]: { ...p[id], represente_type: type } }));

  const handleConfirm = async () => {
    setLoading(true);
    const rows = copros.map((c) => {
      const entry = presences[c.id];
      const isRepresente = entry?.statut === 'represente';
      const isExterne = isRepresente && entry?.represente_type === 'externe';
      return {
        ag_id: agId,
        coproprietaire_id: c.id,
        statut: entry?.statut ?? 'absent',
        represente_par_id: isRepresente && !isExterne && entry?.represente_par_id
          ? entry.represente_par_id
          : null,
        represente_par_nom: isRepresente && isExterne && entry?.represente_par_nom.trim()
          ? entry.represente_par_nom.trim()
          : null,
      };
    });

    await supabase
      .from('ag_presences')
      .upsert(rows, { onConflict: 'ag_id,coproprietaire_id' });

    if (mode === 'launch') {
      await supabase
        .from('assemblees_generales')
        .update({ statut: 'en_cours' })
        .eq('id', agId)
        .eq('statut', 'planifiee');

      void logCurrentUserEvent({
        eventType: 'ag_status_changed',
        label: 'Statut AG modifié : planifiee → en_cours',
        metadata: { agId, oldStatus: 'planifiee', newStatus: 'en_cours' },
      }).catch(() => undefined);
    }

    setIsOpen(false);
    setLoading(false);
    replaceCurrentRoute(router);
  };

  const presentCount = copros.filter(
    (c) => presences[c.id]?.statut === 'present' || presences[c.id]?.statut === 'represente',
  ).length;

  const launchButtonLabel = isLaunch
    ? (convocationEnvoyeeLe ? "Démarrer l'AG" : "Démarrer l'AG (si convocation déjà envoyée)")
    : 'Présences';

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        {isLaunch ? <PlayCircle size={14} /> : <Users size={14} />}
        {launchButtonLabel}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isLaunch ? "Lancer l'AG — Feuille de présence" : 'Modifier la feuille de présence'}
        size="lg"
      >
        <div className="space-y-4">
          {requiresConvocationConfirmation && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Convocation à vérifier avant lancement</p>
                  <p className="text-sm text-amber-700">
                    Aucune convocation n&apos;a encore été tracée depuis la plateforme. Pour sécuriser le parcours,
                    envoyez-la depuis cette page ou confirmez qu&apos;elle a déjà été transmise par un autre moyen.
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmConvocationSent}
                  onChange={(e) => setConfirmConvocationSent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-amber-800">
                  Je confirme que la convocation a déjà été envoyée à tous les copropriétaires.
                </span>
              </label>
            </div>
          )}

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
                  const entry = presences[c.id] ?? { statut: 'absent', represente_par_id: '', represente_par_nom: '', represente_type: 'interne' as const };
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
                        <div className="space-y-2 pl-3">
                          {/* Toggle interne / externe */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 shrink-0">Mandataire :</span>
                            {(['interne', 'externe'] as const).map((t) => (
                              <button key={t} type="button"
                                onClick={() => setRepresenteType(c.id, t)}
                                className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                                  entry.represente_type === t
                                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                                    : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                }`}>
                                {t === 'interne' ? 'Copropriétaire' : 'Externe'}
                              </button>
                            ))}
                          </div>
                          {entry.represente_type === 'interne' ? (
                            <select
                              value={entry.represente_par_id}
                              onChange={(e) => setRepresentant(c.id, e.target.value)}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="">— choisir —</option>
                              {copros.filter((o) => o.id !== c.id).map((o) => (
                                <option key={o.id} value={o.id}>{o.prenom} {o.nom}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={entry.represente_par_nom}
                              onChange={(e) => setRepresentantNom(c.id, e.target.value)}
                              placeholder="Prénom Nom du mandataire"
                              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              onClick={handleConfirm}
              loading={loading}
              disabled={copros.length === 0 || (requiresConvocationConfirmation && !confirmConvocationSent)}
            >
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
