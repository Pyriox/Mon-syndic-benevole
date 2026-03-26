// ============================================================
// Composant client : actions par copropriété dans la table admin
// ============================================================
'use client';

import { useState, useRef } from 'react';
import { MoreHorizontal, Loader2, RotateCcw, RefreshCw, UserCog, Pencil, Users } from 'lucide-react';

interface Props {
  coproId: string;
  coproNom: string;
  currentPlan: string;
  currentPlanId: string | null;
  isOrphaned?: boolean;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  nombreLots?: number | null;
}

export default function AdminCoproActions({ coproId, coproNom, currentPlan, isOrphaned, adresse, codePostal, ville, nombreLots }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);

  // ── Edit modal ────────────────────────────────────────────
  const [editOpen,      setEditOpen]      = useState(false);
  const [editNom,       setEditNom]       = useState(coproNom);
  const [editAdresse,   setEditAdresse]   = useState(adresse ?? '');
  const [editCodePostal,setEditCodePostal]= useState(codePostal ?? '');
  const [editVille,     setEditVille]     = useState(ville ?? '');
  const [editNbLots,    setEditNbLots]    = useState(String(nombreLots ?? ''));
  const [editLoading,   setEditLoading]   = useState(false);

  const openEdit = () => {
    setEditNom(coproNom);
    setEditAdresse(adresse ?? '');
    setEditCodePostal(codePostal ?? '');
    setEditVille(ville ?? '');
    setEditNbLots(String(nombreLots ?? ''));
    setOpen(false);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    const res = await fetch('/api/admin/coproprietes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coproId,
        nom: editNom,
        adresse: editAdresse,
        code_postal: editCodePostal,
        ville: editVille,
        nombre_lots: editNbLots ? Number(editNbLots) : undefined,
      }),
    });
    setEditLoading(false);
    if (res.ok) {
      setEditOpen(false);
      setDone('Modifié');
      setTimeout(() => window.location.reload(), 800);
    } else {
      const { error } = await res.json();
      alert('Erreur : ' + error);
    }
  };

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  };

  const post = async (body: object) => {
    setLoading(true);
    setOpen(false);
    const res = await fetch('/api/admin/coproprietes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setDone('OK');
      setTimeout(() => window.location.reload(), 800);
    } else {
      const { error } = await res.json();
      alert('Erreur : ' + error);
    }
  };

  const handleReset = () => {
    if (!confirm(`Réinitialiser l'abonnement de « ${coproNom} » ?\n\nLe plan sera remis à « essai » et les données Stripe effacées (stripe_subscription_id, stripe_customer_id, plan_period_end).`)) return;
    post({ action: 'reset_subscription', coproId });
  };

  const handleSync = () => {
    if (!confirm(`Synchroniser « ${coproNom} » depuis Stripe ?\n\nLe plan sera mis à jour selon l'abonnement réel dans Stripe.`)) return;
    post({ action: 'stripe_sync', coproId });
  };

  const handleReassign = () => {
    const email = window.prompt(
      `Réassigner le syndic de « ${coproNom} »\n\nEntrez l\'adresse email du nouveau syndic :`,
    );
    if (!email?.trim()) return;
    if (!confirm(`Confirmer la réassignation de « ${coproNom} » à ${email.trim()} ?`)) return;
    post({ action: 'reassign_syndic', coproId, newEmail: email.trim() } as Record<string, unknown>);
  };

  if (done) return <span className="text-xs text-green-600 font-medium">✓</span>;

  return (
    <>
      {/* ── Edit modal ──────────────────────────────────── */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold text-gray-900 mb-4">Modifier la copropriété</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editNom}
                  onChange={(e) => setEditNom(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={editAdresse}
                  onChange={(e) => setEditAdresse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={editCodePostal}
                    onChange={(e) => setEditCodePostal(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={editVille}
                    onChange={(e) => setEditVille(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de lots</label>
                <input
                  type="number"
                  min={0}
                  value={editNbLots}
                  onChange={(e) => setEditNbLots(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
                >
                  {editLoading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Row actions ─────────────────────────────────── */}
      <div className="relative flex items-center justify-end gap-1">
        {isOrphaned && (
          <span title="Copropriété sans syndic" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-600">
            <UserCog size={11} />
          </span>
        )}
        {loading ? (
          <Loader2 size={15} className="animate-spin text-gray-400" />
        ) : (
          <button
            ref={buttonRef}
            onClick={toggleOpen}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Actions"
          >
            <MoreHorizontal size={15} />
          </button>
        )}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[210px]"
              style={{ top: dropPos?.top ?? 0, right: dropPos?.right ?? 0 }}
            >
              <button
                onClick={openEdit}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <Pencil size={12} className="shrink-0" />
                Modifier les infos
              </button>
              <button
                onClick={() => { window.location.href = `/admin/coproprietes/${coproId}`; }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Users size={12} className="shrink-0" />
                Voir les copropriétaires
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleSync}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <RefreshCw size={12} className="shrink-0" />
                Sync depuis Stripe
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleReassign}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-violet-700 hover:bg-violet-50 transition-colors"
              >
                <UserCog size={12} className="shrink-0" />
                Réassigner le syndic
              </button>
              {currentPlan !== 'essai' && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    <RotateCcw size={12} className="shrink-0" />
                    Réinitialiser (essai)
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

