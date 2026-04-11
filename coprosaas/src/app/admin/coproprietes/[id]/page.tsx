// ============================================================
// Admin — Détail d'une copropriété : liste des copropriétaires
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-config';
import { ArrowLeft, History, TrendingDown, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import AdminCoproprietaireActions from '../../AdminCoproprietaireActions';
import AdminPagination from '../../AdminPagination';
import AdminSearch from '../../AdminSearch';
import CoproprietaireBalanceHistory from '@/app/(dashboard)/coproprietaires/CoproprietaireBalanceHistory';
import { resolveAdminBackHref } from '@/lib/admin-list-params';
import { formatAdminDateTime } from '@/lib/admin-format';
import { buildAdminCoproFinancialView, getAdminBalanceAccountLabel, getAdminBalanceSourceLabel } from '@/lib/admin-copro-finance';

export default async function AdminCoproDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; q?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const { id } = await params;
  const { from, q, page } = await searchParams;
  const backHref = resolveAdminBackHref(from, '/admin/coproprietes');
  const admin = createAdminClient();

  const [{ data: copro }, { data: coproprietaires }, { data: balanceEventsRows }] = await Promise.all([
    admin
      .from('coproprietes')
      .select('id, nom, adresse, code_postal, ville, nombre_lots')
      .eq('id', id)
      .single(),
    admin
      .from('coproprietaires')
      .select('id, nom, prenom, raison_sociale, telephone, email, adresse, complement_adresse, code_postal, ville, solde, lot_id')
      .eq('copropriete_id', id)
      .order('nom', { ascending: true }),
    admin
      .from('coproprietaire_balance_events')
      .select('id, coproprietaire_id, event_date, source_type, account_type, label, reason, amount, balance_after, created_at')
      .eq('copropriete_id', id)
      .order('created_at', { ascending: false })
      .order('event_date', { ascending: false })
      .limit(150),
  ]);

  if (!copro) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cps = (coproprietaires ?? []) as any[];
  const query = q?.trim().toLowerCase() ?? '';
  const PAGE_SIZE = 20;

  function fmtEur(n: number | null) {
    if (n === null || n === undefined) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  }

  const filteredCps = cps.filter((cp) => {
    if (!query) return true;
    const haystack = [cp.nom, cp.prenom, cp.raison_sociale, cp.email, cp.telephone, cp.ville]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
  const totalPages = Math.max(1, Math.ceil(filteredCps.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const pagedCps = filteredCps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const contactsCount = cps.filter((cp) => Boolean(cp.email)).length;
  const financeView = buildAdminCoproFinancialView({
    coproprietaires: cps,
    balanceEvents: (balanceEventsRows ?? []) as Array<{
      id: string;
      coproprietaire_id: string | null;
      event_date: string;
      source_type: 'manual_adjustment' | 'solde_initial' | 'opening_balance' | 'appel_publication' | 'appel_suppression' | 'payment_received' | 'payment_cancelled' | 'regularisation_closure';
      account_type: 'principal' | 'fonds_travaux' | 'regularisation' | 'mixte';
      label: string;
      reason: string | null;
      amount: number;
      balance_after: number;
      created_at: string;
    }>,
    maxEvents: 120,
  });

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ── */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          {from ? 'Retour au contexte précédent' : 'Retour aux copropriétés'}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{copro.nom}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {[copro.adresse, copro.code_postal, copro.ville].filter(Boolean).join(' · ')}
          {copro.nombre_lots ? ` · ${copro.nombre_lots} lot${copro.nombre_lots > 1 ? 's' : ''}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          <p className="text-lg font-bold">{cps.length}</p>
          <p className="text-xs font-semibold mt-0.5">Copropriétaires enregistrés</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <p className="text-lg font-bold">{contactsCount}</p>
          <p className="text-xs font-semibold mt-0.5">Avec e-mail renseigné</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${financeView.debiteurCount > 0 ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
          <p className="text-lg font-bold">{financeView.debiteurCount}</p>
          <p className="text-xs font-semibold mt-0.5">Copropriétaire{financeView.debiteurCount > 1 ? 's' : ''} débiteur{financeView.debiteurCount > 1 ? 's' : ''}</p>
          <p className="text-[11px] mt-1">{fmtEur(financeView.totalDebiteur)} à régulariser</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-800">
          <p className="text-lg font-bold">{financeView.totalEvents}</p>
          <p className="text-xs font-semibold mt-0.5">Mouvements financiers</p>
          <p className="text-[11px] mt-1">{financeView.creditorCount} avance{financeView.creditorCount > 1 ? 's' : ''} · {fmtEur(financeView.totalCrediteur)}</p>
        </div>
      </div>

      <section id="historique-financier" className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <History size={16} className="text-violet-500" />
            <p className="text-sm font-semibold text-gray-900">Historique financier de la copropriété</p>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
              {financeView.totalEvents} mouvement{financeView.totalEvents > 1 ? 's' : ''}
            </span>
          </div>
          <a href="#coproprietaires" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
            Aller aux copropriétaires ↓
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-red-700">
              <TrendingUp size={14} />
              <p className="text-xs font-semibold uppercase tracking-wide">Impayés visibles</p>
            </div>
            <p className="mt-1 text-xl font-bold text-red-800">{fmtEur(financeView.totalDebiteur)}</p>
            <p className="text-xs text-red-700 mt-1">{financeView.debiteurCount} copropriétaire{financeView.debiteurCount > 1 ? 's' : ''} concerné{financeView.debiteurCount > 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <TrendingDown size={14} />
              <p className="text-xs font-semibold uppercase tracking-wide">Avances de trésorerie</p>
            </div>
            <p className="mt-1 text-xl font-bold text-emerald-800">{fmtEur(financeView.totalCrediteur)}</p>
            <p className="text-xs text-emerald-700 mt-1">{financeView.creditorCount} copropriétaire{financeView.creditorCount > 1 ? 's' : ''} créditeur{financeView.creditorCount > 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide">Répartition des écritures</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              {(Object.entries(financeView.typeCounts) as Array<[string, number]>).length > 0 ? (
                (Object.entries(financeView.typeCounts) as Array<[string, number]>).map(([type, count]) => (
                  <span key={type} className="rounded-full border border-slate-200 bg-white px-2 py-0.5">
                    {getAdminBalanceSourceLabel(type as 'manual_adjustment' | 'solde_initial' | 'opening_balance' | 'appel_publication' | 'appel_suppression' | 'payment_received' | 'payment_cancelled' | 'regularisation_closure')} · {count}
                  </span>
                ))
              ) : (
                <span className="text-slate-500">Aucun mouvement enregistré</span>
              )}
            </div>
          </div>
        </div>

        {financeView.latestEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-400">
            Aucun mouvement financier enregistré pour cette copropriété.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copropriétaire</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Écriture</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Compte</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variation</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Solde après</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {financeView.latestEvents.map((event) => {
                  const owner = cps.find((cp) => cp.id === event.coproprietaire_id);
                  const ownerName = owner?.raison_sociale
                    ? owner.raison_sociale
                    : [owner?.prenom, owner?.nom].filter(Boolean).join(' ') || 'Copropriétaire';
                  return (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatAdminDateTime(event.created_at ?? event.event_date)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{ownerName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800">{event.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {getAdminBalanceSourceLabel(event.source_type)}
                          {event.reason ? ` · Motif : ${event.reason}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{getAdminBalanceAccountLabel(event.account_type)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${event.amount > 0 ? 'text-red-600' : event.amount < 0 ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {event.amount > 0 ? '+' : ''}{fmtEur(event.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-gray-600 hidden md:table-cell">{fmtEur(event.balance_after)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Copropriétaires ── */}
      <section id="coproprietaires">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">
              Copropriétaires
              <span className="ml-2 text-xs font-normal text-gray-500">{filteredCps.length} affiché{filteredCps.length !== 1 ? 's' : ''} / {cps.length}</span>
            </p>
          </div>
          <AdminSearch placeholder="Rechercher un copropriétaire…" defaultValue={q ?? ''} />
        </div>

        {cps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-10 text-center text-sm text-gray-400">
            Aucun copropriétaire enregistré pour cette copropriété.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom / Raison sociale</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Adresse</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Solde</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedCps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                      Aucun copropriétaire trouvé pour « {q} ».
                    </td>
                  </tr>
                )}
                {pagedCps.map((cp) => {
                  const displayName = cp.raison_sociale
                    ? cp.raison_sociale
                    : [cp.prenom, cp.nom].filter(Boolean).join(' ') || '—';
                  const addr = [cp.adresse, cp.code_postal, cp.ville].filter(Boolean).join(', ');
                  return (
                    <tr key={cp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{displayName}</p>
                        {cp.raison_sociale && (cp.prenom || cp.nom) && (
                          <p className="text-xs text-gray-400">{[cp.prenom, cp.nom].filter(Boolean).join(' ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {cp.email && <p className="text-xs text-gray-600">{cp.email}</p>}
                        {cp.telephone && <p className="text-xs text-gray-400">{cp.telephone}</p>}
                        {!cp.email && !cp.telephone && <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {addr || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${(cp.solde ?? 0) > 0 ? 'text-red-600' : (cp.solde ?? 0) < 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {fmtEur(cp.solde)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <CoproprietaireBalanceHistory
                            coproprietaireId={cp.id}
                            displayName={displayName}
                            currentBalance={cp.solde ?? 0}
                            initialEvents={financeView.eventsByCoproprietaire[cp.id] ?? []}
                          />
                          <AdminCoproprietaireActions cp={cp} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredCps.length > PAGE_SIZE && (
          <div className="mt-3">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCps.length}
              pageSize={PAGE_SIZE}
              prevHref={`?${new URLSearchParams({ ...(from ? { from } : {}), ...(q ? { q } : {}), page: String(Math.max(1, currentPage - 1)) }).toString()}`}
              nextHref={`?${new URLSearchParams({ ...(from ? { from } : {}), ...(q ? { q } : {}), page: String(Math.min(totalPages, currentPage + 1)) }).toString()}`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
