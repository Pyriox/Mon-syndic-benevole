// ============================================================
// Client Component : Changement de statut d'une AG
// creation  → planifiee : valider la planification
// planifiee → en_cours  : lancer l'AG (feuille de présence)
// en_cours  → terminee  : clôturer
// planifiee → annulee   : annuler (avec trace)
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { CheckCircle, Trash2, XCircle, Send, CalendarCheck } from 'lucide-react';
import LancerAGModal from './LancerAGModal';

// ---- Suppression définitive (seulement en statut 'creation') ----
export function AGDelete({ agId }: { agId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer cette assemblée générale ? Toutes les résolutions associées seront supprimées. Cette action est irréversible.')) return;
    setLoading(true);
    await supabase.from('resolutions').delete().eq('ag_id', agId);
    await supabase.from('assemblees_generales').delete().eq('id', agId);
    router.push('/assemblees');
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Supprimer cette AG"
    >
      <Trash2 size={14} />
      Supprimer l&apos;AG
    </button>
  );
}

// ---- Annulation (seulement en statut 'planifiee' — garde une trace) ----
export function AGAnnuler({ agId }: { agId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleAnnuler = async () => {
    if (!confirm("Annuler cette assemblée générale ? L'AG sera conservée avec le statut « Annulée » mais ne pourra plus être modifiée.")) return;
    setLoading(true);
    await supabase.from('assemblees_generales').update({ statut: 'annulee' }).eq('id', agId);
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleAnnuler}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Annuler cette AG"
    >
      <XCircle size={14} />
      Annuler l&apos;AG
    </button>
  );
}

// ---- Envoi du PV par e-mail (statut 'terminee') ----
export function AGEnvoyerPV({ agId }: { agId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleEnvoyer = async () => {
    if (!confirm('Envoyer le procès-verbal par e-mail à tous les copropriétaires ayant une adresse e-mail renseignée ?')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/ag/${agId}/envoyer-pv`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.message ?? 'Erreur lors de l\'envoi.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <span className="flex items-center gap-1.5 text-xs text-green-600">
      <CheckCircle size={14} /> PV envoyé
    </span>
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" size="sm" loading={loading} onClick={handleEnvoyer}>
        <Send size={14} /> Envoyer le PV par e-mail
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface AGStatusActionsProps {
  agId: string;
  coproprieteId: string;
  currentStatut: string;
  quorumAtteint: boolean;
}

export default function AGStatusActions({ agId, coproprieteId, currentStatut, quorumAtteint }: AGStatusActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleValiderPlanification = async () => {
    setLoading(true);
    await supabase.from('assemblees_generales').update({ statut: 'planifiee' }).eq('id', agId);
    router.refresh();
    setLoading(false);
  };

  const handleCloturer = async () => {
    setLoading(true);
    await supabase.from('assemblees_generales').update({ statut: 'terminee', quorum_atteint: quorumAtteint }).eq('id', agId);
    router.refresh();
    setLoading(false);
  };

  if (currentStatut === 'creation') {
    return (
      <Button variant="primary" size="sm" loading={loading} onClick={handleValiderPlanification}>
        <CalendarCheck size={14} /> Valider la planification
      </Button>
    );
  }

  if (currentStatut === 'planifiee') {
    return (
      <LancerAGModal agId={agId} coproprieteId={coproprieteId} mode="launch" />
    );
  }

  if (currentStatut === 'en_cours') {
    return (
      <Button variant="success" size="sm" loading={loading} onClick={handleCloturer}>
        <CheckCircle size={14} /> Clôturer l&apos;AG
      </Button>
    );
  }

  return null;
}
