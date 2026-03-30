import { createAdminClient } from '@/lib/supabase/admin';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    delivered: 'bg-green-50 text-green-700 border-green-200',
    opened: 'bg-blue-50 text-blue-700 border-blue-200',
    clicked: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    sent: 'bg-gray-100 text-gray-700 border-gray-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    bounced: 'bg-red-50 text-red-700 border-red-200',
    complained: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

export default async function EmailProofsPage() {
  const { selectedCoproId } = await requireCoproAccess(['syndic']);
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from('email_deliveries')
    .select('id, template_key, status, recipient_email, subject, sent_at, delivered_at, opened_at, bounced_at, complained_at, failed_at, retry_count, last_error, created_at')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .order('created_at', { ascending: false })
    .limit(300);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Preuves de remise email</h2>
        <p className="text-sm text-gray-500 mt-1">Qui a recu, quand, et avec quel statut de delivrabilite.</p>
      </div>

      {rows?.length ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Destinataire</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Horodatage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Erreur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(rows ?? []).map((r) => {
                const stamp = r.opened_at ?? r.delivered_at ?? r.sent_at ?? r.created_at;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.recipient_email}</div>
                      <div className="text-xs text-gray-500 truncate">{r.subject ?? '-'}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-700">{r.template_key}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-medium ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                      {r.retry_count > 0 && (
                        <span className="ml-2 text-xs text-gray-500">retry: {r.retry_count}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                      {stamp ? new Date(stamp).toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-red-600 max-w-sm truncate">
                      {r.last_error ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          Aucune preuve email disponible pour cette copropriete.
        </div>
      )}
    </div>
  );
}
