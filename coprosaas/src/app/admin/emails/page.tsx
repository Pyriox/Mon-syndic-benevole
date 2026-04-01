import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import AdminSearch from '../AdminSearch';
import { isAdminUser } from '@/lib/admin-config';

type DeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed'
  | 'unknown';

type ResendEmailRow = {
  id: string;
  status: DeliveryStatus;
  lastEvent: string | null;
  recipients: string[];
  subject: string | null;
  created_at: string;
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
  'unknown',
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
    case 'unknown': return 'Inconnu';
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
    case 'unknown': return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function mapProviderEventToStatus(event: string | null | undefined): DeliveryStatus | null {
  if (!event) return null;
  const normalized = event.toLowerCase();
  if (normalized.includes('delivered')) return 'delivered';
  if (normalized.includes('opened') || normalized.includes('open')) return 'opened';
  if (normalized.includes('clicked') || normalized.includes('click')) return 'clicked';
  if (normalized.includes('bounced') || normalized.includes('bounce')) return 'bounced';
  if (normalized.includes('complained') || normalized.includes('complaint')) return 'complained';
  if (normalized.includes('suppressed')) return 'failed';
  if (normalized.includes('delivery_delayed') || normalized.includes('delayed') || normalized.includes('scheduled') || normalized.includes('queued')) return 'queued';
  if (normalized.includes('canceled') || normalized.includes('cancelled')) return 'failed';
  if (normalized.includes('failed') || normalized.includes('fail')) return 'failed';
  if (normalized.includes('sent')) return 'sent';
  if (normalized.includes('processing')) return 'queued';
  return null;
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
  searchParams: Promise<{ q?: string; status?: string; page?: string; after?: string; before?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/login');

  const { q, status, page, after, before } = await searchParams;
  const query = q?.trim() ?? '';
  const statusFilter = ALL_STATUSES.includes((status ?? '') as DeliveryStatus)
    ? (status as DeliveryStatus)
    : 'all';
  const currentPage = Math.max(1, Number(page) || 1);
  const PAGE_SIZE = 20;

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (!resend) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Suivi des e-mails</h1>
        <div className="bg-white rounded-xl border border-red-200 p-4 text-sm text-red-700">
          RESEND_API_KEY manquante. Impossible de charger les e-mails via l'API Resend.
        </div>
      </div>
    );
  }

  const listResponse = await resend.emails.list(
    after
      ? { limit: PAGE_SIZE, after }
      : before
        ? { limit: PAGE_SIZE, before }
        : { limit: PAGE_SIZE },
  );
  const apiRows = (listResponse.data?.data ?? []) as Array<{
    id: string;
    to: string[];
    subject: string;
    created_at: string;
    last_event: string;
  }>;

  const normalizedRows: ResendEmailRow[] = apiRows.map((row) => ({
    id: row.id,
    recipients: Array.isArray(row.to) ? row.to : [],
    subject: row.subject ?? null,
    created_at: row.created_at,
    lastEvent: row.last_event ?? null,
    status: mapProviderEventToStatus(row.last_event) ?? 'unknown',
  }));

  const queryLower = query.toLowerCase();
  const queryFilteredRows = query
    ? normalizedRows.filter((row) => {
        const recipientsText = row.recipients.join(', ').toLowerCase();
        const subjectText = (row.subject ?? '').toLowerCase();
        return recipientsText.includes(queryLower)
          || subjectText.includes(queryLower)
          || row.id.toLowerCase().includes(queryLower)
          || (row.lastEvent ?? '').toLowerCase().includes(queryLower);
      })
    : normalizedRows;

  const filteredRows = statusFilter === 'all'
    ? queryFilteredRows
    : queryFilteredRows.filter((row) => row.status === statusFilter);

  const firstRowId = normalizedRows[0]?.id;
  const lastRowId = normalizedRows[normalizedRows.length - 1]?.id;
  const hasMore = Boolean(listResponse.data?.has_more);

  const prevEnabled = Boolean(after || before) && Boolean(firstRowId);
  const nextEnabled = hasMore && Boolean(lastRowId);

  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (statusFilter !== 'all') params.set('status', statusFilter);

  const prev = new URLSearchParams(params.toString());
  prev.set('page', String(Math.max(1, currentPage - 1)));
  if (firstRowId) {
    prev.set('before', firstRowId);
    prev.delete('after');
  }

  const next = new URLSearchParams(params.toString());
  next.set('page', String(currentPage + 1));
  if (lastRowId) {
    next.set('after', lastRowId);
    next.delete('before');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Suivi des e-mails</h1>
          <p className="text-xs text-gray-500 mt-0.5">Source unique: API Resend (sans base locale)</p>
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
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email ID</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cree le</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dernier evenement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/70">
                  <td className="px-3 py-2 align-top">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${statusClass(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-gray-700">{row.recipients.join(', ') || '—'}</td>
                  <td className="px-3 py-2 align-top text-gray-800 max-w-[360px] truncate" title={row.subject ?? ''}>{row.subject ?? '—'}</td>
                  <td className="px-3 py-2 align-top text-gray-600 font-mono text-xs">{row.id}</td>
                  <td className="px-3 py-2 align-top text-gray-600 whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                  <td className="px-3 py-2 align-top text-gray-600 text-xs">
                    {row.lastEvent ?? 'unknown'}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">Aucun e-mail pour ce filtre.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 gap-2">
        <p>{filteredRows.length} e-mail(s) charges (page {currentPage}, limite {PAGE_SIZE})</p>
        <div className="flex items-center gap-2">
          {prevEnabled ? (
            <Link href={`/admin/emails?${prev.toString()}`} className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">
              Precedent
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded border border-gray-200 opacity-40">Precedent</span>
          )}
          {nextEnabled ? (
            <Link href={`/admin/emails?${next.toString()}`} className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">
              Suivant
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded border border-gray-200 opacity-40">Suivant</span>
          )}
        </div>
      </div>
    </div>
  );
}