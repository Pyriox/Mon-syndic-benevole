import type { CoproprietaireBalanceAccountType, CoproprietaireBalanceSourceType } from './coproprietaire-balance';

export interface AdminCoproFinancialCoproRow {
  id: string;
  solde: number | null;
}

export interface AdminCoproFinancialEventRow {
  id: string;
  coproprietaire_id: string | null;
  event_date: string;
  source_type: CoproprietaireBalanceSourceType;
  account_type: CoproprietaireBalanceAccountType;
  label: string;
  reason: string | null;
  amount: number;
  balance_after: number;
  created_at: string;
}

const SOURCE_LABELS: Record<CoproprietaireBalanceSourceType, string> = {
  manual_adjustment: 'Ajustement manuel',
  solde_initial: 'Solde initial',
  opening_balance: 'Reprise de solde',
  appel_publication: 'Appel publié',
  appel_suppression: 'Appel supprimé',
  payment_received: 'Paiement reçu',
  payment_cancelled: 'Paiement annulé',
  regularisation_closure: 'Régularisation',
};

const ACCOUNT_LABELS: Record<CoproprietaireBalanceAccountType, string> = {
  principal: 'Principal',
  fonds_travaux: 'Fonds travaux',
  regularisation: 'Régularisation',
  mixte: 'Mixte',
};

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

function toSortableTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function getAdminBalanceSourceLabel(sourceType: CoproprietaireBalanceSourceType) {
  return SOURCE_LABELS[sourceType] ?? sourceType;
}

export function getAdminBalanceAccountLabel(accountType: CoproprietaireBalanceAccountType) {
  return ACCOUNT_LABELS[accountType] ?? accountType;
}

export function buildAdminCoproFinancialView({
  coproprietaires,
  balanceEvents,
  maxEvents = 80,
}: {
  coproprietaires: AdminCoproFinancialCoproRow[] | null | undefined;
  balanceEvents: AdminCoproFinancialEventRow[] | null | undefined;
  maxEvents?: number;
}) {
  const totalDebiteur = roundToCents(
    (coproprietaires ?? []).reduce((sum, coproprietaire) => sum + Math.max(coproprietaire.solde ?? 0, 0), 0),
  );
  const totalCrediteur = roundToCents(
    (coproprietaires ?? []).reduce((sum, coproprietaire) => sum + Math.abs(Math.min(coproprietaire.solde ?? 0, 0)), 0),
  );
  const debiteurCount = (coproprietaires ?? []).filter((coproprietaire) => (coproprietaire.solde ?? 0) > 0).length;
  const creditorCount = (coproprietaires ?? []).filter((coproprietaire) => (coproprietaire.solde ?? 0) < 0).length;

  const sortedEvents = [...(balanceEvents ?? [])].sort((left, right) => {
    const createdAtDiff = toSortableTimestamp(right.created_at) - toSortableTimestamp(left.created_at);
    if (createdAtDiff !== 0) return createdAtDiff;

    return toSortableTimestamp(right.event_date) - toSortableTimestamp(left.event_date);
  });

  const typeCounts = sortedEvents.reduce<Partial<Record<CoproprietaireBalanceSourceType, number>>>((acc, event) => {
    acc[event.source_type] = (acc[event.source_type] ?? 0) + 1;
    return acc;
  }, {});

  const eventsByCoproprietaire = sortedEvents.reduce<Record<string, AdminCoproFinancialEventRow[]>>((acc, event) => {
    if (!event.coproprietaire_id) return acc;
    acc[event.coproprietaire_id] = [...(acc[event.coproprietaire_id] ?? []), event];
    return acc;
  }, {});

  return {
    debiteurCount,
    creditorCount,
    totalDebiteur,
    totalCrediteur,
    totalEvents: sortedEvents.length,
    latestEvents: sortedEvents.slice(0, Math.max(1, maxEvents)),
    eventsByCoproprietaire,
    typeCounts,
  };
}
