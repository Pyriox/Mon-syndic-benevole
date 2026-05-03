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
import { logCurrentUserEvent } from '@/lib/actions/log-user-event';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  formatDate,
  formatDateTime,
  getParisDateInputValue,
  getParisTimeInputValue,
  getParisYear,
  toParisISOString,
} from '@/lib/utils';
import { buildConvocationPdfDisplayName, buildConvocationPdfFileName } from '@/lib/pdf-filenames';
import { CheckCircle, Trash2, XCircle, Send, CalendarCheck, Pencil, Video, AlertTriangle, Mail, Eye } from 'lucide-react';
import LancerAGModal from './LancerAGModal';
import { genererConvocationDoc, type ConvocationAGData, type ConvocationResolution } from './ConvocationPDF';

type EmailSendSummary = {
  level: 'success' | 'warning' | 'error';
  message: string;
  details: string[];
};

type AgEmailStatut = 'ouvert' | 'envoyé' | 'erreur';
type AgRecipient = { id: string; nom: string; prenom: string; email: string };

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
  const year = String(getParisYear(dateAg) ?? new Date().getFullYear());
  const rootId = await getOrCreateSubDossier(supabase, 'Assemblées Générales', null, syndicId);
  if (!rootId) return null;
  const yearId = await getOrCreateSubDossier(supabase, year, rootId, syndicId);
  if (!yearId) return null;
  const dateFr = formatDate(dateAg, { day: 'numeric', month: 'long', year: 'numeric' });
  const agFolderName = `${titreAg} — ${dateFr}`;
  return getOrCreateSubDossier(supabase, agFolderName, yearId, syndicId);
}

// ---- Modification de la date/heure et du lieu ----
export function AGEditInfos({ agId, dateAg, lieu, coproprieteId }: { agId: string; dateAg: string; lieu: string | null; coproprieteId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initialTime = getParisTimeInputValue(dateAg);
  const [dateVal,   setDateVal]   = useState(getParisDateInputValue(dateAg));
  const [heureVal,  setHeureVal]  = useState(initialTime.hour);
  const [minuteVal, setMinuteVal] = useState(initialTime.minute);
  const [isVisio,   setIsVisio]   = useState(lieu === 'Visioconférence');
  const [lieuVal,   setLieuVal]   = useState(lieu === 'Visioconférence' ? '' : (lieu ?? ''));

  const handleSave = async () => {
    if (!dateVal) { setError('La date est requise.'); return; }
    setLoading(true);
    setError('');
    const newLieu = isVisio ? 'Visioconférence' : lieuVal.trim() || null;
    const { data, error: dbError } = await supabase
      .from('assemblees_generales')
      .update({
        date_ag: toParisISOString(dateVal, heureVal, minuteVal),
        lieu: newLieu,
      })
      .eq('id', agId)
      .in('statut', ['creation', 'planifiee'])
      .is('convocation_envoyee_le', null)
      .select('id');
    if (dbError) { setError(dbError.message); setLoading(false); return; }
    if (!data || data.length === 0) {
      setError('Cette AG est déjà lancée. La modification est bloquée.');
      setLoading(false);
      return;
    }
    logCurrentUserEvent({ eventType: 'ag_updated', label: `AG modifiée — date/lieu`, coproprieteId, metadata: { agId } }).catch(() => undefined);
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
              <input
                type="date"
                value={dateVal}
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
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    const { data: ag, error: agError } = await supabase
      .from('assemblees_generales')
      .select('id')
      .eq('id', agId)
      .eq('statut', 'creation')
      .is('convocation_envoyee_le', null)
      .maybeSingle();

    if (agError || !ag) {
      setError('Cette AG ne peut plus être supprimée. Utilisez l\'annulation tracée.');
      setLoading(false);
      return;
    }

    await supabase.from('resolutions').delete().eq('ag_id', agId);
    await supabase.from('assemblees_generales').delete().eq('id', agId).eq('statut', 'creation');
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
          {error && <p className="text-sm text-red-600">{error}</p>}
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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnnuler = async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/ag/${agId}/annuler`, { method: 'POST' });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.message ?? 'Impossible d\'annuler cette AG.');
      setLoading(false);
      return;
    }
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
          {error && <p className="text-sm text-red-600">{error}</p>}
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
  emailStatusByEmail,
  recipients,
}: {
  agId: string;
  coproprieteId: string;
  ag: ConvocationAGData;
  resolutions: ConvocationResolution[];
  convocationEnvoyeeLe?: string | null;
  emailStatusByEmail?: Record<string, AgEmailStatut> | null;
  recipients?: AgRecipient[];
}) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentDate, setSentDate] = useState<string | null>(convocationEnvoyeeLe ?? null);
  const [error, setError] = useState('');
  const [emailCount, setEmailCount] = useState<number | null>(null);
  const [sendSummary, setSendSummary] = useState<EmailSendSummary | null>(null);
  const [localEmailStatus, setLocalEmailStatus] = useState<Record<string, AgEmailStatut> | null>(emailStatusByEmail ?? null);

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

  const fmtDate = (iso: string) => formatDateTime(iso);

  const handleEnvoyer = async () => {
    setLoading(true);
    setError('');
    setSendSummary(null);
    try {
      // 1. Générer le PDF de convocation
      const pdfDoc = genererConvocationDoc(ag, resolutions);
      const pdfBytes = pdfDoc.output('arraybuffer');
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      // 2. Trouver/créer Assemblées Générales / Convocations AG
      const { data: { user } } = await supabase.auth.getUser();
      const dossierId = user ? await getDossierConvocationsAG(supabase, user.id, ag.date_ag, ag.titre) : null;

      // 3. Uploader le PDF dans la section documents
      const fileName = buildConvocationPdfFileName({
        coproprieteNom: ag.coproprietes?.nom,
        titreAg: ag.titre,
        dateAg: ag.date_ag,
      });
      const documentName = buildConvocationPdfDisplayName({
        coproprieteNom: ag.coproprietes?.nom,
        titreAg: ag.titre,
        dateAg: ag.date_ag,
      });
      const uploadForm = new FormData();
      uploadForm.append('file', pdfBlob, fileName);
      uploadForm.append('copropriete_id', coproprieteId);
      uploadForm.append('nom', documentName);
      uploadForm.append('type', 'convocation_ag');
      if (dossierId) uploadForm.append('dossier_id', dossierId);
      await fetch('/api/upload-document', { method: 'POST', body: uploadForm });

      // 4. Envoyer les e-mails de convocation
      const res = await fetch(`/api/ag/${agId}/envoyer-convocation`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      const sent = Number(json.sent ?? 0);
      const failed = Number(json.failed ?? 0);
      const details = Array.isArray(json.errors) ? json.errors.filter((item: unknown): item is string => typeof item === 'string') : [];

      if (!res.ok) {
        const message = json.message ?? "Erreur lors de l'envoi.";
        setError(message);
        setSendSummary({ level: 'error', message, details });
      } else {
        if (sent > 0) {
          const now = new Date().toISOString();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await supabase.from('assemblees_generales').update({ convocation_envoyee_le: now } as any).eq('id', agId);
          setSentDate(now);
          // Optimistic status — preserve 'ouvert', set others to 'envoyé'
          const optimistic: Record<string, AgEmailStatut> = { ...localEmailStatus };
          for (const r of recipients ?? []) {
            const em = r.email.toLowerCase();
            if (optimistic[em] !== 'ouvert') optimistic[em] = 'envoyé';
          }
          setLocalEmailStatus(optimistic);
        }

        setSendSummary({
          level: failed > 0 ? 'warning' : 'success',
          message: json.message ?? `${sent} convocation(s) envoyée(s).`,
          details,
        });

        if (failed === 0) {
          setIsOpen(false);
        }
      }
    } catch (e) {
      const message = 'Erreur : ' + (e instanceof Error ? e.message : 'inconnue');
      setError(message);
      setSendSummary({ level: 'error', message, details: [] });
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
        {sendSummary && (
          <span className={`max-w-xs text-right text-xs font-medium ${
            sendSummary.level === 'success'
              ? 'text-green-600'
              : sendSummary.level === 'warning'
                ? 'text-amber-700'
                : 'text-red-600'
          }`}>
            {sendSummary.message}
          </span>
        )}
        <Button variant={sentDate ? 'secondary' : 'primary'} size="sm" onClick={() => setIsOpen(true)}>
          <Mail size={14} /> {sentDate ? 'Renvoyer la convocation' : 'Envoyer la convocation'}
        </Button>
      </div>
      {sentDate && recipients && recipients.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden w-full">
          <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-200">Suivi des e-mails — convocation</div>
          <ul className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
            {recipients.map((r) => {
              const statut = localEmailStatus?.[r.email.toLowerCase()];
              return (
                <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span className="text-xs text-gray-700 min-w-0 truncate">{r.prenom} {r.nom}</span>
                  {statut === 'ouvert' && <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700"><Eye size={9} />Ouvert</span>}
                  {statut === 'erreur' && <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700"><XCircle size={9} />Échec</span>}
                  {statut === 'envoyé' && <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600"><CheckCircle size={9} />Envoyé</span>}
                  {!statut && <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-gray-200 text-gray-400">Non envoyé</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
            L&apos;e-mail sert de notification et renvoie le copropriétaire vers son espace.
            Le PDF est enregistré dans vos <strong>Documents</strong> (dossier Convocations AG).
          </p>
          {sendSummary && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${
              sendSummary.level === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : sendSummary.level === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              <p>{sendSummary.message}</p>
              {sendSummary.details.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {sendSummary.details.slice(0, 3).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {sentDate && recipients && recipients.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-200">
                Statut par destinataire
              </div>
              <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {recipients.map((r) => {
                  const statut = localEmailStatus?.[r.email.toLowerCase()];
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                      <span className="text-xs text-gray-700 min-w-0 truncate">{r.prenom} {r.nom}</span>
                      {statut === 'ouvert' && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700"><Eye size={9} />Ouvert</span>
                      )}
                      {statut === 'erreur' && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700"><XCircle size={9} />Échec</span>
                      )}
                      {statut === 'envoyé' && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600"><CheckCircle size={9} />Envoyé</span>
                      )}
                      {!statut && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-gray-200 text-gray-400">Non envoyé</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
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
export function AGEnvoyerPV({ agId, coproprieteId, pvEnvoyeLe, emailStatusByEmail, recipients }: {
  agId: string;
  coproprieteId: string;
  pvEnvoyeLe?: string | null;
  emailStatusByEmail?: Record<string, AgEmailStatut> | null;
  recipients?: AgRecipient[];
}) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentDate, setSentDate] = useState<string | null>(pvEnvoyeLe ?? null);
  const [error, setError] = useState('');
  const [emailCount, setEmailCount] = useState<number | null>(null);
  const [sendSummary, setSendSummary] = useState<EmailSendSummary | null>(null);
  const [localEmailStatus, setLocalEmailStatus] = useState<Record<string, AgEmailStatut> | null>(emailStatusByEmail ?? null);

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

  const fmtDate = (iso: string) => formatDateTime(iso);

  const handleEnvoyer = async () => {
    setLoading(true);
    setError('');
    setSendSummary(null);
    try {
      const res = await fetch(`/api/ag/${agId}/envoyer-pv`, { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      const sent = Number(json.sent ?? 0);
      const failed = Number(json.failed ?? 0);
      const details = Array.isArray(json.errors) ? json.errors.filter((item: unknown): item is string => typeof item === 'string') : [];

      if (!res.ok) {
        const message = json.message ?? "Erreur lors de l'envoi.";
        setError(message);
        setSendSummary({ level: 'error', message, details });
      } else {
        if (sent > 0) {
          const now = new Date().toISOString();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await supabase.from('assemblees_generales').update({ pv_envoye_le: now } as any).eq('id', agId);
          setSentDate(now);
          // Optimistic status — preserve 'ouvert', set others to 'envoyé'
          const optimistic: Record<string, AgEmailStatut> = { ...localEmailStatus };
          for (const r of recipients ?? []) {
            const em = r.email.toLowerCase();
            if (optimistic[em] !== 'ouvert') optimistic[em] = 'envoyé';
          }
          setLocalEmailStatus(optimistic);
        }

        setSendSummary({
          level: failed > 0 ? 'warning' : 'success',
          message: json.message ?? `${sent} PV envoyé(s).`,
          details,
        });

        if (failed === 0) {
          setIsOpen(false);
        }
      }
    } catch {
      const message = 'Erreur réseau.';
      setError(message);
      setSendSummary({ level: 'error', message, details: [] });
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
        {sendSummary && (
          <span className={`max-w-xs text-right text-xs font-medium ${
            sendSummary.level === 'success'
              ? 'text-green-600'
              : sendSummary.level === 'warning'
                ? 'text-amber-700'
                : 'text-red-600'
          }`}>
            {sendSummary.message}
          </span>
        )}
        <Button variant={sentDate ? 'secondary' : 'primary'} size="sm" onClick={() => setIsOpen(true)}>
          <Mail size={14} /> {sentDate ? 'Renvoyer le PV' : 'Envoyer le PV par e-mail'}
        </Button>
      </div>
      {sentDate && recipients && recipients.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden w-full">
          <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-200">Suivi des e-mails — PV</div>
          <ul className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
            {recipients.map((r) => {
              const statut = localEmailStatus?.[r.email.toLowerCase()];
              return (
                <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span className="text-xs text-gray-700 min-w-0 truncate">{r.prenom} {r.nom}</span>
                  {statut === 'ouvert' && <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700"><Eye size={9} />Ouvert</span>}
                  {statut === 'erreur' && <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700"><XCircle size={9} />Échec</span>}
                  {statut === 'envoyé' && <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600"><CheckCircle size={9} />Envoyé</span>}
                  {!statut && <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-gray-200 text-gray-400">Non envoyé</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
          <p className="text-sm text-gray-600">L&apos;e-mail sert de notification. Le copropriétaire consultera ensuite le PV dans son espace Documents.</p>
          {sendSummary && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${
              sendSummary.level === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : sendSummary.level === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              <p>{sendSummary.message}</p>
              {sendSummary.details.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs">
                  {sendSummary.details.slice(0, 3).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {sentDate && recipients && recipients.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-200">
                Statut par destinataire
              </div>
              <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {recipients.map((r) => {
                  const statut = localEmailStatus?.[r.email.toLowerCase()];
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                      <span className="text-xs text-gray-700 min-w-0 truncate">{r.prenom} {r.nom}</span>
                      {statut === 'ouvert' && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700"><Eye size={9} />Ouvert</span>
                      )}
                      {statut === 'erreur' && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700"><XCircle size={9} />Échec</span>
                      )}
                      {statut === 'envoyé' && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600"><CheckCircle size={9} />Envoyé</span>
                      )}
                      {!statut && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-gray-200 text-gray-400">Non envoyé</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
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
  convocationEnvoyeeLe?: string | null;
}

export default function AGStatusActions({
  agId,
  coproprieteId,
  currentStatut,
  quorumAtteint,
  toutesResolutionsVotees,
  convocationEnvoyeeLe,
}: AGStatusActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmeNoQuorum, setConfirmeNoQuorum] = useState(false);

  const handleValiderPlanification = async () => {
    setLoading(true);
    setIsConfirmOpen(false);
    await supabase.from('assemblees_generales').update({ statut: 'planifiee' }).eq('id', agId);
    void logCurrentUserEvent({
      eventType: 'ag_status_changed',
      label: 'Statut AG modifié : creation → planifiee',
      coproprieteId: coproprieteId,
      metadata: { agId, coproId: coproprieteId, oldStatus: 'creation', newStatus: 'planifiee' },
    }).catch(() => undefined);
    router.refresh();
    setLoading(false);
  };

  const handleCloturer = async () => {
    setLoading(true);
    setIsConfirmOpen(false);
    await fetch(`/api/ag/${agId}/terminer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quorumAtteint }),
    });
    router.refresh();
    setLoading(false);
  };

  if (currentStatut === 'creation') {
    return (
      <>
        <Button variant="primary" size="sm" loading={loading} onClick={() => setIsConfirmOpen(true)}>
          <CalendarCheck size={14} /> Finaliser et planifier l&apos;AG
        </Button>
        <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Finaliser et planifier l'AG" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Le brouillon passera au statut <strong>« Planifiée »</strong>. Vous pourrez ensuite envoyer les convocations par e-mail et préparer le jour J.
            </p>
            <div className="flex gap-3 pt-1">
              <Button variant="primary" loading={loading} onClick={handleValiderPlanification}>
                <CalendarCheck size={14} /> Confirmer et planifier
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
      <LancerAGModal
        agId={agId}
        coproprieteId={coproprieteId}
        mode="launch"
        convocationEnvoyeeLe={convocationEnvoyeeLe ?? null}
      />
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
                  ? "Le quorum est atteint. L'AG peut être clôturée normalement."
                  : "Attention : le quorum n'est pas atteint. La clôture sera quand même enregistrée."}
              </p>
            </div>
            {!quorumAtteint && (
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmeNoQuorum}
                  onChange={e => setConfirmeNoQuorum(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">
                  Je confirme avoir pris connaissance du défaut de quorum et souhaite quand même clôturer
                  (2e convocation ou décision consciente).
                </span>
              </label>
            )}
            <p className="text-sm text-gray-600">Confirmer la clôture de l&apos;assemblée ? Cette action est irréversible.</p>
            <div className="flex gap-3 pt-1">
              <Button variant="success" loading={loading} onClick={handleCloturer} disabled={!toutesResolutionsVotees || (!quorumAtteint && !confirmeNoQuorum)}>
                <CheckCircle size={14} /> Clôturer définitivement
              </Button>
              <Button variant="secondary" onClick={() => { setIsConfirmOpen(false); setConfirmeNoQuorum(false); }}>Annuler</Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return null;
}
