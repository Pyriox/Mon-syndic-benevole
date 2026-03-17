// ============================================================
// Client Component : Changement de statut d'une AG
// creation  → planifiee : valider la planification
// planifiee → en_cours  : lancer l'AG (feuille de présence)
// en_cours  → terminee  : clôturer
// planifiee → annulee   : annuler (avec trace)
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { CheckCircle, Trash2, XCircle, Send, CalendarCheck, Pencil, Video, AlertTriangle, Mail } from 'lucide-react';
import LancerAGModal from './LancerAGModal';
import { genererConvocationDoc, type ConvocationAGData, type ConvocationResolution } from './ConvocationPDF';

// ---- Helper : trouver ou créer un sous-dossier ----
async function getOrCreateSubDossier(
  supabase: ReturnType<typeof createClient>,
  nom: string,
  parentId: string | null,
  syndicId: string
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = (supabase.from('document_dossiers') as any)
    .select('id')
    .eq('syndic_id', syndicId)
    .eq('nom', nom);
  const filtered = parentId ? base.eq('parent_id', parentId) : base.is('parent_id', null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (filtered as any).maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((existing as any)?.id) return (existing as any).id;

  const insertPayload: Record<string, string | null | boolean> = { nom, syndic_id: syndicId, is_default: false };
  if (parentId) insertPayload.parent_id = parentId;
  const { data: created } = await supabase
    .from('document_dossiers')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertPayload as any)
    .select('id')
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (created as any)?.id ?? null;
}

async function getDossierConvocationsAG(
  supabase: ReturnType<typeof createClient>,
  syndicId: string,
  dateAg: string,
  titreAg: string
): Promise<string | null> {
  const year = new Date(dateAg).getFullYear().toString();
  const rootId = await getOrCreateSubDossier(supabase, 'Assemblées Générales', null, syndicId);
  if (!rootId) return null;
  const yearId = await getOrCreateSubDossier(supabase, year, rootId, syndicId);
  if (!yearId) return null;
  const dateFr = new Date(dateAg).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const agFolderName = `${titreAg} — ${dateFr}`;
  return getOrCreateSubDossier(supabase, agFolderName, yearId, syndicId);
}

// ---- Modification de la date/heure et du lieu ----
export function AGEditInfos({ agId, dateAg, lieu }: { agId: string; dateAg: string; lieu: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initial = new Date(dateAg);
  const pad = (n: number) => String(n).padStart(2, '0');
  const [dateVal,   setDateVal]   = useState(`${initial.getFullYear()}-${pad(initial.getMonth() + 1)}-${pad(initial.getDate())}`);
  const [heureVal,  setHeureVal]  = useState(pad(initial.getHours()));
  const [minuteVal, setMinuteVal] = useState(pad(initial.getMinutes()));
  const [isVisio,   setIsVisio]   = useState(lieu === 'Visioconférence');
  const [lieuVal,   setLieuVal]   = useState(lieu === 'Visioconférence' ? '' : (lieu ?? ''));

  const handleSave = async () => {
    if (!dateVal) { setError('La date est requise.'); return; }
    setLoading(true);
    setError('');
    const newLieu = isVisio ? 'Visioconférence' : lieuVal.trim() || null;
    const { error: dbError } = await supabase
      .from('assemblees_generales')
      .update({
        date_ag: new Date(`${dateVal}T${heureVal}:${minuteVal}`).toISOString(),
        lieu: newLieu,
      })
      .eq('id', agId);
    if (dbError) { setError(dbError.message); setLoading(false); return; }
    setIsOpen(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
        title="Modifier la date et le lieu"
      >
        <Pencil size={13} /> Modifier date / lieu
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modifier la date et le lieu" size="sm">
        <div className="space-y-4">
          {/* Date & heure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date et heure <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input type="date" value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                required
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
              />
              <select value={heureVal} onChange={(e) => setHeureVal(e.target.value)}
                className="w-[5.5rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                  <option key={h} value={h}>{h}h</option>
                ))}
              </select>
              <select value={minuteVal} onChange={(e) => setMinuteVal(e.target.value)}
                className="w-[5.5rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['00','05','10','15','20','25','30','35','40','45','50','55'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={isVisio} onChange={(e) => setIsVisio(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <Video size={14} className="text-blue-500" />
                <span className="text-sm text-gray-700">Visioconférence</span>
              </label>
            </div>
            {!isVisio && (
              <input type="text" value={lieuVal} onChange={(e) => setLieuVal(e.target.value)}
                placeholder="Salle des fêtes, 12 rue de la Paix, Paris"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} loading={loading}>Enregistrer</Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ---- Suppression définitive (seulement en statut 'creation') ----
export function AGDelete({ agId }: { agId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await supabase.from('resolutions').delete().eq('ag_id', agId);
    await supabase.from('assemblees_generales').delete().eq('id', agId);
    router.push('/assemblees');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors"
        title="Supprimer cette AG"
      >
        <Trash2 size={13} />
        Supprimer l&apos;AG
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Supprimer l'assemblée générale" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Cette action est <strong>irréversible</strong>. Toutes les résolutions associées seront également supprimées.
            </p>
          </div>
          <p className="text-sm text-gray-600">Êtes-vous sûr de vouloir supprimer cette assemblée générale ?</p>
          <div className="flex gap-3 pt-1">
            <Button variant="danger" loading={loading} onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer définitivement
            </Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ---- Annulation (seulement en statut 'planifiee' — garde une trace) ----
export function AGAnnuler({ agId }: { agId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnnuler = async () => {
    setLoading(true);
    await supabase.from('assemblees_generales').update({ statut: 'annulee' }).eq('id', agId);
    router.refresh();
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors"
        title="Annuler cette AG"
      >
        <XCircle size={13} />
        Annuler l&apos;AG
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Annuler l'assemblée générale" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              L&apos;AG sera conservée avec le statut <strong>« Annulée »</strong> mais ne pourra plus être modifiée.
            </p>
          </div>
          <p className="text-sm text-gray-600">Confirmer l&apos;annulation de cette assemblée générale ?</p>
          <div className="flex gap-3 pt-1">
            <Button variant="danger" loading={loading} onClick={handleAnnuler}>
              <XCircle size={14} /> Annuler l&apos;AG
            </Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Retour</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ---- Envoi de la convocation par e-mail (statut 'planifiee') ----
export function AGEnvoyerConvocation({
  agId,
  coproprieteId,
  ag,
  resolutions,
  convocationEnvoyeeLe,
}: {
  agId: string;
  coproprieteId: string;
  ag: ConvocationAGData;
  resolutions: ConvocationResolution[];
  convocationEnvoyeeLe?: string | null;
}) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentDate, setSentDate] = useState<string | null>(convocationEnvoyeeLe ?? null);
  const [error, setError] = useState('');
  const [emailCount, setEmailCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || emailCount !== null) return;
    supabase
      .from('coproprietaires')
      .select('id', { count: 'exact', head: true })
      .eq('copropriete_id', coproprieteId)
      .not('email', 'is', null)
      .then(({ count }) => setEmailCount(count ?? 0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    }) + ' à ' + new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handleEnvoyer = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Générer le PDF de convocation
      const pdfDoc = genererConvocationDoc(ag, resolutions);
      const pdfBytes = pdfDoc.output('arraybuffer');
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      // 2. Trouver/créer Assemblées Générales / Convocations AG
      const { data: { user } } = await supabase.auth.getUser();
      const dossierId = user ? await getDossierConvocationsAG(supabase, user.id, ag.date_ag, ag.titre) : null;

      // 3. Uploader le PDF dans la section documents
      const annee = new Date(ag.date_ag).getFullYear();
      const uploadForm = new FormData();
      uploadForm.append('file', pdfBlob, `convocation-${agId}.pdf`);
      uploadForm.append('copropriete_id', coproprieteId);
      uploadForm.append('nom', `Convocation AG — ${ag.coproprietes?.nom ?? ''} — ${annee}`);
      uploadForm.append('type', 'convocation_ag');
      if (dossierId) uploadForm.append('dossier_id', dossierId);
      await fetch('/api/upload-document', { method: 'POST', body: uploadForm });

      // 4. Envoyer les e-mails de convocation
      const res = await fetch(`/api/ag/${agId}/envoyer-convocation`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? "Erreur lors de l'envoi.");
      } else {
        // 5. Enregistrer la date d'envoi en base
        const now = new Date().toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('assemblees_generales').update({ convocation_envoyee_le: now } as any).eq('id', agId);
        setSentDate(now);
        setIsOpen(false);
      }
    } catch (e) {
      setError('Erreur : ' + (e instanceof Error ? e.message : 'inconnue'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        {sentDate && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <CheckCircle size={13} /> Envoyée le {fmtDate(sentDate)}
          </span>
        )}
        <Button variant={sentDate ? 'secondary' : 'secondary'} size="sm" onClick={() => setIsOpen(true)}>
          <Mail size={14} /> {sentDate ? 'Renvoyer la convocation' : 'Envoyer la convocation'}
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Envoyer la convocation par e-mail" size="sm">
        <div className="space-y-4">
          {sentDate && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                La convocation a déjà été envoyée le <strong>{fmtDate(sentDate)}</strong>.
                Souhaitez-vous la renvoyer ?
              </p>
            </div>
          )}
          {emailCount !== null && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Mail size={18} className="text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700">
                {emailCount === 0
                  ? 'Aucun copropriétaire avec une adresse e-mail renseignée.'
                  : <>La convocation sera envoyée à <strong>{emailCount} copropriétaire{emailCount > 1 ? 's' : ''}</strong> ayant une adresse e-mail.</>}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600">
            La convocation inclut la date, le lieu et l&apos;ordre du jour complet.
            Un PDF sera également enregistré dans vos <strong>Documents</strong> (dossier Convocations AG).
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button loading={loading} onClick={handleEnvoyer} disabled={emailCount === 0}>
              <Send size={14} /> {sentDate ? 'Renvoyer' : 'Envoyer'}
            </Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ---- Envoi du PV par e-mail (statut 'terminee') ----
export function AGEnvoyerPV({ agId, coproprieteId, pvEnvoyeLe }: { agId: string; coproprieteId: string; pvEnvoyeLe?: string | null }) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentDate, setSentDate] = useState<string | null>(pvEnvoyeLe ?? null);
  const [error, setError] = useState('');
  const [emailCount, setEmailCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || emailCount !== null) return;
    supabase
      .from('coproprietaires')
      .select('id', { count: 'exact', head: true })
      .eq('copropriete_id', coproprieteId)
      .not('email', 'is', null)
      .then(({ count }) => setEmailCount(count ?? 0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    }) + ' à ' + new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handleEnvoyer = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ag/${agId}/envoyer-pv`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? "Erreur lors de l'envoi.");
      } else {
        const now = new Date().toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('assemblees_generales').update({ pv_envoye_le: now } as any).eq('id', agId);
        setSentDate(now);
        setIsOpen(false);
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        {sentDate && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <CheckCircle size={13} /> PV envoyé le {fmtDate(sentDate)}
          </span>
        )}
        <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
          <Mail size={14} /> {sentDate ? 'Renvoyer le PV' : 'Envoyer le PV par e-mail'}
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Envoyer le procès-verbal par e-mail" size="sm">
        <div className="space-y-4">
          {sentDate && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Le PV a déjà été envoyé le <strong>{fmtDate(sentDate)}</strong>.
                Souhaitez-vous le renvoyer ?
              </p>
            </div>
          )}
          {emailCount !== null && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Mail size={18} className="text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700">
                {emailCount === 0
                  ? 'Aucun copropriétaire avec une adresse e-mail renseignée.'
                  : <>Le PV sera envoyé à <strong>{emailCount} copropriétaire{emailCount > 1 ? 's' : ''}</strong> ayant une adresse e-mail.</>}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600">Le procès-verbal de l&apos;assemblée sera envoyé en pièce jointe.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button loading={loading} onClick={handleEnvoyer} disabled={emailCount === 0}>
              <Send size={14} /> {sentDate ? 'Renvoyer' : 'Envoyer'}
            </Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface AGStatusActionsProps {
  agId: string;
  coproprieteId: string;
  currentStatut: string;
  quorumAtteint: boolean;
  toutesResolutionsVotees: boolean;
}

export default function AGStatusActions({ agId, coproprieteId, currentStatut, quorumAtteint, toutesResolutionsVotees }: AGStatusActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleValiderPlanification = async () => {
    setLoading(true);
    setIsConfirmOpen(false);
    await supabase.from('assemblees_generales').update({ statut: 'planifiee' }).eq('id', agId);
    router.refresh();
    setLoading(false);
  };

  const handleCloturer = async () => {
    setLoading(true);
    setIsConfirmOpen(false);
    await supabase.from('assemblees_generales').update({ statut: 'terminee', quorum_atteint: quorumAtteint }).eq('id', agId);
    router.refresh();
    setLoading(false);
  };

  if (currentStatut === 'creation') {
    return (
      <>
        <Button variant="primary" size="sm" loading={loading} onClick={() => setIsConfirmOpen(true)}>
          <CalendarCheck size={14} /> Valider la planification
        </Button>
        <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Valider la planification" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              L&apos;AG passera au statut <strong>« Planifiée »</strong>. Vous pourrez ensuite envoyer les convocations par e-mail.
            </p>
            <div className="flex gap-3 pt-1">
              <Button variant="primary" loading={loading} onClick={handleValiderPlanification}>
                <CalendarCheck size={14} /> Confirmer la planification
              </Button>
              <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Annuler</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  if (currentStatut === 'planifiee') {
    return (
      <LancerAGModal agId={agId} coproprieteId={coproprieteId} mode="launch" />
    );
  }

  if (currentStatut === 'en_cours') {
    return (
      <>
        <Button variant="success" size="sm" loading={loading} onClick={() => setIsConfirmOpen(true)} disabled={!toutesResolutionsVotees} title={!toutesResolutionsVotees ? 'Toutes les résolutions doivent être votées avant de clôturer' : undefined}>
          <CheckCircle size={14} /> Clôturer l&apos;AG
        </Button>
        <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Clôturer l'assemblée générale" size="sm">
          <div className="space-y-4">
            {!toutesResolutionsVotees && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  Certaines résolutions sont encore <strong>en attente de vote</strong>. Veuillez les traiter avant de clôturer l&apos;assemblée.
                </p>
              </div>
            )}
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${quorumAtteint ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
              {quorumAtteint
                ? <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                : <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />}
              <p className={`text-sm ${quorumAtteint ? 'text-green-700' : 'text-amber-700'}`}>
                {quorumAtteint
                  ? 'Le quorum est atteint. L\'AG peut être clôturée normalement.'
                  : 'Attention : le quorum n\'est pas atteint. La clôture sera quand même enregistrée.'}
              </p>
            </div>
            <p className="text-sm text-gray-600">Confirmer la clôture de l&apos;assemblée ? Cette action est irréversible.</p>
            <div className="flex gap-3 pt-1">
              <Button variant="success" loading={loading} onClick={handleCloturer} disabled={!toutesResolutionsVotees}>
                <CheckCircle size={14} /> Clôturer définitivement
              </Button>
              <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Annuler</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return null;
}
