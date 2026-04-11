'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { formatEuros } from '@/lib/utils';
import type { CoproprietaireBalanceAccountType, CoproprietaireBalanceSourceType } from '@/lib/coproprietaire-balance';
import { History, Loader2 } from 'lucide-react';

type BalanceFilter = 'all' | 'principal' | 'fonds_travaux' | 'regularisation';

export interface BalanceEventRow {
  id: string;
  event_date: string;
  source_type: CoproprietaireBalanceSourceType;
  account_type: CoproprietaireBalanceAccountType;
  label: string;
  reason: string | null;
  amount: number;
  balance_after: number;
  created_at: string;
}

const FILTER_LABELS: Record<BalanceFilter, string> = {
  all: 'Tous',
  principal: 'Compte principal',
  fonds_travaux: 'Fonds travaux',
  regularisation: 'Régularisation',
};

function formatEventDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

function accountLabel(accountType: CoproprietaireBalanceAccountType) {
  switch (accountType) {
    case 'fonds_travaux':
      return 'Fonds travaux';
    case 'regularisation':
      return 'Régularisation';
    case 'mixte':
      return 'Mixte';
    default:
      return 'Compte principal';
  }
}

function matchesFilter(event: BalanceEventRow, filter: BalanceFilter) {
  if (filter === 'all') return true;
  if (filter === 'principal') return event.account_type === 'principal' || event.account_type === 'mixte';
  if (filter === 'fonds_travaux') return event.account_type === 'fonds_travaux' || event.account_type === 'mixte';
  return event.account_type === 'regularisation';
}

export default function CoproprietaireBalanceHistory({
  coproprietaireId,
  displayName,
  currentBalance,
  mode = 'modal',
  initialEvents = [],
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
  const [events, setEvents] = useState<BalanceEventRow[]>(initialEvents);
  const [selectedFilter, setSelectedFilter] = useState<BalanceFilter>('all');
  const shouldShowSummary = showSummary ?? mode === 'modal';

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const visibleEvents = useMemo(
    () => events.filter((event) => matchesFilter(event, selectedFilter)),
    [events, selectedFilter],
  );

  const loadEvents = async () => {
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('coproprietaire_balance_events')
      .select('id, event_date, source_type, account_type, label, reason, amount, balance_after, created_at')
      .eq('coproprietaire_id', coproprietaireId)
      .order('event_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(150);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setEvents((data ?? []) as BalanceEventRow[]);
    setLoading(false);
  };

  const openModal = async () => {
    setIsOpen(true);
    if (events.length === 0 && !loading) {
      await loadEvents();
    }
  };

  const content = (
    <div className="space-y-4">
      <div className={`flex flex-col gap-3 ${shouldShowSummary ? 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between' : 'sm:flex-row sm:items-center sm:justify-between'}`}>
        {shouldShowSummary && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solde actuel</p>
            <p className={`text-2xl font-bold ${amountClass(currentBalance)}`}>{formatEuros(currentBalance)}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABELS) as BalanceFilter[]).map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setSelectedFilter(filterKey)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedFilter === filterKey
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {FILTER_LABELS[filterKey]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Chargement de l&apos;historique…
        </div>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : visibleEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          Aucun mouvement enregistré pour ce filtre pour le moment.
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
              {visibleEvents.map((event, index) => (
                <tr key={event.id} className={index > 0 ? 'border-t border-slate-100' : ''}>
                  <td className="px-4 py-3 align-top text-slate-600 whitespace-nowrap">{formatEventDate(event.event_date)}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{event.label}</span>
                        <Badge variant="info">{accountLabel(event.account_type)}</Badge>
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
