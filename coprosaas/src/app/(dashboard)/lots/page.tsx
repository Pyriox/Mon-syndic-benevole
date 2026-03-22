// ============================================================
// Page : Lots de la copropriété — lecture seule pour tous les rôles
// (Le syndic peut gérer les lots depuis la page copropriétés)
// ============================================================
export const revalidate = 60;

import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { Building2, Car, Archive, ShoppingBag, Briefcase, LayoutGrid, ExternalLink, Users, UserCheck, Mail, AlertCircle } from 'lucide-react';

// ── Config par type ──
const LOT_TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  barColor: string;
}> = {
  appartement:  { label: 'Appartement',  icon: Building2,    bgColor: 'bg-blue-50',   iconColor: 'text-blue-500',   badgeBg: 'bg-blue-100',   badgeText: 'text-blue-700',   barColor: 'bg-blue-400' },
  parking:      { label: 'Parking',      icon: Car,          bgColor: 'bg-slate-50',  iconColor: 'text-slate-500',  badgeBg: 'bg-slate-100',  badgeText: 'text-slate-700',  barColor: 'bg-slate-400' },
  cave:         { label: 'Cave',         icon: Archive,      bgColor: 'bg-amber-50',  iconColor: 'text-amber-500',  badgeBg: 'bg-amber-100',  badgeText: 'text-amber-700',  barColor: 'bg-amber-400' },
  commerce:     { label: 'Commerce',     icon: ShoppingBag,  bgColor: 'bg-green-50',  iconColor: 'text-green-500',  badgeBg: 'bg-green-100',  badgeText: 'text-green-700',  barColor: 'bg-green-400' },
  bureau:       { label: 'Bureau',       icon: Briefcase,    bgColor: 'bg-purple-50', iconColor: 'text-purple-500', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', barColor: 'bg-purple-400' },
  autre:        { label: 'Autre',        icon: LayoutGrid,   bgColor: 'bg-gray-50',   iconColor: 'text-gray-400',   badgeBg: 'bg-gray-100',   badgeText: 'text-gray-600',   barColor: 'bg-gray-300' },
};
const defaultConfig = LOT_TYPE_CONFIG.autre;

function getConfig(type: string) {
  return LOT_TYPE_CONFIG[type] ?? defaultConfig;
}

function OwnerAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shrink-0">
      {initials}
    </span>
  );
}

interface CoproEntry {
  id: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  user_id?: string | null;
  email?: string | null;
}

export default async function LotsPage() {
  const supabase = await createClient();
  const { selectedCoproId, role, copro, user } = await requireCoproAccess();
  const isSyndic = role === 'syndic';
  const db = supabase; // Les RLS policies autorisent la lecture pour les deux rôles

  const [{ data: lots }, { data: coproprietairesRaw }] = await Promise.all([
    db
      .from('lots')
      .select('id, numero, type, tantiemes, coproprietaire_id')
      .eq('copropriete_id', selectedCoproId ?? 'none')
      .order('position', { ascending: true, nullsFirst: false }),
    db
      .from('coproprietaires')
      .select('id, nom, prenom, raison_sociale, user_id, email')
      .eq('copropriete_id', selectedCoproId ?? 'none'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coproprietaires = (coproprietairesRaw ?? []) as any[] as CoproEntry[];

  const coproMap = Object.fromEntries(
    coproprietaires.map((c) => [c.id, c])
  );
  const myFicheId = coproprietaires.find((c) => c.user_id === user.id)?.id ?? null;

  const allLots = lots ?? [];
  const totalTantiemes = allLots.reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const assignedCount = allLots.filter((l) => l.coproprietaire_id).length;
  const unassignedCount = allLots.length - assignedCount;
  const assignedTantiemes = allLots
    .filter((l) => l.coproprietaire_id)
    .reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const unassignedTantiemes = totalTantiemes - assignedTantiemes;

  // Répartition par type pour les stats
  const countByType = allLots.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] ?? 0) + 1;
    return acc;
  }, {});

  const statTypes = Object.entries(countByType).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── En-tête ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lots &amp; bâtiment</h2>
          <p className="text-gray-500 mt-0.5">
            {allLots.length} lot{allLots.length !== 1 ? 's' : ''}
            {totalTantiemes > 0 && ` · ${totalTantiemes} tantièmes au total`}
          </p>
        </div>
        {isSyndic && copro && (
          <Link
            href={`/coproprietes/${copro.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            <ExternalLink size={14} />
            Gérer les lots
          </Link>
        )}
      </div>

      {allLots.length > 0 ? (
        <>
          {/* ── Bande de stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card padding="sm" className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                <Building2 size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total lots</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{allLots.length}</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg shrink-0">
                <Users size={18} className="text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Assignés</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">
                  {assignedCount} <span className="text-sm font-normal text-gray-400">/ {allLots.length}</span>
                </p>
              </div>
            </Card>
            {isSyndic && unassignedCount > 0 ? (
              <Card padding="sm" className="flex items-center gap-3 border-orange-200 bg-orange-50">
                <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                  <AlertCircle size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-orange-600">Non assignés</p>
                  <p className="text-lg font-bold text-orange-700 leading-tight">
                    {unassignedCount}
                    {unassignedTantiemes > 0 && (
                      <span className="text-xs font-normal text-orange-500 ml-1">· {unassignedTantiemes} t.</span>
                    )}
                  </p>
                </div>
              </Card>
            ) : (
              statTypes[0] ? (() => {
                const [type, count] = statTypes[0];
                const cfg = getConfig(type);
                const Icon = cfg.icon;
                return (
                  <Card padding="sm" className="flex items-center gap-3">
                    <div className={`p-2 ${cfg.bgColor} rounded-lg shrink-0`}>
                      <Icon size={18} className={cfg.iconColor} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{cfg.label}s</p>
                      <p className="text-lg font-bold text-gray-900 leading-tight">{count}</p>
                    </div>
                  </Card>
                );
              })() : <Card padding="sm" className="hidden sm:flex" />
            )}
            {statTypes.slice(isSyndic && unassignedCount > 0 ? 0 : 1, isSyndic && unassignedCount > 0 ? 1 : 2).map(([type, count]) => {
              const cfg = getConfig(type);
              const Icon = cfg.icon;
              return (
                <Card key={type} padding="sm" className="flex items-center gap-3">
                  <div className={`p-2 ${cfg.bgColor} rounded-lg shrink-0`}>
                    <Icon size={18} className={cfg.iconColor} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{cfg.label}s</p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{count}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ── Vue cartes : mobile ── */}
          <div className="md:hidden space-y-3">
            {allLots.map((lot) => {
              const owner = lot.coproprietaire_id ? coproMap[lot.coproprietaire_id] : null;
              const ownerName = owner
                ? owner.raison_sociale ?? `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim()
                : null;
              const quotePart = totalTantiemes > 0
                ? (lot.tantiemes / totalTantiemes) * 100
                : 0;
              const cfg = getConfig(lot.type);
              const Icon = cfg.icon;
              const isMyLot = myFicheId !== null && lot.coproprietaire_id === myFicheId;
              return (
                <Card key={lot.id} padding="sm" className={isMyLot ? 'ring-1 ring-blue-200 bg-blue-50/40' : ''}>
                  <div className="flex items-start gap-3">
                    {/* Icône type */}
                    <div className={`p-2.5 ${cfg.bgColor} rounded-xl shrink-0`}>
                      <Icon size={18} className={cfg.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">Lot {lot.numero}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {/* Tantièmes + barre */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{lot.tantiemes} tantièmes</span>
                          <span className="font-medium text-gray-700">{quotePart.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`${cfg.barColor} h-full rounded-full`} style={{ width: `${quotePart}%` }} />
                        </div>
                      </div>
                      {/* Propriétaire */}
                      <div className="mt-2">
                        {ownerName ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <OwnerAvatar name={ownerName} />
                              <span className="text-sm text-gray-700 truncate">{ownerName}</span>
                              {owner?.user_id && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                  <UserCheck size={10} />Inscrit
                                </span>
                              )}
                              {isSyndic && !owner?.user_id && (
                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full shrink-0">
                                  Non inscrit
                                </span>
                              )}
                            </div>
                            {isSyndic && owner?.email && (
                              <a
                                href={`mailto:${owner.email}`}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors ml-7"
                              >
                                <Mail size={11} />{owner.email}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-orange-400 italic font-medium">Non assigné</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ── Vue tableau : desktop ── */}
          <Card padding="none" className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-5 font-medium text-gray-500">Lot</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500">Type</th>
                  <th className="py-3 px-5 font-medium text-gray-500">
                    <span className="flex items-center justify-end gap-1">Tantièmes</span>
                  </th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 w-40">Quote-part</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500">Copropriétaire</th>
                  {isSyndic && <th className="text-left py-3 px-5 font-medium text-gray-500 hidden lg:table-cell">Email</th>}
                </tr>
              </thead>
              <tbody>
                {allLots.map((lot) => {
                  const owner = lot.coproprietaire_id ? coproMap[lot.coproprietaire_id] : null;
                  const ownerName = owner
                    ? owner.raison_sociale ?? `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim()
                    : null;
                  const quotePart = totalTantiemes > 0
                    ? (lot.tantiemes / totalTantiemes) * 100
                    : 0;
                  const cfg = getConfig(lot.type);
                  const Icon = cfg.icon;
                  const isMyLot = myFicheId !== null && lot.coproprietaire_id === myFicheId;
                  return (
                    <tr key={lot.id} className={`border-b border-gray-100 last:border-0 transition-colors group ${isMyLot ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-gray-50'}`}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 ${cfg.bgColor} rounded-lg`}>
                            <Icon size={14} className={cfg.iconColor} />
                          </div>
                          <span className="font-semibold text-gray-900">{lot.numero}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badgeBg} ${cfg.badgeText}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-medium text-gray-900">
                        {lot.tantiemes}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`${cfg.barColor} h-full rounded-full`} style={{ width: `${quotePart}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10 text-right">{quotePart.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {ownerName ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <OwnerAvatar name={ownerName} />
                            <span className="text-gray-700">{ownerName}</span>
                            {owner?.user_id && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                <UserCheck size={10} />Inscrit
                              </span>
                            )}
                            {isSyndic && !owner?.user_id && (
                              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full shrink-0">
                                Non inscrit
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-orange-400 italic text-xs font-medium">Non assigné</span>
                        )}
                      </td>
                      {isSyndic && (
                        <td className="py-3.5 px-5 hidden lg:table-cell">
                          {owner?.email ? (
                            <a
                              href={`mailto:${owner.email}`}
                              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <Mail size={13} className="shrink-0" />
                              <span className="truncate max-w-[180px]">{owner.email}</span>
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
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
