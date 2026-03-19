// ============================================================
// Page : Liste des Assemblées Générales
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import AGActions from './AGActions';
import AnneeSelector from '@/components/ui/AnneeSelector';
import { formatDate, LABELS_STATUT_AG } from '@/lib/utils';
import { CalendarDays, MapPin, ChevronRight } from 'lucide-react';
import { isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';

export default async function AssembleesPage({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const { annee: anneeParam } = await searchParams;
  const annee = parseInt(anneeParam ?? String(new Date().getFullYear()));

  const supabase = await createClient();
  const { user, selectedCoproId, role: userRole, copro: copropriete } = await requireCoproAccess();

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  const { data: assemblees } = await supabase
    .from('assemblees_generales')
    .select('*, coproprietes(nom), resolutions(id)')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .gte('date_ag', `${annee}-01-01`)
    .lt('date_ag', `${annee + 1}-01-01`)
    .order('date_ag', { ascending: false });

  const badgeVariant = (statut: string): 'default' | 'info' | 'warning' | 'success' | 'danger' => {
    const map: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
      creation: 'default',
      planifiee: 'info',
      en_cours: 'warning',
      terminee: 'success',
      annulee: 'danger',
    };
    return map[statut] ?? 'default';
  };

  const isSyndic = userRole === 'syndic';
  const canCreate = isSubscribed(copropriete?.plan);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assemblées Générales</h2>
          <p className="text-gray-500 mt-1">{assemblees?.length ?? 0} assemblée(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <AnneeSelector annee={annee} />
          {isSyndic && (canCreate ? <AGActions coproprietes={coproprietes ?? []} /> : <UpgradeBanner compact />)}
        </div>
      </div>

      {assemblees && assemblees.length > 0 ? (
        <div className="space-y-3">
          {assemblees.map((ag) => (
            <Link key={ag.id} href={`/assemblees/${ag.id}`} className="block group">
              <Card className="hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                        {ag.titre}
                      </h3>
                      <Badge variant={badgeVariant(ag.statut)}>
                        {LABELS_STATUT_AG[ag.statut] ?? ag.statut}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>{ag.coproprietes?.nom}</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} />
                        {formatDate(ag.date_ag)}
                      </span>
                      {ag.lieu && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {ag.lieu}
                        </span>
                      )}
                      <span className="text-gray-400">
                        {Array.isArray(ag.resolutions) ? ag.resolutions.length : 0} résolution(s)
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 shrink-0 ml-3" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarDays size={48} strokeWidth={1.5} />}
          title="Aucune assemblée générale"
          description="Planifiez vos AG, gérez les résolutions et générez les procès-verbaux."
          action={isSyndic && (canCreate ? <AGActions coproprietes={coproprietes ?? []} showLabel /> : <UpgradeBanner />)}
        />
      )}
    </div>
  );
}
