import Link from 'next/link';
import { formatAdminDateTime } from '@/lib/admin-format';
import { buildAdminPath } from '@/lib/admin-list-params';

export type AdminUserEvent = {
  id: string;
  event_type: string;
  label: string;
  severity?: 'info' | 'warning' | 'error' | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  account_confirmed: { icon: '✓', label: 'Compte vérifié', color: 'text-green-600 bg-green-50 border-green-200' },
  user_registered: { icon: '🆕', label: 'Inscription', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  login_success: { icon: '→', label: 'Connexion', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  login_failed: { icon: '⚠', label: 'Connexion échouée', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  password_reset_requested: { icon: '🔑', label: 'Réinit. mot de passe', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  email_confirmation_resent: { icon: '✉', label: 'Email de confirmation renvoyé', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  trial_started: { icon: '↗', label: 'Essai démarré', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  subscription_created: { icon: '↑', label: 'Abonnement activé', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  subscription_cancelled: { icon: '↓', label: 'Résiliation', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  payment_succeeded: { icon: '✓', label: 'Paiement réussi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  payment_failed: { icon: '✗', label: 'Paiement échoué', color: 'text-red-600 bg-red-50 border-red-200' },
  ticket_created: { icon: '✉', label: 'Ticket ouvert', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  copropriete_created: { icon: '🏢', label: 'Copropriété créée', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  appel_fonds_created: { icon: '📋', label: 'Appel de fonds créé', color: 'text-teal-600 bg-teal-50 border-teal-200' },
  appel_fonds_status_changed: { icon: '⇄', label: 'Statut appel de fonds modifié', color: 'text-teal-700 bg-teal-50 border-teal-200' },
  appel_fonds_deleted: { icon: '🗑️', label: 'Appel de fonds supprimé', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  ag_created: { icon: '🗳️', label: 'AG créée', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  ag_status_changed: { icon: '⇄', label: 'Statut AG modifié', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  coproprietaire_added: { icon: '👤', label: 'Copropriétaire ajouté', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  coproprietaire_updated: { icon: '✎', label: 'Copropriétaire modifié', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  coproprietaire_deleted: { icon: '🗑️', label: 'Copropriétaire supprimé', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  document_added: { icon: '📎', label: 'Document ajouté', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  document_updated: { icon: '✎', label: 'Document modifié', color: 'text-slate-700 bg-slate-50 border-slate-200' },
  document_deleted: { icon: '🗑️', label: 'Document supprimé', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  lot_added: { icon: '▣', label: 'Lot ajouté', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  lot_updated: { icon: '✎', label: 'Lot modifié', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  lot_deleted: { icon: '🗑️', label: 'Lot supprimé', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  paiement_confirme: { icon: '✔', label: 'Paiement reçu', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  paiement_annule: { icon: '↺', label: 'Paiement annulé', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  copropriete_updated: { icon: '🏢', label: 'Copropriété modifiée', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  admin_user_deleted: { icon: '🛑', label: 'Compte supprimé (admin)', color: 'text-red-700 bg-red-50 border-red-200' },
  admin_resend_confirmation: { icon: '✉', label: 'Confirmation renvoyée (admin)', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  admin_force_confirm: { icon: '✓', label: 'Compte vérifié manuellement', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  admin_invitation_cancelled: { icon: '⊘', label: 'Invitation annulée (admin)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  admin_role_revoked: { icon: '↓', label: 'Droits admin retirés', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  admin_role_granted: { icon: '↑', label: 'Droits admin accordés', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  admin_user_updated: { icon: '✎', label: 'Utilisateur modifié (admin)', color: 'text-slate-700 bg-slate-50 border-slate-200' },
  admin_invitation_deleted: { icon: '🗑', label: 'Invitation supprimée (admin)', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  admin_syndic_reassigned: { icon: '⇆', label: 'Syndic réassigné (admin)', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  admin_copro_updated: { icon: '🏢', label: 'Copropriété modifiée (admin)', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  admin_impersonation_link_created: { icon: '🔐', label: 'Lien d’impersonation généré', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  admin_coproprietaire_updated: { icon: '👤', label: 'Copropriétaire modifié (admin)', color: 'text-teal-700 bg-teal-50 border-teal-200' },
  onboarding_copro_reminder_j2_sent: { icon: '✉', label: 'Email relance J+2', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  onboarding_copro_reminder_j7_sent: { icon: '✉', label: 'Email relance J+7', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  onboarding_copro_reminder_j21_sent: { icon: '↺', label: 'Email réactivation J+21', color: 'text-orange-600 bg-orange-50 border-orange-200' },
};

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-gray-300',
  warning: 'bg-amber-400',
  error: 'bg-red-500',
};

/** Renvoie true si la valeur est un tableau ne contenant que des UUID (pas utile à afficher). */
function isUuidArray(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0 && (v as unknown[]).every(isUuid);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): boolean {
  return typeof v === 'string' && UUID_RE.test(v.trim());
}

/** Clés dont la valeur est un identifiant sans utilité dans l'affichage. */
const SKIP_PLAIN_KEYS = new Set(['id', 'coproid', 'copropriete_id', 'coproprietaireid', 'coproprietaireld', 'lot_id', 'appel_id', 'session_id']);

function formatMetaValue(v: unknown, maxLen = 80): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v.length > maxLen ? `${v.slice(0, maxLen)}…` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    const s = JSON.stringify(v);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  } catch {
    return String(v);
  }
}

type DiffEntry = { key: string; oldVal: string; newVal: string };
type PlainEntry = { key: string; val: string };

function parseMetadataEntries(metadata: Record<string, unknown>): {
  diff: DiffEntry[];
  plain: PlainEntry[];
} {
  const { before, after, ...rest } = metadata;
  const diff: DiffEntry[] = [];
  const plain: PlainEntry[] = [];

  if (before && after && typeof before === 'object' && typeof after === 'object') {
    const b = before as Record<string, unknown>;
    const a = after as Record<string, unknown>;
    const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
    for (const k of keys) {
      // Ignorer les clés id (jamais significatives dans un diff)
      if (k === 'id') continue;
      if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) {
        // Masquer les champs dont les deux valeurs sont des tableaux de UUID
        if (isUuidArray(b[k]) && isUuidArray(a[k])) continue;
        diff.push({ key: k, oldVal: formatMetaValue(b[k]), newVal: formatMetaValue(a[k]) });
      }
    }
    // Si rien n'a changé (before === after), on ne montre rien
  } else {
    if (before !== undefined) plain.push({ key: 'before', val: formatMetaValue(before) });
    if (after !== undefined) plain.push({ key: 'after', val: formatMetaValue(after) });
  }

  for (const [k, v] of Object.entries(rest)) {
    // Ignorer les clés d'identifiant pur et les valeurs UUID isolées
    if (SKIP_PLAIN_KEYS.has(k.toLowerCase())) continue;
    if (isUuid(v)) continue;
    plain.push({ key: k, val: formatMetaValue(v) });
  }

  return { diff, plain };
}

interface Props {
  events: AdminUserEvent[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  basePath: string;
  pageParamName?: string;
  pageSize?: number;
  queryParams?: Record<string, string | null | undefined>;
  emptyMessage?: string;
}

export default function AdminUserEventTimeline({
  events,
  currentPage,
  totalPages,
  totalItems,
  basePath,
  pageParamName = 'logPage',
  pageSize = 10,
  queryParams = {},
  emptyMessage = 'Aucun événement.',
}: Props) {
  if (events.length === 0) {
    return <p className="px-4 py-6 text-sm text-gray-400">{emptyMessage}</p>;
  }

  const buildHref = (page: number) => buildAdminPath(basePath, {
    ...queryParams,
    [pageParamName]: page > 1 ? String(page) : undefined,
  });

  return (
    <div>
      <ol className="relative border-l border-gray-200 ml-6 mr-4 my-4 space-y-4">
        {events.map((event) => {
          const meta = EVENT_META[event.event_type];
          const dot = SEVERITY_DOT[event.severity ?? 'info'] ?? SEVERITY_DOT.info;

          return (
            <li key={event.id} className="ml-4">
              <div className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${dot}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded px-1.5 py-0.5 ${meta?.color ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                    {meta?.icon ?? '·'} {meta?.label ?? event.event_type}
                  </span>
                  <p className="text-xs text-gray-500 mt-1 break-words">{event.label || event.event_type}</p>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (() => {
                    const { diff, plain } = parseMetadataEntries(event.metadata);
                    return (
                      <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        {diff.map(({ key, oldVal, newVal }) => (
                          <div key={key} className="flex items-baseline gap-1 text-[10px] text-gray-400">
                            <dt className="font-medium text-gray-500">{key}</dt>
                            <dd className="font-mono">
                              <span className="line-through text-red-400">{oldVal}</span>
                              <span className="mx-0.5 text-gray-400">→</span>
                              <span className="text-emerald-600">{newVal}</span>
                            </dd>
                          </div>
                        ))}
                        {plain.map(({ key, val }) => (
                          <div key={key} className="flex items-baseline gap-1 text-[10px] text-gray-400">
                            <dt className="font-medium text-gray-500">{key}</dt>
                            <dd className="font-mono truncate max-w-[160px]">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    );
                  })()}
                </div>
                <p className="text-[11px] text-gray-400 shrink-0 mt-0.5 tabular-nums">{formatAdminDateTime(event.created_at)}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <p>
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} sur {totalItems} · page {currentPage}/{totalPages}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link href={buildHref(currentPage - 1)} className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">
                Précédent
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded border border-gray-200 opacity-40">Précédent</span>
            )}
            {currentPage < totalPages ? (
              <Link href={buildHref(currentPage + 1)} className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">
                Suivant
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded border border-gray-200 opacity-40">Suivant</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
