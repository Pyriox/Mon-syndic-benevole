'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { formatEuros } from '@/lib/utils';
import type { CoproprietaireBalanceSourceType } from '@/lib/coproprietaire-balance';
import { History, Loader2 } from 'lucide-react';

export interface BalanceEventRow {
  id: string;
  event_date: string;
  source_type: CoproprietaireBalanceSourceType;
  account_type: 'principal' | 'fonds_travaux' | 'regularisation' | 'mixte';
  label: string;
  reason: string | null;
  amount: number;
  balance_after: number;
  created_at: string;
}

function toHistoryDate(value: string | null | undefined) {
  if (!value) return null;

  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatHistoryDate(value: string | null | undefined) {
  const parsed = toHistoryDate(value);
  if (!parsed) return '—';

  return parsed.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getEventSortTimestamp(event: BalanceEventRow) {
  return toHistoryDate(event.created_at)?.getTime()
    ?? toHistoryDate(event.event_date)?.getTime()
    ?? 0;
}

function sortBalanceEvents(rows: BalanceEventRow[]) {
  return [...rows].sort((left, right) => {
    const timestampDiff = getEventSortTimestamp(right) - getEventSortTimestamp(left);
    if (timestampDiff !== 0) return timestampDiff;

    return (toHistoryDate(right.event_date)?.getTime() ?? 0) - (toHistoryDate(left.event_date)?.getTime() ?? 0);
  });
}

function getDisplayedLabel(event: BalanceEventRow) {
  if (event.source_type === 'appel_publication') {
    return event.label.replace(/^Publication d'appel de fonds\s+[—-]\s+/i, '').trim();
  }

  return event.label;
}

function amountClass(value: number) {
  if (value > 0) return 'text-red-600';
  if (value < 0) return 'text-green-600';
  return 'text-gray-500';
}

function balanceVariant(value: number): 'default' | 'success' | 'danger' {
  if (value > 0) return 'danger';
  if (value < 0) return 'success';
  return 'default';
}

function getDisplayedBalance(value: number) {
  if (value > 0) {
    return {
      amount: -Math.abs(value),
      tone: 'text-red-600',
      helper: 'Charges à régler',
    };
  }

  if (value < 0) {
    return {
      amount: Math.abs(value),
      tone: 'text-green-700',
      helper: 'Avance de trésorerie',
    };
  }

  return {
    amount: 0,
    tone: 'text-gray-900',
    helper: 'Solde à jour',
  };
}

export default function CoproprietaireBalanceHistory({
  coproprietaireId,
  displayName,
  currentBalance,
  mode = 'modal',
  initialEvents,
  showSummary,
}: {
  coproprietaireId: string;
  displayName: string;
  currentBalance: number;
  mode?: 'modal' | 'inline';
  initialEvents?: BalanceEventRow[];
  showSummary?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<BalanceEventRow[]>(sortBalanceEvents(initialEvents ?? []));
  const shouldShowSummary = showSummary ?? mode === 'modal';
  const displayedBalance = getDisplayedBalance(currentBalance);

  useEffect(() => {
    setEvents(sortBalanceEvents(initialEvents ?? []));
  }, [initialEvents]);

  const loadEvents = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/coproprietaires/${coproprietaireId}/balance-events?limit=150`, {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json()) as { events?: BalanceEventRow[]; message?: string };

      if (!response.ok) {
        setError(payload.message ?? 'Impossible de charger l’historique.');
        return;
      }

      setEvents(sortBalanceEvents(payload.events ?? []));
    } catch {
      setError('Impossible de charger l’historique.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    setIsOpen(true);
    if (!loading) {
      await loadEvents();
    }
  };

  const content = (
    <div className="space-y-4">
      <div className={`flex flex-col gap-3 ${shouldShowSummary ? 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between' : 'sm:flex-row sm:items-center sm:justify-between'}`}>
        {shouldShowSummary && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solde actuel</p>
            <p className={`text-2xl font-bold ${displayedBalance.tone}`}>
              {displayedBalance.amount > 0 ? '+' : ''}{formatEuros(displayedBalance.amount)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{displayedBalance.helper}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Chargement de l&apos;historique…
        </div>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          Aucun mouvement enregistré pour le moment.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Libellé</th>
                <th className="px-4 py-3 text-right font-medium">Variation</th>
                <th className="px-4 py-3 text-right font-medium">Solde après</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={event.id} className={index > 0 ? 'border-t border-slate-100' : ''}>
                  <td className="px-4 py-3 align-top text-slate-600 whitespace-nowrap">{formatHistoryDate(event.created_at ?? event.event_date)}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{getDisplayedLabel(event)}</span>
                      </div>
                      {event.reason && (
                        <p className="text-xs text-slate-500">Motif : {event.reason}</p>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 align-top text-right font-semibold tabular-nums ${amountClass(event.amount)}`}>
                    {event.amount > 0 ? '+' : ''}{formatEuros(event.amount)}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <Badge variant={balanceVariant(event.balance_after)}>{formatEuros(event.balance_after)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (mode === 'inline') {
    return content;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openModal()}
        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        title="Historique financier"
      >
        <History size={15} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Historique financier — ${displayName}`} size="xl">
        {content}
      </Modal>
    </>
  );
}
