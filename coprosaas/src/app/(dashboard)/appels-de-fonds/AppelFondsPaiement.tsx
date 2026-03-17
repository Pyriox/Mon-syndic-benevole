// ============================================================
// Client Component : Suivi des paiements d'un appel de fonds
// - Total dû + date d'exigibilité bien visible
// - Détail des postes par copropriétaire (expandable)
// - Marquer payé avec date optionnelle → MAJ solde copropriétaire
// - Envoi e-mail avec tracking (emailed_at) + sauvegarde auto document
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatEuros, LABELS_CATEGORIE } from '@/lib/utils';
import { buildAppelFondsPDF, type AppelForPDF } from './AppelFondsPDF';
import {
  CheckCircle, Clock, XCircle, Mail, Loader2,
  ChevronUp, CalendarCheck2, X, ReceiptText,
} from 'lucide-react';

interface Poste { libelle: string; categorie: string; montant: number }

function parsePostes(d: string | null | undefined): Poste[] {
  if (!d) return [];
  try {
    const p = JSON.parse(d);
    if (Array.isArray(p) && p.length > 0 && 'libelle' in p[0]) return p;
  } catch { /* */ }
  return [];
}

export interface Ligne {
  id: string;
  montant_du: number;
  paye: boolean;
  date_paiement: string | null;
  coproprietaires: { id: string; nom: string; prenom: string } | null;
}

interface AppelPartiel {
  id: string;
  titre: string;
  montant_total: number;
  date_echeance: string;
  description?: string | null;
  copropriete_id?: string;
  coproprietes?: { nom: string } | null;
  type_appel?: string | null;
  ag_resolution_id?: string | null;
  emailed_at?: string | null;
}

interface AppelFondsPaiementProps {
  appel: AppelPartiel;
  lignes: Ligne[];
  isSyndic: boolean;
}

export default function AppelFondsPaiement({ appel, lignes, isSyndic }: AppelFondsPaiementProps) {
  const router = useRouter();
  const supabase = createClient();

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr + 'T00:00:00');
  const echeance = new Date(appel.date_echeance.slice(0, 10) + 'T00:00:00');
  const isOverdue = today > echeance;

  const [payingId, setPayingId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState(todayStr);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [sendOk, setSendOk] = useState<boolean | null>(null);
  const [emailedAt, setEmailedAt] = useState<string | null>(appel.emailed_at ?? null);

  const postes = parsePostes(appel.description);
  const hasPostes = postes.length > 0;

  const getStatut = (l: Ligne): 'paye' | 'impaye' | 'en_attente' => {
    if (l.paye) return 'paye';
    if (isOverdue) return 'impaye';
    return 'en_attente';
  };

  const handleConfirmPay = async (ligne: Ligne) => {
    setToggling(ligne.id);
    const date = payDate || todayStr;

    await supabase.from('lignes_appels_de_fonds').update({
      paye: true,
      date_paiement: date,
    }).eq('id', ligne.id);

    // Mettre à jour le solde du copropriétaire (paiement = solde +)
    if (ligne.coproprietaires?.id) {
      const { data: cop } = await supabase
        .from('coproprietaires').select('solde').eq('id', ligne.coproprietaires.id).single();
      await supabase.from('coproprietaires').update({
        solde: Math.round(((cop?.solde ?? 0) + ligne.montant_du) * 100) / 100,
      }).eq('id', ligne.coproprietaires.id);
    }

    setPayingId(null);
    setToggling(null);
    router.refresh();
  };

  const handleUnpay = async (ligne: Ligne) => {
    setToggling(ligne.id);

    await supabase.from('lignes_appels_de_fonds').update({
      paye: false,
      date_paiement: null,
    }).eq('id', ligne.id);

    // Annulation : reverser le solde
    if (ligne.coproprietaires?.id) {
      const { data: cop } = await supabase
        .from('coproprietaires').select('solde').eq('id', ligne.coproprietaires.id).single();
      await supabase.from('coproprietaires').update({
        solde: Math.round(((cop?.solde ?? 0) - ligne.montant_du) * 100) / 100,
      }).eq('id', ligne.coproprietaires.id);
    }

    setToggling(null);
    router.refresh();
  };

  const saveToDocuments = async () => {
    try {
      const appelForPDF: AppelForPDF = {
        ...appel,
        lignes_appels_de_fonds: lignes.map((l) => ({
          id: l.id,
          montant_du: l.montant_du,
          paye: l.paye,
          coproprietaires: l.coproprietaires
            ? { nom: l.coproprietaires.nom, prenom: l.coproprietaires.prenom }
            : null,
        })),
      };
      const pdfDoc = buildAppelFondsPDF(appelForPDF);
      const pdfBlob = pdfDoc.output('blob');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !appel.copropriete_id) return;

      const { data: dossier } = await supabase
        .from('dossiers').select('id')
        .eq('nom', 'Appels de fonds').eq('created_by', user.id).maybeSingle();

      const fileName = `${appel.copropriete_id}/${Date.now()}-appel-${appel.id.slice(0, 8)}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents').upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: false });

      if (uploadError) return;

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(uploadData.path);
      await supabase.from('documents').insert({
        copropriete_id: appel.copropriete_id,
        dossier_id: dossier?.id ?? null,
        nom: `Appel de fonds — ${appel.titre}`,
        type: 'autre',
        url: publicUrl,
        taille: pdfBlob.size,
        uploaded_by: user.id,
      });
    } catch { /* silent — non bloquant */ }
  };

  const handleSendEmails = async () => {
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
        await saveToDocuments();
        router.refresh();
      }
    } catch {
      setSendMsg("Erreur réseau lors de l'envoi.");
      setSendOk(false);
    }
    setSending(false);
  };

  const nbPayes = lignes.filter((l) => l.paye).length;

  return (
    <div className="mt-4 space-y-3">
      {/* ── En-tête ──────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Répartition — {nbPayes}/{lignes.length} payé(s)
        </p>
        {isSyndic && (
          <button
            type="button"
            onClick={handleSendEmails}
            disabled={sending}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
            {emailedAt ? 'Renvoyer par e-mail' : 'Envoyer par e-mail'}
          </button>
        )}
      </div>

      {/* ── Badge e-mail envoyé ───────────────────────── */}
      {emailedAt && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-xs text-indigo-700">
          <CalendarCheck2 size={13} className="shrink-0" />
          <span>
            Envoyé le{' '}
            {new Date(emailedAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}{' '}
            à {new Date(emailedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* ── Feedback envoi ───────────────────────────── */}
      {sendMsg && (
        <div className={`text-xs rounded-lg px-3 py-2 border ${sendOk ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {sendMsg}
        </div>
      )}

      {/* ── Table copropriétaires ─────────────────────── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {lignes.map((ligne, idx) => {
          const statut = getStatut(ligne);
          const nom = ligne.coproprietaires
            ? `${ligne.coproprietaires.prenom} ${ligne.coproprietaires.nom}`
            : 'N/A';
          const isExpanded = expandedId === ligne.id;
          const isPaying = payingId === ligne.id;
          const isToggling = toggling === ligne.id;

          return (
            <div
              key={ligne.id}
              className={`${idx > 0 ? 'border-t border-gray-100' : ''} ${statut === 'impaye' ? 'bg-red-50/40' : 'bg-white'}`}
            >
              {/* Ligne principale */}
              <div className="flex items-center gap-2 px-4 py-3">
                {/* Icône statut */}
                <div className="shrink-0 w-5">
                  {statut === 'paye' && <CheckCircle size={16} className="text-green-500" />}
                  {statut === 'impaye' && <XCircle size={16} className="text-red-500" />}
                  {statut === 'en_attente' && <Clock size={16} className="text-amber-400" />}
                </div>

                {/* Nom + date paiement */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{nom}</span>
                  {statut === 'paye' && ligne.date_paiement && (
                    <span className="ml-2 text-xs text-green-600">
                      · payé le {new Date(ligne.date_paiement.slice(0, 10) + 'T00:00:00').toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {statut === 'impaye' && (
                    <span className="ml-2 text-xs text-red-500 font-semibold">· impayé</span>
                  )}
                </div>

                {/* Montant */}
                <span className={`text-sm font-bold shrink-0 tabular-nums ${
                  statut === 'paye' ? 'text-green-700' :
                  statut === 'impaye' ? 'text-red-700' :
                  'text-gray-900'
                }`}>
                  {formatEuros(ligne.montant_du)}
                </span>

                {/* Bouton détail postes */}
                {hasPostes && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : ligne.id)}
                    title="Détail des postes"
                    className="shrink-0 p-1 text-gray-300 hover:text-indigo-500 transition-colors"
                  >
                    <ReceiptText size={14} />
                  </button>
                )}

                {/* Action syndic */}
                {isSyndic && !isPaying && (
                  ligne.paye ? (
                    <button
                      type="button"
                      onClick={() => handleUnpay(ligne)}
                      disabled={isToggling}
                      className="shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                    >
                      {isToggling ? <Loader2 size={11} className="animate-spin inline" /> : 'Annuler'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setPayDate(todayStr); setPayingId(ligne.id); }}
                      disabled={isToggling}
                      className="shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
                    >
                      {isToggling ? <Loader2 size={11} className="animate-spin inline" /> : '✓ Payé'}
                    </button>
                  )
                )}
              </div>

              {/* Date de paiement (inline) */}
              {isPaying && (
                <div className="flex items-center gap-2 px-4 pb-3 pl-11 bg-green-50/60 border-t border-green-100 flex-wrap">
                  <span className="text-xs text-gray-600 shrink-0">Date de paiement :</span>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <span className="text-xs text-gray-400 italic">(facultatif — aujourd&apos;hui par défaut)</span>
                  <button
                    type="button"
                    onClick={() => handleConfirmPay(ligne)}
                    disabled={isToggling}
                    className="text-xs px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isToggling ? <Loader2 size={11} className="animate-spin inline" /> : 'Confirmer'}
                  </button>
                  <button type="button" onClick={() => setPayingId(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Détail postes (expandable) */}
              {isExpanded && hasPostes && (
                <div className="border-t border-indigo-100 bg-indigo-50/30 px-4 py-3">
                  <p className="text-xs font-semibold text-indigo-700 mb-2">
                    Détail des postes — part de {nom}
                    <span className="ml-2 font-normal text-gray-400">
                      ({((ligne.montant_du / appel.montant_total) * 100).toFixed(1)}&nbsp;% du budget)
                    </span>
                  </p>
                  <div className="space-y-1">
                    {postes.map((poste, i) => {
                      const part = Math.round((poste.montant * (ligne.montant_du / appel.montant_total)) * 100) / 100;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-indigo-100">
                          <div>
                            <span className="font-medium text-gray-800">{poste.libelle}</span>
                            <span className="ml-2 text-gray-400">
                              {LABELS_CATEGORIE[poste.categorie as keyof typeof LABELS_CATEGORIE] ?? poste.categorie}
                            </span>
                          </div>
                          <span className="font-bold text-indigo-700 tabular-nums">{formatEuros(part)}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between text-xs font-bold px-3 pt-1">
                      <span className="text-gray-600">Total</span>
                      <span className="text-indigo-800 tabular-nums">{formatEuros(ligne.montant_du)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(null)}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <ChevronUp size={11} /> Réduire
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

