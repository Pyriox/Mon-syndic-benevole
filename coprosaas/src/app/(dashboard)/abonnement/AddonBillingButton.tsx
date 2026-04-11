'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, Loader2, Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type AddonBillingButtonProps = {
  coproprieteid: string;
  coproName: string;
  enabled: boolean;
  scheduledForCancellation?: boolean;
  priceHeadline?: string;
  priceSubline?: string;
  priceNote?: string;
  currentPeriodEnd?: string | null;
};

function formatPeriodEnd(date?: string | null): string | null {
  if (!date) return null;

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    }).format(new Date(date));
  } catch {
    return null;
  }
}

export default function AddonBillingButton({
  coproprieteid,
  coproName,
  enabled,
  scheduledForCancellation = false,
  priceHeadline,
  priceSubline,
  priceNote,
  currentPeriodEnd,
}: AddonBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isEnabling = !enabled || scheduledForCancellation;
  const periodEndLabel = useMemo(() => formatPeriodEnd(currentPeriodEnd), [currentPeriodEnd]);

  const triggerLabel = !enabled
    ? `Activer l’option · ${priceHeadline ?? 'Tarif Stripe'}`
    : scheduledForCancellation
      ? 'Réactiver le renouvellement'
      : 'Arrêter à l’échéance';

  const modalTitle = !enabled
    ? 'Confirmer l’activation de l’option'
    : scheduledForCancellation
      ? 'Confirmer la poursuite de l’option'
      : 'Confirmer l’arrêt à l’échéance';

  const confirmLabel = !enabled
    ? `Confirmer l’ajout · ${priceHeadline ?? 'Tarif Stripe'}`
    : scheduledForCancellation
      ? 'Confirmer la poursuite'
      : 'Confirmer l’arrêt';

  function openConfirmation() {
    setError('');
    setConfirmed(false);
    setConfirmOpen(true);
  }

  function closeConfirmation() {
    if (loading) return;
    setConfirmOpen(false);
    setConfirmed(false);
  }

  async function handleConfirm() {
    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/addons/charges-speciales', {
        method: isEnabling ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coproprieteid }),
      });

      const json = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(json.error ?? `Erreur ${response.status}`);
        setLoading(false);
        return;
      }

      const addonState = isEnabling ? 'enabled' : 'disabled';
      window.location.assign(`/abonnement?addon=${addonState}&coproId=${coproprieteid}`);
    } catch {
      setError('Erreur réseau — vérifiez votre connexion.');
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={openConfirmation}
          disabled={loading}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
            isEnabling
              ? 'bg-slate-900 hover:bg-slate-800'
              : 'bg-amber-600 hover:bg-amber-700'
          } ${loading ? 'cursor-wait opacity-80' : ''}`}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Traitement…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {triggerLabel}
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-500">
          {isEnabling
            ? 'Une confirmation explicite est demandée avant toute souscription.'
            : 'Une confirmation explicite est demandée avant de programmer l’arrêt.'}
        </p>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <Modal isOpen={confirmOpen} onClose={closeConfirmation} title={modalTitle} size="lg">
        <div className="space-y-4">
          <div className={`rounded-xl border px-4 py-3 ${isEnabling ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start gap-3">
              {isEnabling ? (
                <Sparkles size={18} className="mt-0.5 shrink-0 text-sky-700" />
              ) : (
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
              )}
              <div className="space-y-1 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{coproName}</p>
                <p>
                  {isEnabling
                    ? 'Vous êtes sur le point d’ajouter une option payante à cet abonnement.'
                    : 'Vous êtes sur le point de stopper le renouvellement de cette option à la prochaine échéance.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {isEnabling ? 'Tarif de l’option' : 'Tarif actuel de l’option'}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{priceHeadline ?? 'Tarif Stripe'}</p>
            {priceSubline && <p className="text-sm text-slate-600">{priceSubline}</p>}
            <p className="mt-1 text-xs text-slate-500">
              {isEnabling
                ? (priceNote ?? 'Ce montant sera ajouté à l’abonnement principal de la copropriété.')
                : 'Ce tarif ne sera plus reconduit à partir du prochain renouvellement.'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <ul className="space-y-2 text-sm text-gray-700">
              {isEnabling ? (
                <>
                  <li>• L’option sera ajoutée à l’abonnement Stripe de <strong>{coproName}</strong>.</li>
                  <li>• Le montant est facturé avec <strong>prorata automatique</strong> sur la période restante.</li>
                  <li>• Les factures et moyens de paiement restent gérés dans le portail Stripe.</li>
                </>
              ) : (
                <>
                  <li>• L’option ne s’arrête pas immédiatement : elle reste disponible jusqu’à l’échéance.</li>
                  {periodEndLabel && (
                    <li className="flex items-center gap-2">
                      <CalendarDays size={14} className="shrink-0 text-amber-700" />
                      Fin d’accès prévue le <strong>{periodEndLabel}</strong>.
                    </li>
                  )}
                  <li>• Le prochain renouvellement de cette option ne sera pas facturé.</li>
                </>
              )}
            </ul>
          </div>

          <label className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600"
            />
            <span className="text-sm text-gray-700">
              {isEnabling
                ? `Je confirme l’ajout payant de l’option Charges spéciales pour « ${coproName} ».`
                : `Je confirme l’arrêt du renouvellement de l’option Charges spéciales pour « ${coproName} ».`}
            </span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeConfirmation}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-70"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!confirmed || loading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isEnabling ? 'bg-slate-900 hover:bg-slate-800' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Validation…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  {confirmLabel}
                </>
              )}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  );
}
