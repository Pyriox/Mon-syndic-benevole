import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminSearch from '../AdminSearch';
import AdminPagination from '../AdminPagination';
import { isAdminUser } from '@/lib/admin-config';

type DeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

type DeliveryRow = {
  id: string;
  template_key: string;
  status: DeliveryStatus;
  recipient_email: string;
  subject: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  failed_at: string | null;
  complained_at: string | null;
  last_error: string | null;
  retry_count: number;
};

const ALL_STATUSES: DeliveryStatus[] = [
  'queued',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'complained',
  'failed',
];

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: DeliveryStatus): string {
  switch (status) {
    case 'queued': return 'Queue';
    case 'sent': return 'Envoye';
    case 'delivered': return 'Livre';
    case 'opened': return 'Ouvert';
    case 'clicked': return 'Clique';
    case 'bounced': return 'Bounce';
    case 'complained': return 'Plainte';
    case 'failed': return 'Echec';
  }
}

function statusClass(status: DeliveryStatus): string {
  switch (status) {
    case 'queued': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'opened': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'clicked': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'bounced': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'complained': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'failed': return 'bg-red-50 text-red-700 border-red-200';
  }
}

function makeHref(params: URLSearchParams, key: string, value?: string): string {
  const next = new URLSearchParams(params.toString());
  if (!value || value === 'all') next.delete(key);
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
  const statusFilter = ALL_STATUSES.includes((status ?? '') as DeliveryStatus)
    ? (status as DeliveryStatus)
    : 'all';
  const currentPage = Math.max(1, Number(page) || 1);
  const PAGE_SIZE = 40;

  const admin = createAdminClient();

  let base = admin
    .from('email_deliveries')
    .select(
      'id, template_key, status, recipient_email, subject, created_at, sent_at, delivered_at, opened_at, clicked_at, bounced_at, failed_at, complained_at, last_error, retry_count',
      { count: 'exact' },
    );

  if (statusFilter !== 'all') {
    base = base.eq('status', statusFilter);
  }
  if (query) {
    const safe = query.replace(/[%]/g, '').replace(/,/g, ' ');
    base = base.or(`recipient_email.ilike.%${safe}%,subject.ilike.%${safe}%,template_key.ilike.%${safe}%`);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count } = await base.order('created_at', { ascending: false }).range(from, to);

  const rows = (data ?? []) as DeliveryRow[];
  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (statusFilter !== 'all') params.set('status', statusFilter);

  const prev = new URLSearchParams(params.toString());
  prev.set('page', String(Math.max(1, currentPage - 1)));
  const next = new URLSearchParams(params.toString());
  next.set('page', String(Math.min(totalPages, currentPage + 1)));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Suivi des e-mails</h1>
          <p className="text-xs text-gray-500 mt-0.5">Historique de diffusion et delivrabilite (Resend + app)</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="w-full sm:w-96">
          <AdminSearch placeholder="Email, sujet, template..." defaultValue={query} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={makeHref(params, 'status', 'all')}
            className={`px-2.5 py-1 text-xs rounded-full border ${statusFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            Tous
          </Link>
          {ALL_STATUSES.map((s) => (
            <Link
              key={s}
              href={makeHref(params, 'status', s)}
              className={`px-2.5 py-1 text-xs rounded-full border ${statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              {statusLabel(s)}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinataire</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sujet</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Template</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cree le</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Evenement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/70">
                  <td className="px-3 py-2 align-top">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${statusClass(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-gray-700">{row.recipient_email}</td>
                  <td className="px-3 py-2 align-top text-gray-800 max-w-[360px] truncate" title={row.subject ?? ''}>{row.subject ?? '—'}</td>
                  <td className="px-3 py-2 align-top text-gray-600 font-mono text-xs">{row.template_key}</td>
                  <td className="px-3 py-2 align-top text-gray-600 whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                  <td className="px-3 py-2 align-top text-gray-600 text-xs">
                    {row.complained_at
                      ? `Plainte: ${formatDateTime(row.complained_at)}`
                      : row.bounced_at
                        ? `Bounce: ${formatDateTime(row.bounced_at)}`
                        : row.failed_at
                          ? `Echec: ${formatDateTime(row.failed_at)}`
                          : row.clicked_at
                            ? `Clique: ${formatDateTime(row.clicked_at)}`
                            : row.opened_at
                              ? `Ouvert: ${formatDateTime(row.opened_at)}`
                              : row.delivered_at
                                ? `Livre: ${formatDateTime(row.delivered_at)}`
                                : row.sent_at
                                  ? `Envoye: ${formatDateTime(row.sent_at)}`
                                  : '—'}
                    {row.last_error ? <p className="text-red-600 mt-1">{row.last_error}</p> : null}
                    {row.retry_count > 0 ? <p className="text-amber-700 mt-1">Retries: {row.retry_count}</p> : null}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">Aucun e-mail pour ce filtre.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        prevHref={`/admin/emails?${prev.toString()}`}
        nextHref={`/admin/emails?${next.toString()}`}
      />
    </div>
  );
}