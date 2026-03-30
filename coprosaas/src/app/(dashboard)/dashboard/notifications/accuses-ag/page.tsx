import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';

type AGRow = {
  id: string;
  titre: string;
  date_ag: string;
  convocation_envoyee_le: string | null;
};

type DeliveryRow = {
  ag_id: string | null;
  recipient_email: string;
  status: string;
  delivered_at: string | null;
  opened_at: string | null;
};

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export default async function AGAccusesPage() {
  const { selectedCoproId } = await requireCoproAccess(['syndic']);
  const admin = createAdminClient();

  const { data: ags } = await admin
    .from('assemblees_generales')
    .select('id, titre, date_ag, convocation_envoyee_le')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .order('date_ag', { ascending: false })
    .limit(120);

  const agRows = (ags ?? []) as AGRow[];
  const agIds = agRows.map((a) => a.id);

  const { data: deliveries } = agIds.length > 0
    ? await admin
      .from('email_deliveries')
      .select('ag_id, recipient_email, status, delivered_at, opened_at')
      .eq('copropriete_id', selectedCoproId ?? 'none')
      .in('template_key', ['ag_convocation', 'ag_convocation_reminder_j14', 'ag_convocation_reminder_j7', 'ag_convocation_unopened_relance'])
      .in('ag_id', agIds)
    : { data: [] as DeliveryRow[] };

  const byAg = new Map<string, DeliveryRow[]>();
  for (const d of (deliveries ?? []) as DeliveryRow[]) {
    if (!d.ag_id) continue;
    if (!byAg.has(d.ag_id)) byAg.set(d.ag_id, []);
    byAg.get(d.ag_id)!.push(d);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Accuses de reception AG</h2>
          <p className="text-sm text-gray-500 mt-1">Suivi agrege par AG: taux ouvert, livre et non ouvert.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notifications" className="text-sm text-blue-600 hover:text-blue-800">Centre notifications</Link>
          <Link href="/dashboard/notifications/preuves-email" className="text-sm text-blue-600 hover:text-blue-800">Preuves detaillees</Link>
        </div>
      </div>

      {agRows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          Aucune AG disponible.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">AG</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ouvert</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Livre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Non ouvert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agRows.map((ag) => {
                const rows = byAg.get(ag.id) ?? [];
                const sentEmails = new Set(rows.map((r) => r.recipient_email.toLowerCase()));
                const deliveredEmails = new Set(
                  rows
                    .filter((r) => r.delivered_at || ['delivered', 'opened', 'clicked'].includes(r.status))
                    .map((r) => r.recipient_email.toLowerCase())
                );
                const openedEmails = new Set(
                  rows
                    .filter((r) => r.opened_at || ['opened', 'clicked'].includes(r.status))
                    .map((r) => r.recipient_email.toLowerCase())
                );

                let nonOpenedDelivered = 0;
                for (const email of deliveredEmails) {
                  if (!openedEmails.has(email)) nonOpenedDelivered++;
                }

                const sentCount = sentEmails.size;
                const deliveredCount = deliveredEmails.size;
                const openedCount = openedEmails.size;

                const openedRate = pct(openedCount, sentCount);
                const deliveredRate = pct(deliveredCount, sentCount);
                const nonOpenedRate = pct(nonOpenedDelivered, deliveredCount);

                return (
                  <tr key={ag.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{ag.titre}</div>
                      <div className="text-xs text-gray-500">{sentCount} destinataire(s) traces</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {new Date(ag.date_ag).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {openedRate}% ({openedCount}/{sentCount || 0})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        {deliveredRate}% ({deliveredCount}/{sentCount || 0})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {nonOpenedRate}% ({nonOpenedDelivered}/{deliveredCount || 0})
                      </span>
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
