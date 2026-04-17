import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MailCheck,
  Send,
  ShieldAlert,
} from 'lucide-react';

import AdminPagination from '../AdminPagination';
import AdminEmailRetryButton from '../AdminEmailRetryButton';
import AdminSearch from '../AdminSearch';
import AdminStatCard from '../AdminStatCard';
import { isAdminUser } from '@/lib/admin-config';
import { backfillEmailDeliveriesFromResend, syncEmailDeliveriesWithResend, type EmailDeliveryStatus } from '@/lib/email-delivery';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils';

type DeliveryStatusFilter = EmailDeliveryStatus | 'all';

type EmailDeliveryRow = {
  id: string;
  provider_message_id: string | null;
  template_key: string;
  status: EmailDeliveryStatus;
  recipient_email: string;
  recipient_user_id: string | null;
  copropriete_id: string | null;
  ag_id: string | null;
  subject: string | null;
  legal_event_type: string | null;
  legal_reference: string | null;
  created_at: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  failed_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  last_error: string | null;
  next_retry_at: string | null;
};

type RecentStatusRow = {
  id: string;
  status: EmailDeliveryStatus;
  created_at: string;
};

type IncidentSummaryRow = {
  id: string;
  status: EmailDeliveryStatus;
  recipient_email: string;
  subject: string | null;
  template_key: string;
  last_error: string | null;
  created_at: string;
};

type CoproLookupRow = {
  id: string;
  nom: string | null;
};

type ProfileLookupRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const ALL_STATUSES: EmailDeliveryStatus[] = [
  'queued',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'complained',
  'failed',
];

const TROUBLE_STATUSES = new Set<EmailDeliveryStatus>(['failed', 'bounced', 'complained']);
const PENDING_STATUSES = new Set<EmailDeliveryStatus>(['queued', 'sent']);

function isOnOrAfter(value: string | null, thresholdMs: number): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed >= thresholdMs;
}

function statusLabel(status: DeliveryStatusFilter): string {
  switch (status) {
    case 'queued': return 'En file';
    case 'sent': return 'Envoyé';
    case 'delivered': return 'Livré';
    case 'opened': return 'Ouvert';
    case 'clicked': return 'Cliqué';
    case 'bounced': return 'Bounce';
    case 'complained': return 'Plainte';
    case 'failed': return 'Échec';
    case 'all':
    default:
      return 'Tous';
  }
}

function statusClass(status: DeliveryStatusFilter): string {
  switch (status) {
    case 'queued': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'sent': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'opened': return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'clicked': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'bounced': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'complained': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'failed': return 'bg-red-50 text-red-700 border-red-200';
    case 'all':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function statusFilterClass(status: DeliveryStatusFilter, isActive: boolean): string {
  if (status === 'all') {
    return isActive
      ? 'bg-gray-900 text-white border-gray-900'
      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300';
  }

  const tone = statusClass(status);
  const outline = tone.replace(/bg-[^ ]+/, 'bg-white');
  return isActive ? tone : `${outline} hover:opacity-80`;
}

function templateLabel(templateKey: string | null): string {
  if (!templateKey) return 'Email transactionnel';

  const labels: Record<string, string> = {
    ag_convocation: 'Convocation AG',
    ag_convocation_reminder_j14: 'Relance convocation J-14',
    ag_convocation_reminder_j7: 'Relance convocation J-7',
    ag_convocation_unopened_relance: 'Relance convocation non ouverte',
    ag_pv: 'Procès-verbal AG',
    ag_ended_syndic_notification: 'Notification fin d’AG',
    invitation: 'Invitation copropriétaire',
    signup_confirmation: 'Confirmation de compte',
    resend_import: 'Email Resend importé',
    support_reply: 'Réponse support',
    support_client_reply_notification: 'Réponse client support',
    welcome: 'Bienvenue / confirmation',
    password_reset: 'Réinitialisation mot de passe',
    appel_avis: 'Avis d’appel de fonds',
    appel_rappel: 'Rappel d’appel de fonds J-7',
    appel_rappel_j1: 'Relance d’appel de fonds J+1',
    appel_mise_en_demeure: 'Rappel d’impayé appel de fonds',
    appel_syndic_impayes_j0: 'Récapitulatif syndic des impayés J0',
    appel_brouillon_rappel: 'Rappel brouillon appel de fonds',
    incident_resolved: 'Incident résolu',
    contact_notification: 'Notification formulaire contact',
    subscription_trial_ending_j3: 'Fin d’essai J-3',
    subscription_cancelled: 'Abonnement résilié',
    subscription_payment_failed: 'Paiement échoué',
  };

  return labels[templateKey] ?? templateKey.replace(/_/g, ' ');
}

function makeHref(params: URLSearchParams, key: string, value?: string): string {
  const next = new URLSearchParams(params.toString());
  if (!value || (key === 'status' && value === 'all')) next.delete(key);
  else next.set(key, value);
  if (key !== 'page') next.delete('page');
  const query = next.toString();
  return query ? `/admin/emails?${query}` : '/admin/emails';
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/login');

  const { q, status, page } = await searchParams;
  const query = q?.trim() ?? '';
  const statusFilter = ALL_STATUSES.includes((status ?? '') as EmailDeliveryStatus)
    ? (status as EmailDeliveryStatus)
    : 'all';
  const currentPage = Math.max(1, Number(page) || 1);
  const PAGE_SIZE = 25;

  const admin = createAdminClient();

  await backfillEmailDeliveriesFromResend({
    limit: 100,
    searchQuery: query || undefined,
  });

  const { data: syncCandidates } = await admin
    .from('email_deliveries')
    .select('id, provider_message_id, status')
    .not('provider_message_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(40);

  await syncEmailDeliveriesWithResend(
    ((syncCandidates ?? []) as Array<{ id: string; provider_message_id: string | null; status: EmailDeliveryStatus }>).map((row) => ({
      id: row.id,
      providerMessageId: row.provider_message_id,
      status: row.status,
    }))
  );

  const searchClause = query
    ? `recipient_email.ilike.%${query}%,subject.ilike.%${query}%,template_key.ilike.%${query}%,legal_event_type.ilike.%${query}%,legal_reference.ilike.%${query}%,provider_message_id.ilike.%${query}%`
    : null;

  let countQuery = admin.from('email_deliveries').select('id', { count: 'exact', head: true });
  if (statusFilter !== 'all') countQuery = countQuery.eq('status', statusFilter);
  if (searchClause) countQuery = countQuery.or(searchClause);

  const { count } = await countQuery;
  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const rangeStart = (safePage - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;

  let pageQuery = admin
    .from('email_deliveries')
    .select('id, provider_message_id, template_key, status, recipient_email, recipient_user_id, copropriete_id, ag_id, subject, legal_event_type, legal_reference, created_at, sent_at, opened_at, clicked_at, failed_at, bounced_at, complained_at, last_error, next_retry_at')
    .order('created_at', { ascending: false })
    .range(rangeStart, rangeEnd);
  if (statusFilter !== 'all') pageQuery = pageQuery.eq('status', statusFilter);
  if (searchClause) pageQuery = pageQuery.or(searchClause);

  const [pageResult, recentResult, incidentsResult] = await Promise.all([
    pageQuery,
    admin
      .from('email_deliveries')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(250),
    admin
      .from('email_deliveries')
      .select('id, status, recipient_email, subject, template_key, last_error, created_at')
      .in('status', ['failed', 'bounced', 'complained'])
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const pageRows = (pageResult.data ?? []) as EmailDeliveryRow[];
  const recentRows = (recentResult.data ?? []) as RecentStatusRow[];
  const incidentRows = (incidentsResult.data ?? []) as IncidentSummaryRow[];

  const coproIds = [...new Set(pageRows.map((row) => row.copropriete_id).filter(Boolean) as string[])];
  const userIds = [...new Set(pageRows.map((row) => row.recipient_user_id).filter(Boolean) as string[])];

  const [coproLookupRows, profileLookupRows] = await Promise.all([
    coproIds.length > 0
      ? admin.from('coproprietes').select('id, nom').in('id', coproIds)
      : Promise.resolve({ data: [] as CoproLookupRow[] }),
    userIds.length > 0
      ? admin.from('profiles').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] as ProfileLookupRow[] }),
  ]);

  const coproNameById = new Map((coproLookupRows.data ?? []).map((item) => [item.id, item.nom ?? 'Copropriété']));
  const profileById = new Map((profileLookupRows.data ?? []).map((item) => [item.id, item]));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7dMs = sevenDaysAgo.getTime();

  const actionNeeded7d = recentRows.filter((row) => TROUBLE_STATUSES.has(row.status) && isOnOrAfter(row.created_at, last7dMs)).length;
  const pending7d = recentRows.filter((row) => PENDING_STATUSES.has(row.status) && isOnOrAfter(row.created_at, last7dMs)).length;
  const engagement7d = recentRows.filter((row) => (row.status === 'opened' || row.status === 'clicked') && isOnOrAfter(row.created_at, last7dMs)).length;
  const lastTrackedAt = recentRows[0]?.created_at ?? pageRows[0]?.created_at ?? null;

  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (statusFilter !== 'all') params.set('status', statusFilter);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Suivi des e-mails</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Vue métier issue de <code>email_deliveries</code>, resynchronisée avec Resend pour les envois récents.
          </p>
        </div>
        <Link
          href="https://resend.com/emails"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Ouvrir Resend <ExternalLink size={14} />
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="À traiter (7 j)"
          value={actionNeeded7d}
          sub="Bounces, plaintes ou échecs récents"
          icon={ShieldAlert}
          color="bg-red-50 text-red-600"
          danger={actionNeeded7d > 0}
        />
        <AdminStatCard
          label="En attente (7 j)"
          value={pending7d}
          sub="Emails encore en file ou juste envoyés"
          icon={Send}
          color="bg-sky-50 text-sky-600"
        />
        <AdminStatCard
          label="Ouverts / cliqués (7 j)"
          value={engagement7d}
          sub="Signal d’engagement sur les envois suivis"
          icon={MailCheck}
          color="bg-emerald-50 text-emerald-600"
        />
        <AdminStatCard
          label="Historique filtré"
          value={totalItems}
          sub={lastTrackedAt ? `Dernier suivi : ${formatDateTime(lastTrackedAt)}` : 'Aucun événement suivi pour le moment'}
          icon={CheckCircle2}
          color="bg-violet-50 text-violet-600"
        />
      </section>

      {incidentRows.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700" />
            <h2 className="text-sm font-semibold text-amber-900">Derniers incidents de délivrabilité</h2>
          </div>
          <div className="mt-3 space-y-2">
            {incidentRows.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-white/70 px-3 py-2.5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{row.recipient_email}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-700">
                    {templateLabel(row.template_key)}{row.subject ? ` · ${row.subject}` : ''}
                  </p>
                  {row.last_error && <p className="mt-1 text-xs text-red-700">{row.last_error}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-xs text-gray-500">{formatDateTime(row.created_at)}</span>
                  {row.status === 'failed' && <AdminEmailRetryButton deliveryId={row.id} />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-96">
          <AdminSearch placeholder="Destinataire, sujet, template, référence…" defaultValue={query} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={makeHref(params, 'status', 'all')}
            className={`px-2.5 py-1 text-xs rounded-full border ${statusFilterClass('all', statusFilter === 'all')}`}
          >
            Tous
          </Link>
          {ALL_STATUSES.map((currentStatus) => (
            <Link
              key={currentStatus}
              href={makeHref(params, 'status', currentStatus)}
              className={`px-2.5 py-1 text-xs rounded-full border ${statusFilterClass(currentStatus, statusFilter === currentStatus)}`}
            >
              {statusLabel(currentStatus)}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Destinataire</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Contexte</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Détail</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Suivi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((row) => {
                const recipientProfile = row.recipient_user_id ? profileById.get(row.recipient_user_id) : null;
                const coproName = row.copropriete_id ? coproNameById.get(row.copropriete_id) : null;

                return (
                  <tr key={row.id} className="hover:bg-gray-50/70">
                    <td className="px-3 py-2 align-top">
                      <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${statusClass(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <p className="font-medium text-gray-900">{templateLabel(row.template_key)}</p>
                      <p className="text-xs text-gray-500">{row.legal_event_type ?? 'Envoi transactionnel'}</p>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <p className="text-gray-900">{recipientProfile?.full_name || row.recipient_email}</p>
                      {recipientProfile?.full_name && <p className="text-xs text-gray-500">{row.recipient_email}</p>}
                      {row.recipient_user_id && (
                        <Link href={`/admin/utilisateurs/${row.recipient_user_id}?from=emails`} className="mt-1 inline-flex text-xs text-blue-700 hover:text-blue-900 hover:underline">
                          Ouvrir la fiche utilisateur
                        </Link>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-gray-600">
                      <div className="space-y-1">
                        {row.copropriete_id && (
                          <div>
                            <span className="text-gray-500">Copropriété :</span>{' '}
                            <Link href={`/admin/coproprietes/${row.copropriete_id}`} className="text-blue-700 hover:text-blue-900 hover:underline">
                              {coproName ?? 'Ouvrir'}
                            </Link>
                          </div>
                        )}
                        {row.ag_id && (
                          <div>
                            <span className="text-gray-500">AG :</span>{' '}
                            <Link href={`/assemblees/${row.ag_id}`} className="text-blue-700 hover:text-blue-900 hover:underline">
                              Ouvrir l’assemblée
                            </Link>
                          </div>
                        )}
                        {!row.copropriete_id && !row.ag_id && !row.recipient_user_id && <span>—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-gray-600">
                      <p className="max-w-[320px] text-sm text-gray-800">{row.subject ?? '—'}</p>
                      {row.legal_reference && <p className="mt-1">Réf. {row.legal_reference}</p>}
                      {row.last_error ? (
                        <p className="mt-1 text-red-700">{row.last_error}</p>
                      ) : row.next_retry_at ? (
                        <p className="mt-1 text-amber-700">Relance possible : {formatDateTime(row.next_retry_at)}</p>
                      ) : (
                        <p className="mt-1 text-gray-500">Aucune erreur remontée</p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-gray-600">
                      <div className="space-y-1">
                        <p>Créé : {formatDateTime(row.created_at)}</p>
                        {row.sent_at && <p>Envoyé : {formatDateTime(row.sent_at)}</p>}
                        {row.opened_at && <p>Ouvert : {formatDateTime(row.opened_at)}</p>}
                        {row.clicked_at && <p>Cliqué : {formatDateTime(row.clicked_at)}</p>}
                        {row.provider_message_id && (
                          <a
                            href={`https://resend.com/emails/${row.provider_message_id}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            Voir dans Resend <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                    Aucun e-mail suivi pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        prevHref={makeHref(params, 'page', String(Math.max(1, safePage - 1)))}
        nextHref={makeHref(params, 'page', String(Math.min(totalPages, safePage + 1)))}
      />
    </div>
  );
}