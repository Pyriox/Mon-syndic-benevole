// ============================================================
// Client Component : Suivi des paiements d'un appel de fonds
// - Toggle payé/impayé par copropriétaire
// - Statut automatique "Impayé" après la date d'échéance
// - Envoi d'e-mail global
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatEuros } from '@/lib/utils';
import { CheckCircle, Clock, XCircle, Mail, Loader2 } from 'lucide-react';

interface Ligne {
  id: string;
  montant_du: number;
  paye: boolean;
  date_paiement: string | null;
  coproprietaires: { nom: string; prenom: string } | null;
}

interface AppelFondsPaiementProps {
  appelId: string;
  dateEcheance: string;
  lignes: Ligne[];
}

export default function AppelFondsPaiement({ appelId, dateEcheance, lignes }: AppelFondsPaiementProps) {
  const router = useRouter();
  const supabase = createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const echeance = new Date(dateEcheance);
  echeance.setHours(0, 0, 0, 0);
  const isOverdue = today > echeance;

  const [toggling, setToggling] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [sendOk, setSendOk] = useState<boolean | null>(null);

  const getStatut = (ligne: Ligne): 'paye' | 'impaye' | 'en_attente' => {
    if (ligne.paye) return 'paye';
    if (isOverdue) return 'impaye';
    return 'en_attente';
  };

  const handleToggle = async (ligne: Ligne) => {
    setToggling(ligne.id);
    const newPaye = !ligne.paye;
    await supabase.from('lignes_appels_de_fonds').update({
      paye: newPaye,
      date_paiement: newPaye ? new Date().toISOString().split('T')[0] : null,
    }).eq('id', ligne.id);
    setToggling(null);
    router.refresh();
  };

  const handleSendEmails = async () => {
    setSending(true);
    setSendMsg('');
    setSendOk(null);
    try {
      const res = await fetch(`/api/appels-de-fonds/${appelId}/envoyer`, { method: 'POST' });
      const json = await res.json();
      setSendMsg(json.message ?? 'Envoyé');
      setSendOk(res.ok);
    } catch {
      setSendMsg('Erreur réseau lors de l\'envoi.');
      setSendOk(false);
    }
    setSending(false);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Répartition par copropriétaire</p>
        <button
          type="button"
          onClick={handleSendEmails}
          disabled={sending}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors"
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
          Envoyer par e-mail
        </button>
      </div>

      {sendMsg && (
        <div className={`mb-2 text-xs rounded-lg px-3 py-2 ${sendOk ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {sendMsg}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">Copropriétaire</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">Montant dû</th>
              <th className="text-center px-3 py-2 text-gray-500 font-medium">Statut</th>
              <th className="text-center px-3 py-2 text-gray-500 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => {
              const statut = getStatut(ligne);
              return (
                <tr key={ligne.id} className={`border-t border-gray-100 ${statut === 'impaye' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-3 py-2 font-medium text-gray-800">
                    {ligne.coproprietaires
                      ? `${ligne.coproprietaires.prenom} ${ligne.coproprietaires.nom}`
                      : 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">
                    {formatEuros(ligne.montant_du)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {statut === 'paye' && (
                      <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                        <CheckCircle size={12} />
                        Payé{ligne.date_paiement
                          ? ` le ${new Date(ligne.date_paiement).toLocaleDateString('fr-FR')}`
                          : ''}
                      </span>
                    )}
                    {statut === 'impaye' && (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                        <XCircle size={12} /> Impayé
                      </span>
                    )}
                    {statut === 'en_attente' && (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Clock size={12} /> En attente
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(ligne)}
                      disabled={toggling === ligne.id}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        ligne.paye
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      {toggling === ligne.id ? '…' : ligne.paye ? 'Annuler paiement' : '✓ Marquer payé'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
