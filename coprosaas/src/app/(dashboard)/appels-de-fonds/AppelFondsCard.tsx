'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, AlertTriangle, Link2, Mail, Loader2, CalendarCheck2, RefreshCw } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatEuros, formatDate, LABELS_CATEGORIE } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import AppelFondsPDF, { buildAppelFondsPDF, type AppelForPDF } from './AppelFondsPDF';
import AppelFondsPaiement, { type Ligne } from './AppelFondsPaiement';

interface Poste { libelle: string; categorie: string; montant: number }

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
    coproprietes?: { nom: string } | null;
  };
  lignes: Ligne[];
  postes: Poste[] | null;
  isSyndic: boolean;
  nbPayes: number;
  nbImpayes: number;
  pctPaye: number;
}

export default function AppelFondsCard({ appel, lignes, postes, isSyndic, nbPayes, nbImpayes, pctPaye }: AppelCardProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [sendOk, setSendOk] = useState<boolean | null>(null);
  const [emailedAt, setEmailedAt] = useState<string | null>(appel.emailed_at ?? null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenMsg, setRegenMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenMsg('');
    try {
      if (!appel.copropriete_id) { setRegenMsg('Copropriété introuvable.'); return; }
      const { data: lots } = await supabase
        .from('lots')
        .select('id, tantiemes, coproprietaires(id)')
        .eq('copropriete_id', appel.copropriete_id);

      const lotsWithCopro = (lots ?? []).filter((l) => {
        const c = Array.isArray(l.coproprietaires) ? l.coproprietaires[0] : l.coproprietaires;
        return c != null;
      });

      if (lotsWithCopro.length === 0) {
        setRegenMsg('Aucun lot avec copropriétaire assigné trouvé. Assignez d’abord des copropriétaires aux lots.');
        return;
      }
      const totalTantiemes = lotsWithCopro.reduce((s, l) => s + (l.tantiemes ?? 0), 0);

      const { error } = await supabase.from('lignes_appels_de_fonds').insert(
        lotsWithCopro.map((lot) => {
          const copro = (Array.isArray(lot.coproprietaires) ? lot.coproprietaires[0] : lot.coproprietaires) as { id: string };
          const montant = totalTantiemes > 0
            ? Math.round((appel.montant_total * (lot.tantiemes ?? 0) / totalTantiemes) * 100) / 100
            : 0;
          return { appel_de_fonds_id: appel.id, coproprietaire_id: copro.id, lot_id: lot.id, montant_du: montant, paye: false, date_paiement: null };
        })
      );
      if (error) { setRegenMsg('Erreur : ' + error.message); return; }
      router.refresh();
    } finally {
      setRegenerating(false);
    }
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
    } catch { /* silent */ }
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

  const typeAppel = appel.type_appel;
  const barColor = pctPaye === 100 ? 'bg-green-500' : nbImpayes > 0 ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* ── En-tête compact ─────────────────────────────────── */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
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

              <Badge variant={pctPaye === 100 ? 'success' : pctPaye > 50 ? 'warning' : 'danger'}>
                {pctPaye}%
              </Badge>

              {nbImpayes > 0 && (
                <Badge variant="danger">{nbImpayes} impayé{nbImpayes > 1 ? 's' : ''}</Badge>
              )}
            </div>

            {/* Montant + échéance sur une ligne */}
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="font-bold text-gray-900">{formatEuros(appel.montant_total)}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">Échéance <span className="text-gray-700 font-medium">{formatDate(appel.date_echeance)}</span></span>
              {lignes.length > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500">{nbPayes}/{lignes.length} payé{nbPayes > 1 ? 's' : ''}</span>
                </>
              )}
            </div>

            {/* Barre de progression fine */}
            {lignes.length > 0 && (
              <div className="mt-2.5 w-full bg-gray-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pctPaye}%` }} />
              </div>
            )}
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-1 shrink-0">
            {isSyndic && (
              <button
                type="button"
                onClick={handleSendEmails}
                disabled={sending}
                title={emailedAt ? `Renvoyer (envoyé le ${new Date(emailedAt).toLocaleDateString('fr-FR')})` : 'Envoyer par e-mail'}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${emailedAt ? 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              </button>
            )}
            <AppelFondsPDF appel={appel} />
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
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-gray-800 truncate">{p.libelle}</span>
                      <span className="text-gray-400 shrink-0">
                        {LABELS_CATEGORIE[p.categorie as keyof typeof LABELS_CATEGORIE] ?? p.categorie}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 tabular-nums shrink-0 ml-3">{formatEuros(p.montant)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 text-xs border-t border-gray-200 bg-gray-50 font-semibold">
                  <span className="text-gray-600">Total</span>
                  <span className="text-blue-700 tabular-nums">{formatEuros(appel.montant_total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Suivi paiements */}
          {lignes.length === 0 ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-gray-400">
                Aucune répartition générée — les copropriétaires n&apos;étaient peut-être pas encore assignés aux lots.
              </p>
              {isSyndic && (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                >
                  {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Générer la répartition
                </button>
              )}
              {regenMsg && (
                <p className="text-xs text-red-600">{regenMsg}</p>
              )}
            </div>
          ) : (
            <AppelFondsPaiement
              appel={appel}
              lignes={lignes}
              isSyndic={isSyndic}
            />
          )}
        </div>
      )}
    </div>
  );
}
