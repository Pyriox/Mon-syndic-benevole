import type { SupabaseClient } from '@supabase/supabase-js';

export type CoproprietaireBalanceSourceType =
  | 'manual_adjustment'
  | 'solde_initial'
  | 'opening_balance'
  | 'appel_publication'
  | 'appel_suppression'
  | 'payment_received'
  | 'payment_cancelled'
  | 'regularisation_closure';

export type CoproprietaireBalanceAccountType = 'principal' | 'fonds_travaux' | 'regularisation' | 'mixte';

type RpcCapableClient = Pick<SupabaseClient, 'rpc'>;

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveAppelBalanceAccountType(appel: {
  type_appel?: string | null;
  montant_fonds_travaux?: number | null;
}): CoproprietaireBalanceAccountType {
  if (appel.type_appel === 'fonds_travaux') return 'fonds_travaux';
  if ((appel.montant_fonds_travaux ?? 0) > 0) return 'mixte';
  return 'principal';
}

interface ApplyBalanceDeltaParams {
  coproprietaireId: string;
  delta: number;
  label: string;
  sourceType: CoproprietaireBalanceSourceType;
  effectiveDate?: string | null;
  reason?: string | null;
  accountType?: CoproprietaireBalanceAccountType;
  sourceId?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}

export async function applyCoproprietaireBalanceDelta(
  supabase: RpcCapableClient,
  {
    coproprietaireId,
    delta,
    label,
    sourceType,
    effectiveDate,
    reason,
    accountType = 'principal',
    sourceId,
    metadata,
    createdBy,
  }: ApplyBalanceDeltaParams,
) {
  return supabase.rpc('apply_coproprietaire_balance_delta', {
    p_coproprietaire_id: coproprietaireId,
    p_delta: roundToCents(delta),
    p_label: label,
    p_source_type: sourceType,
    p_effective_date: effectiveDate ?? null,
    p_reason: reason?.trim() ? reason.trim() : null,
    p_account_type: accountType,
    p_source_id: sourceId ?? null,
    p_metadata: metadata ?? {},
    p_created_by: createdBy ?? null,
  });
}

interface SetManualBalanceParams {
  coproprietaireId: string;
  newBalance: number;
  reason: string;
  effectiveDate?: string | null;
  label?: string;
  accountType?: CoproprietaireBalanceAccountType;
  sourceType?: Extract<CoproprietaireBalanceSourceType, 'manual_adjustment' | 'solde_initial'>;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}

export async function setCoproprietaireBalanceManually(
  supabase: RpcCapableClient,
  {
    coproprietaireId,
    newBalance,
    reason,
    effectiveDate,
    label = 'Ajustement manuel du solde',
    accountType = 'principal',
    sourceType = 'manual_adjustment',
    metadata,
    createdBy,
  }: SetManualBalanceParams,
) {
  return supabase.rpc('set_coproprietaire_balance_manually', {
    p_coproprietaire_id: coproprietaireId,
    p_new_balance: roundToCents(newBalance),
    p_reason: reason.trim(),
    p_effective_date: effectiveDate ?? null,
    p_label: label,
    p_account_type: accountType,
    p_source_type: sourceType,
    p_metadata: metadata ?? {},
    p_created_by: createdBy ?? null,
  });
}
