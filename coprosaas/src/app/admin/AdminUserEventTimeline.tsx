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
};

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-gray-300',
  warning: 'bg-amber-400',
  error: 'bg-red-500',
};

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
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {Object.entries(event.metadata).map(([k, v]) => (
                        <div key={k} className="flex items-baseline gap-1 text-[10px] text-gray-400">
                          <dt className="font-medium text-gray-500">{k}</dt>
                          <dd className="font-mono truncate max-w-[160px]">{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
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
