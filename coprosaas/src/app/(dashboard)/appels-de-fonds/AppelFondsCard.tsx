'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, AlertTriangle, Link2, Mail, Loader2, CalendarCheck2, RefreshCw, Send, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import {
  formatEuros,
  formatDate,
  formatRepartitionScope,
  LABELS_CATEGORIE,
  parseBudgetPostesFromDescription,
  repartitionParPostes,
} from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { revalidateCoproFinance } from '@/lib/actions/revalidate-copro-finance';
import AppelFondsPDF, { buildAvisPersonnelPDF, type AvisPersonnelInput } from './AppelFondsPDF';
import AppelFondsPaiement, { type Ligne } from './AppelFondsPaiement';

interface Poste {
  libelle: string;
  categorie: string;
  montant: number;
  repartition_type?: 'generale' | 'groupe' | null;
  repartition_cible?: string | null;
}

const LABELS_TYPE_APPEL: Record<string, string> = {
  budget_previsionnel: 'Budget prévisionnel',
  revision_budget: 'Révision budgétaire',
  fonds_travaux: 'Fonds de travaux',
  exceptionnel: 'Appel exceptionnel',
};

interface AppelCardProps {
  appel: {
    id: string;
    titre: string;
    montant_total: number;
    date_echeance: string;
    description?: string | null;
    copropriete_id?: string;
    type_appel?: string | null;
    ag_resolution_id?: string | null;
    emailed_at?: string | null;
    statut?: string | null;
    coproprietes?: { nom: string } | null;
    montant_fonds_travaux?: number | null;
  };
  lignes: Ligne[];
  postes: Poste[] | null;
  isSyndic: boolean;
  canWrite?: boolean;
  nbPayes: number;
  nbImpayes: number;
  pctPaye: number;
}

export default function AppelFondsCard({ appel, lignes, postes, isSyndic, canWrite = true, nbPayes, nbImpayes, pctPaye }: AppelCardProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [sendOk, setSendOk] = useState<boolean | null>(null);
  const [statut, setStatut] = useState(appel.statut ?? null);
  const [emailedAt, setEmailedAt] = useState<string | null>(appel.emailed_at ?? null);
  const [lignesCount, setLignesCount] = useState(lignes.length);
  const [localLignes, setLocalLignes] = useState<Ligne[]>(lignes);
  const [regenerating, setRegenerating] = useState(false);
  const [regenMsg, setRegenMsg] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  const [publishOk, setPublishOk] = useState<boolean | null>(null);
  const [showPublishEmailPrompt, setShowPublishEmailPrompt] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const autoRegenRef = useRef(false);
  const router = useRouter();
  const supabase = createClient();
  const currentStatut = statut ?? appel.statut;

  useEffect(() => {
    setStatut(appel.statut ?? null);
    setEmailedAt(appel.emailed_at ?? null);
    setLignesCount(lignes.length);
    setLocalLignes(lignes);
  }, [appel.emailed_at, appel.statut, lignes]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const echeance = new Date(appel.date_echeance);
  echeance.setHours(0, 0, 0, 0);
  const echeancePlusGrace = new Date(echeance);
  echeancePlusGrace.setDate(echeancePlusGrace.getDate() + 15);
  const displayedNbPayes = localLignes.filter((ligne) => ligne.paye).length;
  const displayedNbImpayes = today > echeancePlusGrace ? localLignes.filter((ligne) => !ligne.paye).length : 0;
  const displayedPctPaye = localLignes.length > 0 ? Math.round((displayedNbPayes / localLignes.length) * 100) : 0;

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteMsg('');
    try {
      const res = await fetch(`/api/appels-de-fonds/${appel.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        await revalidateCoproFinance(appel.copropriete_id);
        router.refresh();
      } else {
        setDeleteMsg(json.message ?? 'Erreur lors de la suppression.');
        setShowDeleteConfirm(false);
      }
    } catch {
      setDeleteMsg('Erreur réseau.');
      setShowDeleteConfirm(false);
    }
    setDeleting(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMsg('');
    setPublishOk(null);
    setShowPublishEmailPrompt(false);
    try {
      const res = await fetch(`/api/appels-de-fonds/${appel.id}/publier`, { method: 'POST' });
      const json = await res.json() as { message?: string; sent?: number; promptEmailSend?: boolean };
      setPublishMsg(json.message ?? (res.ok ? 'Émis avec succès' : 'Erreur'));
      setPublishOk(res.ok);
      if (res.ok) {
        setStatut('publie');
        if ((json.sent ?? 0) > 0) {
          setEmailedAt(new Date().toISOString());
        }
        const { data: freshLignes } = await supabase
          .from('lignes_appels_de_fonds')
          .select('id, montant_du, regularisation_ajustement, paye, date_paiement, coproprietaires(id, nom, prenom)')
          .eq('appel_de_fonds_id', appel.id);
        const mappedLignes: Ligne[] = (freshLignes ?? []).map((l) => {
          const c = Array.isArray(l.coproprietaires) ? l.coproprietaires[0] ?? null : l.coproprietaires;
          return { ...l, coproprietaires: c as Ligne['coproprietaires'] };
        });
        setLocalLignes(mappedLignes);
        setLignesCount(mappedLignes.length);
        const saveResult = await saveToDocuments(mappedLignes);
        if (!saveResult.ok) {
          setPublishMsg((prev) => `${prev} (publication OK, archivage impossible: ${saveResult.error})`);
        }
        await revalidateCoproFinance(appel.copropriete_id);
        if (json.promptEmailSend) {
          setShowPublishEmailPrompt(true);
        }
      }
    } catch {
      setPublishMsg('Erreur réseau.');
      setPublishOk(false);
    }
    setPublishing(false);
  };

  // Auto-generate répartition when accordion opens with no lines (publié only)
  useEffect(() => {
    if (open && lignesCount === 0 && isSyndic && !autoRegenRef.current && !regenerating && currentStatut !== 'brouillon') {
      autoRegenRef.current = true;
      handleRegenerate();
    }
  }, [currentStatut, lignesCount, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenMsg('');
    try {
      if (!appel.copropriete_id) { setRegenMsg('Copropriété introuvable.'); return; }
      const { data: lots } = await supabase
        .from('lots')
        .select('id, tantiemes, coproprietaire_id, batiment, groupes_repartition, tantiemes_groupes')
        .eq('copropriete_id', appel.copropriete_id);

      const lotsWithCopro = (lots ?? []).filter((l) => l.coproprietaire_id != null);

      if (lotsWithCopro.length === 0) {
        setRegenMsg('Aucun lot avec copropriétaire assigné trouvé. Assignez d’abord des copropriétaires aux lots.');
        return;
      }
      const postes = parseBudgetPostesFromDescription(appel.description);
      if (
        (appel.montant_fonds_travaux ?? 0) > 0
        && !postes.some((poste) => poste.categorie === 'fonds_travaux_alur' || /fonds\s+de\s+travaux/i.test(poste.libelle))
      ) {
        postes.push({
          libelle: 'Fonds de travaux (ALUR)',
          categorie: 'fonds_travaux_alur',
          montant: appel.montant_fonds_travaux ?? 0,
          repartition_type: 'generale',
          repartition_cible: null,
        });
      }

      const grouped = repartitionParPostes(appel.montant_total, lotsWithCopro, postes);

      const { error } = await supabase.from('lignes_appels_de_fonds').insert(
        grouped.map((g) => ({
          appel_de_fonds_id: appel.id,
          coproprietaire_id: g.copId,
          lot_id: g.lotId,
          montant_du: g.montant,
          regularisation_ajustement: 0,
          paye: false,
          date_paiement: null,
        }))
      );
      if (error) { setRegenMsg('Erreur : ' + error.message); return; }
      // Débit du solde (une entry par copropriétaire)
      for (const g of grouped) {
        const { data: cop } = await supabase.from('coproprietaires').select('solde').eq('id', g.copId).single();
        await supabase.from('coproprietaires').update({
          solde: Math.round(((cop?.solde ?? 0) - g.montant) * 100) / 100,
        }).eq('id', g.copId);
      }

      const { data: freshLignes } = await supabase
        .from('lignes_appels_de_fonds')
        .select('id, montant_du, regularisation_ajustement, paye, date_paiement, coproprietaires(id, nom, prenom)')
        .eq('appel_de_fonds_id', appel.id);
      const mappedLignes: Ligne[] = (freshLignes ?? []).map((ligne) => {
        const copro = Array.isArray(ligne.coproprietaires) ? ligne.coproprietaires[0] ?? null : ligne.coproprietaires;
        return { ...ligne, coproprietaires: copro as Ligne['coproprietaires'] };
      });
      setLocalLignes(mappedLignes);
      setLignesCount(mappedLignes.length);
      setRegenMsg('Répartition recalculée.');
    } finally {
      setRegenerating(false);
    }
  };

  const saveToDocuments = async (freshLignes?: Ligne[]): Promise<{ ok: boolean; error?: string }> => {
    try {
      const effectiveLignes = freshLignes ?? localLignes;
      if (!appel.copropriete_id) return { ok: false, error: 'Copropriété introuvable pour archiver les avis.' };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { ok: false, error: 'Session expirée. Reconnectez-vous pour archiver les avis.' };

      // Trouver ou créer le dossier racine "Appels de fonds"
      let { data: dossier } = await supabase
        .from('document_dossiers')
        .select('id')
        .eq('nom', 'Appels de fonds')
        .eq('syndic_id', user.id)
        .is('parent_id', null)
        .maybeSingle();

      if (!dossier) {
        const { data: created } = await supabase
          .from('document_dossiers')
          .insert({ nom: 'Appels de fonds', is_default: true, syndic_id: user.id, parent_id: null } as never)
          .select('id')
          .single();
        dossier = created;
      }

      // Trouver ou créer le sous-dossier de l'année (ex: "2026")
      const annee = appel.date_echeance
        ? String(new Date(appel.date_echeance).getFullYear())
        : String(new Date().getFullYear());

      let targetDossierId: string | null = dossier?.id ?? null;
      if (dossier?.id) {
        let { data: yearDossier } = await supabase
          .from('document_dossiers')
          .select('id')
          .eq('nom', annee)
          .eq('syndic_id', user.id)
          .eq('parent_id', dossier.id)
          .maybeSingle();

        if (!yearDossier) {
          const { data: created } = await supabase
            .from('document_dossiers')
            .insert({ nom: annee, is_default: false, syndic_id: user.id, parent_id: dossier.id } as never)
            .select('id')
            .single();
          yearDossier = created;
        }
        targetDossierId = yearDossier?.id ?? dossier.id;
      }

      const appelForPDF: AvisPersonnelInput = {
        titre: appel.titre,
        montant_total: appel.montant_total,
        date_echeance: appel.date_echeance,
        coproprietes: appel.coproprietes,
        description: appel.description,
        montant_fonds_travaux: appel.montant_fonds_travaux,
      };

      // Générer et archiver un avis individuel pour chaque copropriétaire
      for (const ligne of effectiveLignes) {
        if (!ligne.coproprietaires?.id) continue;

        const pdfDoc = buildAvisPersonnelPDF(appelForPDF, ligne);
        const pdfBlob = pdfDoc.output('blob');
        const safeName = `${ligne.coproprietaires.prenom}-${ligne.coproprietaires.nom}`
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        const file = new File([pdfBlob], `avis-${safeName}.pdf`, { type: 'application/pdf' });
        const form = new FormData();
        form.append('file', file);
        form.append('nom', `Avis — ${ligne.coproprietaires.prenom} ${ligne.coproprietaires.nom} — ${appel.titre}`);
        form.append('type', 'autre');
        form.append('copropriete_id', appel.copropriete_id);
        if (targetDossierId) form.append('dossier_id', targetDossierId);
        form.append('coproprietaire_id', ligne.coproprietaires.id);

        const uploadRes = await fetch('/api/upload-document', { method: 'POST', body: form });
        if (!uploadRes.ok) {
          const payload = await uploadRes.json().catch(() => ({})) as { error?: string };
          return { ok: false, error: payload.error ?? 'Échec de l\'archivage dans Documents.' };
        }
      }

      return { ok: true };
    } catch {
      return { ok: false, error: 'Erreur technique lors de l’archivage dans Documents.' };
    }
  };

  const handleSendEmails = async () => {
    setShowEmailConfirm(false);
    setShowPublishEmailPrompt(false);
    setSending(true);
    setSendMsg('');
    setSendOk(null);
    try {
      const res = await fetch(`/api/appels-de-fonds/${appel.id}/envoyer`, { method: 'POST' });
      const json = await res.json();
      setSendMsg(json.message ?? 'Envoyé');
      setSendOk(res.ok);
      if (res.ok) {
        setEmailedAt(new Date().toISOString());
        const saveResult = await saveToDocuments();
        if (!saveResult.ok) {
          setSendMsg((prev) => `${prev} (envoi OK, archivage impossible: ${saveResult.error})`);
        }
      }
    } catch {
      setSendMsg("Erreur réseau lors de l'envoi.");
      setSendOk(false);
    }
    setSending(false);
  };

  const typeAppel = appel.type_appel;
  const barColor = displayedPctPaye === 100 ? 'bg-green-500' : displayedNbImpayes > 0 ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* ── En-tête compact ─────────────────────────────────── */}
      <div className="px-5 py-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3">
          {/* Infos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-gray-900 truncate">{appel.titre}</span>

              {typeAppel && (
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  typeAppel === 'exceptionnel' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {typeAppel === 'exceptionnel' ? <AlertTriangle size={9} /> : <Link2 size={9} />}
                  {LABELS_TYPE_APPEL[typeAppel] ?? typeAppel}
                </span>
              )}

              {displayedNbImpayes > 0 && (
                <Badge variant="danger">{displayedNbImpayes} impayé{displayedNbImpayes > 1 ? 's' : ''}</Badge>
              )}
            </div>

            {/* Montant + échéance sur une ligne */}
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="font-bold text-gray-900">{formatEuros(appel.montant_total)}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">Échéance <span className="text-gray-700 font-medium">{formatDate(appel.date_echeance)}</span></span>
              {localLignes.length > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500">{displayedNbPayes}/{localLignes.length} payé{displayedNbPayes > 1 ? 's' : ''}</span>
                </>
              )}
            </div>

            {/* Barre de progression */}
            {localLignes.length > 0 && (
              <div className="mt-2.5 w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(displayedPctPaye, displayedPctPaye > 0 ? 2 : 0)}%` }} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-wrap sm:shrink-0 sm:flex-nowrap">
            {isSyndic && canWrite && (
              currentStatut === 'brouillon' ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  title="Générer la répartition et envoyer les avis aux copropriétaires"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>{publishing ? 'Émission…' : 'Émettre'}</span>
                </button>
              ) : displayedPctPaye < 100 ? (
                <button
                  type="button"
                  onClick={() => setShowEmailConfirm(true)}
                  disabled={sending}
                  title={emailedAt ? `Renvoyer (envoyé le ${new Date(emailedAt).toLocaleDateString('fr-FR')})` : 'Envoyer les avis par e-mail'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    emailedAt
                      ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  {sending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                  <span>{sending ? 'Envoi…' : emailedAt ? 'Renvoyer' : 'Envoyer'}</span>
                </button>
              ) : null
            )}
            <AppelFondsPDF appel={appel} />
            {isSyndic && canWrite && (
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(true); setDeleteMsg(''); }}
                title="Supprimer cet appel de fonds"
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {open ? 'Réduire' : 'Détail'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirmation suppression ──────────────────────── */}
      {showDeleteConfirm && (
        <div className="mx-5 mb-3 flex flex-wrap items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <Trash2 size={15} className="shrink-0 text-red-500" />
            <span>
              {currentStatut === 'publie'
                ? <>Supprimer « <strong>{appel.titre}</strong> » ? Les soldes des copropriétaires non payés seront rétablis.</>
                : currentStatut === 'confirme'
                  ? <>Supprimer « <strong>{appel.titre}</strong> » ? Les soldes des copropriétaires marqués payés seront ajustés.</>
                  : <>Supprimer l&apos;appel en préparation « <strong>{appel.titre}</strong> » ? Cette action est irréversible.</>
              }
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 size={11} className="animate-spin inline" /> : 'Supprimer'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Erreur suppression ───────────────────────────────── */}
      {deleteMsg && (
        <div className="mx-5 mb-3 text-xs rounded-lg px-3 py-2 border bg-red-50 text-red-700 border-red-200">
          {deleteMsg}
        </div>
      )}

      {/* ── Feedback publication ─────────────────────────────── */}
      {publishMsg && (
        <div className={`mx-5 mb-3 text-xs rounded-lg px-3 py-2 border ${
          publishOk ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {publishMsg}
        </div>
      )}

      {showPublishEmailPrompt && !sending && (
        <div className="mx-5 mb-3 flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-900">
            <CalendarCheck2 size={15} className="shrink-0 text-amber-600" />
            <span>
              L&apos;échéance est à 30 jours. Envoyer maintenant l&apos;avis à{' '}
              <strong>{lignesCount} copropriétaire{lignesCount > 1 ? 's' : ''}</strong> ?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSendEmails}
              className="text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Envoyer maintenant
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPublishEmailPrompt(false);
              }}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmation envoi email ─────────────────────────── */}
      {showEmailConfirm && !sending && (
        <div className="mx-5 mb-3 flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Mail size={15} className="shrink-0 text-blue-600" />
            <span>
              Envoyer les avis de paiement à{' '}
              <strong>{lignesCount} copropriétaire{lignesCount > 1 ? 's' : ''}</strong> ?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSendEmails}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setShowEmailConfirm(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Feedback email ───────────────────────────────────── */}
      {sendMsg && (
        <div className={`mx-5 mb-3 text-xs rounded-lg px-3 py-2 border ${sendOk ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {sendMsg}
        </div>
      )}
      {emailedAt && !sendMsg && (
        <div className="mx-5 mb-3 flex items-center gap-1.5 text-xs text-indigo-500">
          <CalendarCheck2 size={12} className="shrink-0" />
          <span>Envoyé le {new Date(emailedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(emailedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {/* ── Section dépliable ────────────────────────────────── */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/50">
          {/* Postes de charges */}
          {postes && postes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Postes de charges</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {postes.map((p, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 text-xs ${i > 0 ? 'border-t border-gray-100' : ''} bg-white`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-gray-800 truncate">{p.libelle}</span>
                        <span className="text-gray-400 shrink-0">
                          {LABELS_CATEGORIE[p.categorie as keyof typeof LABELS_CATEGORIE] ?? p.categorie}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400">{formatRepartitionScope(p.repartition_type, p.repartition_cible)}</div>
                    </div>
                    <span className="font-semibold text-gray-900 tabular-nums shrink-0 ml-3">{formatEuros(p.montant)}</span>
                  </div>
                ))}
                {(appel.montant_fonds_travaux ?? 0) > 0 && !postes.some((p) => p.categorie === 'fonds_travaux_alur') && (
                  <div className="flex items-center justify-between px-3 py-2 text-xs border-t border-amber-100 bg-amber-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-amber-800">Fonds travaux ALUR</span>
                      <span className="text-amber-500 shrink-0">Fonds travaux</span>
                    </div>
                    <span className="font-semibold text-amber-700 tabular-nums shrink-0 ml-3">{formatEuros(appel.montant_fonds_travaux!)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2 text-xs border-t border-gray-200 bg-gray-50 font-semibold">
                  <span className="text-gray-600">Total</span>
                  <span className="text-blue-700 tabular-nums">{formatEuros(appel.montant_total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Suivi paiements */}
          {localLignes.length === 0 ? (
            <div className="text-center py-4 space-y-3">
              {regenerating ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Génération de la répartition…</span>
                </div>
              ) : currentStatut === 'brouillon' ? (
                <p className="text-sm text-gray-400">
                  La répartition sera générée automatiquement lors de l’émission.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-400">
                    Aucune répartition générée.
                  </p>
                  {isSyndic && canWrite && (
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw size={14} />
                      Régénérer
                    </button>
                  )}
                </>
              )}
              {regenMsg && (
                <p className="text-xs text-red-600">{regenMsg}</p>
              )}
            </div>
          ) : (
            <AppelFondsPaiement
              appel={appel}
              lignes={localLignes}
              isSyndic={isSyndic}
              canWrite={canWrite}
              onLignesChange={setLocalLignes}
            />
          )}
        </div>
      )}
    </div>
  );
}
