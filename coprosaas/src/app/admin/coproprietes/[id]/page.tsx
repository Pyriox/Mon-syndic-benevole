// ============================================================
// Admin — Détail d'une copropriété : liste des copropriétaires
// ============================================================
export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-config';
import { ArrowLeft, Clock, History, TrendingDown, TrendingUp, Users, FileText, CalendarDays, CreditCard, ExternalLink, Send, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import AdminCoproActions from '../../AdminCoproActions';
import AdminCoproprietaireActionsLazy from '../../AdminCoproprietaireActionsLazy';
import AdminPagination from '../../AdminPagination';
import AdminSearch from '../../AdminSearch';
import CoproprietaireBalanceHistoryLazy from '../../CoproprietaireBalanceHistoryLazy';
import AdminStorageExplorerLazy from './AdminStorageExplorerLazy';
import AdminUserEventTimeline from '../../AdminUserEventTimeline';
import { resolveAdminBackHref, buildAdminPath } from '@/lib/admin-list-params';
import { formatAdminDate, formatAdminDateTime } from '@/lib/admin-format';
import { buildAdminCoproFinancialView, getAdminBalanceSourceLabel } from '@/lib/admin-copro-finance';
import { PlanBadge } from '../../AdminBadges';

export default async function AdminCoproDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; q?: string; page?: string; logPage?: string; logLevel?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const { id } = await params;
  const { from, q, page, logPage, logLevel } = await searchParams;
  const backHref = resolveAdminBackHref(from, '/admin/coproprietes');
  const admin = createAdminClient();

  const today = new Date().toISOString().split('T')[0];

  const [{ data: copro }, { data: coproprietaires }, { data: balanceEventsRows }, { data: appelsEchus }, { data: allAppels }, { data: ags }, { data: coproAddons }, { data: coproEventsRaw }, { data: coproEmailDeliveries }] = await Promise.all([
    admin
      .from('coproprietes')
      .select('id, nom, adresse, code_postal, ville, nombre_lots, plan, plan_id, plan_period_end, plan_cancel_at_period_end, stripe_customer_id, stripe_subscription_id, created_at')
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
    admin
      .from('appels_de_fonds')
      .select('id, statut, date_echeance, lignes_appels_de_fonds(id, coproprietaire_id, montant_du, paye)')
      .eq('copropriete_id', id)
      .in('statut', ['publie', 'confirme'])
      .lt('date_echeance', today),
    admin
      .from('appels_de_fonds')
      .select('id, statut, titre, date_echeance, created_at')
      .eq('copropriete_id', id)
      .order('date_echeance', { ascending: false })
      .limit(50),
    admin
      .from('assemblees_generales')
      .select('id, statut, titre, date_ag, created_at')
      .eq('copropriete_id', id)
      .order('date_ag', { ascending: false })
      .limit(30),

    admin
      .from('copro_addons')
      .select('addon_key, status, cancel_at_period_end')
      .eq('copropriete_id', id),
    (() => {
      let eventsQuery = admin
        .from('user_events')
        .select('id, event_type, label, created_at, severity, metadata')
        .eq('copropriete_id', id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (logLevel && logLevel !== 'all') {
        eventsQuery = eventsQuery.eq('severity', logLevel);
      }
      return eventsQuery;
    })(),
    admin
      .from('email_deliveries')
      .select('id, template_key, subject, status, recipient_email, legal_event_type, sent_at, created_at')
      .eq('copropriete_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (!copro) notFound();

  // Journal copropriété — la sévérité est filtrée en base si logLevel est actif
  const LOG_PAGE_SIZE = 20;
  const coproEvents = (coproEventsRaw ?? []) as { id: string; event_type: string; label: string; created_at: string; severity: 'info' | 'warning' | 'error' | null; metadata: Record<string, unknown> | null }[];
  const logCurrentPage = Math.max(1, parseInt(logPage ?? '1', 10));
  const logTotalPages = Math.max(1, Math.ceil(coproEvents.length / LOG_PAGE_SIZE));
  const coproEventsPage = coproEvents.slice((logCurrentPage - 1) * LOG_PAGE_SIZE, logCurrentPage * LOG_PAGE_SIZE);

  function daysFromNow(dateStr: string): number {
    return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

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
  const unpaidLines = (appelsEchus ?? []).flatMap((appel) =>
    ((appel.lignes_appels_de_fonds ?? []) as Array<{ id: string; coproprietaire_id: string | null; montant_du: number; paye: boolean }>).map((ligne) => ({
      id: ligne.id,
      coproprietaire_id: ligne.coproprietaire_id ?? null,
      montant_du: ligne.montant_du,
      paye: ligne.paye,
      date_echeance: (appel as { date_echeance?: string | null }).date_echeance ?? null,
      appel_statut: (appel as { statut?: string | null }).statut ?? null,
    })),
  );

  const financeView = buildAdminCoproFinancialView({
    coproprietaires: cps,
    unpaidLines,
    today,
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

      {/* ── Actions ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <ShieldAlert size={14} className="text-gray-500" /> Actions
        </p>
        <AdminCoproActions
          coproId={id}
          coproNom={copro.nom}
          adresse={(copro as { adresse?: string | null }).adresse ?? null}
          codePostal={(copro as { code_postal?: string | null }).code_postal ?? null}
          ville={(copro as { ville?: string | null }).ville ?? null}
          nombreLots={(copro as { nombre_lots?: number | null }).nombre_lots ?? null}
          inlineMode
        />
      </div>

      {/* ── Abonnement ── */}
      {(() => {
        const c = copro as typeof copro & {
          plan: string | null;
          plan_id: string | null;
          plan_period_end: string | null;
          plan_cancel_at_period_end: boolean | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
        };
        const cancelling = !!c.plan_cancel_at_period_end;
        const isActive = c.plan === 'actif';
        const isTrial = c.plan === 'essai' || !c.plan;
        const endDate = c.plan_period_end;
        const days = endDate ? daysFromNow(endDate) : null;
        const expired = days !== null && days < 0;
        const urgent = days !== null && !expired && (isTrial ? days <= 3 : days <= 7);

        let echLabel = '';
        let echColor = 'text-gray-600';
        if (isTrial) {
          echLabel = expired ? 'Essai expiré' : `Fin essai${!endDate ? ' ~' : ''}`;
          echColor = expired ? 'text-red-500' : urgent ? 'text-orange-500' : 'text-amber-600';
        } else if (isActive && cancelling) {
          echLabel = 'Résiliation prévue';
          echColor = 'text-orange-500';
        } else if (isActive) {
          echLabel = 'Renouvellement';
          echColor = urgent ? 'text-amber-600' : 'text-emerald-600';
        } else if (c.plan === 'resilie') {
          echLabel = 'Résilié le';
          echColor = 'text-red-400';
        } else if (c.plan === 'passe_du') {
          echLabel = 'Impayé depuis';
          echColor = 'text-red-500';
        }

        const relLabel = days === null ? null
          : days < 0 ? `il y a ${Math.abs(days)} j`
          : days === 0 ? "aujourd'hui"
          : `dans ${days} j`;

        return (
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={15} className="text-indigo-500" />
              <p className="text-sm font-semibold text-gray-900">Abonnement</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Plan</p>
                <PlanBadge plan={c.plan} planId={c.plan_id} />
              </div>

              {(endDate || isTrial) && (
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${echColor}`}>{echLabel}</p>
                  <p className={`font-semibold ${expired ? 'text-red-600' : urgent ? 'text-orange-600' : cancelling ? 'text-orange-600' : 'text-gray-800'}`}>
                    {endDate ? formatAdminDate(endDate) : `~ ${formatAdminDate(new Date(new Date(c.created_at).getTime() + 14 * 86400 * 1000).toISOString())}`}
                  </p>
                  {relLabel && days !== null && Math.abs(days) <= 30 && (
                    <p className={`text-[11px] mt-0.5 ${expired ? 'text-red-400' : urgent ? 'text-orange-500' : cancelling ? 'text-orange-400' : 'text-gray-400'}`}>{relLabel}</p>
                  )}
                </div>
              )}

              {cancelling && isActive && (
                <div className="flex items-center">
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                    Non-renouvellement activé
                  </span>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Créée le</p>
                <p className="text-gray-600">{formatAdminDate(c.created_at)}</p>
              </div>

              {c.stripe_customer_id && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Client Stripe</p>
                  <Link
                    href={`https://dashboard.stripe.com/customers/${c.stripe_customer_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-800"
                  >
                    {c.stripe_customer_id} <ExternalLink size={11} />
                  </Link>
                </div>
              )}

              {c.stripe_subscription_id && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Abonnement Stripe</p>
                  <Link
                    href={`https://dashboard.stripe.com/subscriptions/${c.stripe_subscription_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-800"
                  >
                    {c.stripe_subscription_id} <ExternalLink size={11} />
                  </Link>
                </div>
              )}

              {(() => {
                const chargesAddon = (coproAddons ?? []).find((a) => a.addon_key === 'charges_speciales');
                const active = chargesAddon?.status === 'active' || chargesAddon?.status === 'trialing';
                const stopping = active && !!chargesAddon?.cancel_at_period_end;
                return (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Option charges spéciales</p>
                    {!chargesAddon || !active ? (
                      <span className="text-xs text-gray-400">Non souscrite</span>
                    ) : stopping ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Résiliation programmée</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span>
                    )}
                  </div>
                );
              })()}

            </div>
          </section>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          <p className="text-lg font-bold">{cps.length}</p>
          <p className="text-xs font-semibold mt-0.5">Copropriétaires enregistrés</p>
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
                          <CoproprietaireBalanceHistoryLazy
                            coproprietaireId={cp.id}
                            displayName={displayName}
                            currentBalance={cp.solde ?? 0}
                            initialEvents={financeView.eventsByCoproprietaire[cp.id] ?? []}
                          />
                          <AdminCoproprietaireActionsLazy cp={cp} />
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

      {/* ── Assemblées Générales ── */}
      <section id="assemblees" className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-indigo-500" />
          <p className="text-sm font-semibold text-gray-900">Assemblées générales</p>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
            {(ags ?? []).length}
          </span>
        </div>
        {(ags ?? []).length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
            Aucune assemblée générale enregistrée.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Titre</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date AG</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(ags ?? []).map((ag) => {
                  const a = ag as { id: string; statut: string; titre: string | null; date_ag: string | null };
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{a.titre ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{a.date_ag ? formatAdminDateTime(a.date_ag) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          a.statut === 'terminee' ? 'bg-emerald-50 text-emerald-700' :
                          a.statut === 'en_cours' ? 'bg-blue-50 text-blue-700' :
                          a.statut === 'planifiee' ? 'bg-amber-50 text-amber-700' :
                          a.statut === 'annulee' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{a.statut}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Appels de fonds ── */}
      <section id="appels" className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-violet-500" />
          <p className="text-sm font-semibold text-gray-900">Appels de fonds</p>
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
            {(allAppels ?? []).length}
          </span>
        </div>
        {(allAppels ?? []).length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
            Aucun appel de fonds enregistré.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Titre</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Échéance</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(allAppels ?? []).map((appel) => {
                  const a = appel as { id: string; statut: string; titre: string | null; date_echeance: string | null };
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{a.titre ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{a.date_echeance ? formatAdminDateTime(a.date_echeance) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          a.statut === 'confirme' ? 'bg-emerald-50 text-emerald-700' :
                          a.statut === 'publie' ? 'bg-blue-50 text-blue-700' :
                          a.statut === 'brouillon' ? 'bg-gray-100 text-gray-600' :
                          a.statut === 'annule' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{a.statut}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* ── Documents Storage ── */}
      <section id="documents" className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">Documents (Storage)</p>
        </div>
        <AdminStorageExplorerLazy coproId={id} />
      </section>

      {/* ── Emails envoyés ── */}
      {(coproEmailDeliveries ?? []).length > 0 && (
        <section id="emails" className="space-y-3">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Emails envoyés ({(coproEmailDeliveries ?? []).length})</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {(coproEmailDeliveries ?? []).map((d) => {
                const delivery = d as { id: string; template_key: string; subject: string | null; status: string; recipient_email: string; legal_event_type: string | null; sent_at: string | null; created_at: string };
                const statusColor = delivery.status === 'opened' ? 'text-green-700 bg-green-50 border-green-200' : delivery.status === 'delivered' ? 'text-blue-700 bg-blue-50 border-blue-200' : delivery.status === 'bounced' || delivery.status === 'failed' ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-600 bg-gray-50 border-gray-200';
                return (
                  <div key={delivery.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{delivery.subject ?? delivery.template_key}</p>
                      <p className="text-xs text-gray-400">{delivery.recipient_email} · {formatAdminDateTime(delivery.sent_at ?? delivery.created_at)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusColor}`}>{delivery.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Journal d'activité ── */}
      <section id="journal">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-800">
                Journal d&apos;activité
                <span className="ml-2 text-xs font-normal text-gray-500">({coproEvents.length} événement{coproEvents.length !== 1 ? 's' : ''})</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'info', 'warning', 'error'] as const).map(level => (
                <Link
                  key={level}
                  href={buildAdminPath(`/admin/coproprietes/${id}`, { from, q, page, logPage: '1', logLevel: level === 'all' ? undefined : level })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    (logLevel ?? 'all') === level
                      ? 'border-gray-800 bg-gray-800 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {level === 'all' ? 'Tous niveaux' : level === 'info' ? 'Info' : level === 'warning' ? 'Warnings' : 'Erreurs'}
                </Link>
              ))}
            </div>
          </div>
          <AdminUserEventTimeline
            events={coproEventsPage}
            currentPage={logCurrentPage}
            totalPages={logTotalPages}
            totalItems={coproEvents.length}
            basePath={`/admin/coproprietes/${id}`}
            pageParamName="logPage"
            pageSize={LOG_PAGE_SIZE}
            queryParams={{ from, q, page, logLevel: logLevel ?? undefined }}
            emptyMessage="Aucun événement enregistré pour cette copropriété."
          />
        </div>
      </section>
    </div>
  );
}
