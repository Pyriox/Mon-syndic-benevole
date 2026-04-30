// ============================================================
// Page : Liste des Assemblées Générales
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Assemblées générales' };

import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import AGActions from './AGActions';
import AnneeSelector from '@/components/ui/AnneeSelector';
import { formatDate, LABELS_STATUT_AG } from '@/lib/utils';
import { CalendarDays, MapPin, ChevronRight, Send, Mail, CheckCircle } from 'lucide-react';
import { hasChargesSpecialesAddon, isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';
import PageHelp from '@/components/ui/PageHelp';

export default async function AssembleesPage({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const { annee: anneeParam } = await searchParams;
  const annee = parseInt(anneeParam ?? String(new Date().getFullYear()));

  const supabase = await createClient();
  const { user, selectedCoproId, role: userRole, copro: copropriete, trialUsed } = await requireCoproAccess();

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  const [{ data: assemblees }, { data: coproAddons }] = await Promise.all([
    supabase
      .from('assemblees_generales')
      .select('*, pv_envoye_le, coproprietes(nom), resolutions(id)')
      .eq('copropriete_id', selectedCoproId ?? 'none')
      .gte('date_ag', `${annee}-01-01`)
      .lt('date_ag', `${annee + 1}-01-01`)
      .order('date_ag', { ascending: false }),
    supabase
      .from('copro_addons')
      .select('addon_key, status, current_period_end, cancel_at_period_end')
      .eq('copropriete_id', selectedCoproId ?? 'none'),
  ]);

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

  // role === null = nouveau compte sans copropriété → traité comme syndic (cohérent avec le layout)
  const isSyndic = userRole === 'syndic' || userRole === null;

  type AGRow = NonNullable<typeof assemblees>[number];
  const nextActionBadge = (ag: AGRow) => {
    if (ag.statut === 'creation') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          <CalendarDays size={11} />À planifier
        </span>
      );
    }
    if (ag.statut === 'planifiee' && !ag.convocation_envoyee_le) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          <Mail size={11} />Convocation à envoyer
        </span>
      );
    }
    if (ag.statut === 'en_cours') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
          <CheckCircle size={11} />À clôturer
        </span>
      );
    }
    if (ag.statut === 'terminee' && !ag.pv_envoye_le) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
          <Send size={11} />PV à envoyer
        </span>
      );
    }
    return null;
  };
  const canWrite = isSubscribed(copropriete?.plan);
  const specialChargesEnabled = hasChargesSpecialesAddon(coproAddons ?? []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Bandeau lecture seule ── */}
      {isSyndic && !canWrite && <ReadOnlyBanner trialUsed={trialUsed} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assemblées Générales</h2>
          <p className="text-gray-500 mt-1">{assemblees?.length ?? 0} assemblée(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <AnneeSelector annee={annee} />
          {isSyndic && (assemblees?.length ?? 0) > 0 && (canWrite ? <AGActions coproprietes={coproprietes ?? []} specialChargesEnabled={specialChargesEnabled} /> : <UpgradeBanner compact />)}
        </div>
      </div>

      <PageHelp tone={isSyndic ? 'blue' : 'slate'} helpHref={isSyndic ? '/aide#creer-convocation-ag' : undefined}>
        {isSyndic
          ? 'Préparez ici l’ordre du jour, suivez le déroulé de l’assemblée générale et conservez les résolutions et procès-verbaux.'
          : 'Retrouvez ici les dates d’AG, les convocations et les résolutions liées à votre copropriété.'}
      </PageHelp>

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
                      {isSyndic && nextActionBadge(ag)}
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
          description={isSyndic ? "Planifiez vos AG, gérez les résolutions et générez les procès-verbaux." : undefined}
          action={isSyndic && (canWrite ? <AGActions coproprietes={coproprietes ?? []} showLabel specialChargesEnabled={specialChargesEnabled} /> : <UpgradeBanner />)}
        />
      )}
    </div>
  );
}
