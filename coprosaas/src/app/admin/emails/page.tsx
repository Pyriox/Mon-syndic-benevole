// ============================================================
// Admin — Emails (journal Resend)
// Lecture seule — 100 derniers emails envoyés via Resend
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-config';
import { Resend } from 'resend';
import { Mail, CheckCircle2, XCircle, Clock, ExternalLink, MousePointerClick, Eye } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

interface ResendEmail {
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  last_event: string;
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function EventBadge({ event }: { event: string }) {
  const cfgs: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    delivered:  { label: 'Livré',   cls: 'bg-green-50 text-green-700 border-green-200',   icon: <CheckCircle2 size={11} /> },
    opened:     { label: 'Ouvert',  cls: 'bg-blue-50 text-blue-700 border-blue-200',       icon: <Eye size={11} /> },
    clicked:    { label: 'Cliqué',  cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <MousePointerClick size={11} /> },
    bounced:    { label: 'Rebond',  cls: 'bg-red-50 text-red-700 border-red-200',          icon: <XCircle size={11} /> },
    complained: { label: 'Spam',    cls: 'bg-red-50 text-red-700 border-red-200',          icon: <XCircle size={11} /> },
    failed:     { label: 'Échec',   cls: 'bg-red-50 text-red-700 border-red-200',          icon: <XCircle size={11} /> },
    sent:       { label: 'Envoyé',  cls: 'bg-gray-100 text-gray-600 border-gray-200',      icon: <Clock size={11} /> },
  };
  const cfg = cfgs[event] ?? { label: event, cls: 'bg-gray-100 text-gray-500 border-gray-200', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default async function AdminEmailsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  let emails: ResendEmail[] = [];
  let fetchError = '';
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.list({ limit: 100 });
    if (result.error) {
      fetchError = result.error.message;
    } else {
      emails = (result.data?.data ?? []) as unknown as ResendEmail[];
    }
  } catch (e) {
    fetchError = String(e);
  }

  const nbDelivered  = emails.filter((e) => e.last_event === 'delivered' || e.last_event === 'opened' || e.last_event === 'clicked').length;
  const nbBounced    = emails.filter((e) => e.last_event === 'bounced' || e.last_event === 'complained').length;
  const nbFailed     = emails.filter((e) => e.last_event === 'failed').length;
  const deliveryRate = emails.length > 0 ? Math.round((nbDelivered / emails.length) * 100) : 0;

  const admin = createAdminClient();
  const { data: internalDeliveries } = await admin
    .from('email_deliveries')
    .select('id, status, retry_count, next_retry_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const internalBounces = (internalDeliveries ?? []).filter((r) => r.status === 'bounced').length;
  const internalComplaints = (internalDeliveries ?? []).filter((r) => r.status === 'complained').length;
  const internalFailed = (internalDeliveries ?? []).filter((r) => r.status === 'failed').length;
  const internalRetryPending = (internalDeliveries ?? []).filter((r) => !!r.next_retry_at).length;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Emails envoyés</h1>
          <p className="text-sm text-gray-500 mt-1">100 derniers emails via Resend — données en lecture seule.</p>
        </div>
        <a
          href="https://resend.com/emails"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Ouvrir Resend <ExternalLink size={12} />
        </a>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Emails chargés',    value: emails.length,        icon: Mail,         color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Taux de livraison', value: `${deliveryRate} %`,  icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
          { label: 'Rebonds / spam',    value: nbBounced,            icon: XCircle,      color: nbBounced > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400' },
          { label: 'Échecs envoi',      value: nbFailed,             icon: XCircle,      color: nbFailed > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color} shrink-0`}><Icon size={18} /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Observabilite interne (preuves + retries)</h2>
          <a href="/dashboard/notifications/preuves-email" className="text-xs text-blue-600 hover:text-blue-800">Voir les preuves</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-600">Bounces</p>
            <p className="font-semibold text-red-700">{internalBounces}</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-600">Plaintes</p>
            <p className="font-semibold text-red-700">{internalComplaints}</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-600">Echecs</p>
            <p className="font-semibold text-red-700">{internalFailed}</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs text-amber-700">Retries en attente</p>
            <p className="font-semibold text-amber-700">{internalRetryPending}</p>
          </div>
        </div>
      </div>

      {fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-medium">Impossible de charger les emails Resend</p>
          <p className="text-xs text-red-500 mt-1">{fetchError}</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">Aucun email trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinataire</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Sujet</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Expéditeur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emails.map((email) => {
                const isFailed = email.last_event === 'bounced' || email.last_event === 'complained' || email.last_event === 'failed';
                return (
                  <tr key={email.id} className={`hover:bg-gray-50 transition-colors ${isFailed ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 truncate max-w-[180px]">{email.to.join(', ')}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-gray-700 truncate max-w-[240px]">{email.subject}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-500 truncate max-w-[160px]">{email.from}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{fmtDate(email.created_at)}</td>
                    <td className="px-4 py-3"><EventBadge event={email.last_event} /></td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://resend.com/emails/${email.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Voir dans Resend"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
