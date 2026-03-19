// ============================================================
// Page : Lots de la copropriété — lecture seule pour tous les rôles
// (Le syndic peut gérer les lots depuis la page copropriétés)
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { Building2, ExternalLink } from 'lucide-react';

const LOT_TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  parking:     'Parking',
  cave:        'Cave',
  commerce:    'Commerce',
  bureau:      'Bureau',
  autre:       'Autre',
};

export default async function LotsPage() {
  const supabase = await createClient();
  const { selectedCoproId, role, copro } = await requireCoproAccess();
  const isSyndic = role === 'syndic';

  const { data: lots } = await supabase
    .from('lots')
    .select('id, numero, type, tantiemes, coproprietaire_id')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .order('position', { ascending: true, nullsFirst: false });

  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('id, nom, prenom, raison_sociale')
    .eq('copropriete_id', selectedCoproId ?? 'none');

  const coproMap = Object.fromEntries(
    (coproprietaires ?? []).map((c) => [c.id, c])
  );

  const allLots = lots ?? [];
  const totalTantiemes = allLots.reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lots</h2>
          <p className="text-gray-500 mt-1">
            {allLots.length} lot{allLots.length !== 1 ? 's' : ''}
            {totalTantiemes > 0 && ` · ${totalTantiemes} tantièmes au total`}
          </p>
        </div>
        {isSyndic && copro && (
          <Link
            href={`/coproprietes/${copro.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink size={14} />
            Gérer les lots
          </Link>
        )}
      </div>

      {allLots.length > 0 ? (
        <Card>
          {/* ── Vue cartes : mobile ── */}
          <div className="md:hidden divide-y divide-gray-100">
            {allLots.map((lot) => {
              const owner = lot.coproprietaire_id ? coproMap[lot.coproprietaire_id] : null;
              const ownerName = owner
                ? owner.raison_sociale ?? `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim()
                : null;
              const quotePart = totalTantiemes > 0
                ? ((lot.tantiemes / totalTantiemes) * 100).toFixed(2)
                : '0.00';
              return (
                <div key={lot.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">Lot {lot.numero}</p>
                    <Badge variant="default">{LOT_TYPE_LABELS[lot.type] ?? lot.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {lot.tantiemes} tantièmes &mdash; {quotePart}%
                  </p>
                  {ownerName ? (
                    <p className="text-sm text-gray-700">{ownerName}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Non assigné</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Vue tableau : desktop ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Numéro</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Tantièmes</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Quote-part</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Copropriétaire</th>
                </tr>
              </thead>
              <tbody>
                {allLots.map((lot) => {
                  const owner = lot.coproprietaire_id ? coproMap[lot.coproprietaire_id] : null;
                  const ownerName = owner
                    ? owner.raison_sociale ?? `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim()
                    : null;
                  const quotePart = totalTantiemes > 0
                    ? ((lot.tantiemes / totalTantiemes) * 100).toFixed(2)
                    : '0.00';
                  return (
                    <tr key={lot.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{lot.numero}</td>
                      <td className="py-3 px-4 text-gray-600">
                        <Badge variant="default">{LOT_TYPE_LABELS[lot.type] ?? lot.type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">{lot.tantiemes}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{quotePart}%</td>
                      <td className="py-3 px-4 text-gray-600">
                        {ownerName ?? <span className="text-gray-400 italic">Non assigné</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1.5} />}
          title="Aucun lot"
          description="La liste des lots de cette copropriété sera affichée ici."
        />
      )}
    </div>
  );
}
