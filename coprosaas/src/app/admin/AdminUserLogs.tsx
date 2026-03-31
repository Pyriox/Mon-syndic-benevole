'use client';

import { useState, useMemo } from 'react';
import { ClipboardList, X, Loader2, RefreshCw, Search } from 'lucide-react';
import { getUserLogs, type UserEvent, type GetUserLogsFilters } from '@/lib/actions/admin-user-logs';

// ── Labels & couleurs par event_type ──────────────────────────────────────────
const EVENT_META: Record<string, { icon: string; label: string; color: string }> = {
  // Compte
  account_confirmed:         { icon: '✓', label: 'Compte vérifié',              color: 'text-green-600 bg-green-50 border-green-200' },
  user_registered:           { icon: '🆕', label: 'Inscription',                 color: 'text-blue-700 bg-blue-50 border-blue-200' },
  login_success:             { icon: '→', label: 'Connexion',                   color: 'text-gray-600 bg-gray-50 border-gray-200' },
  login_failed:              { icon: '⚠', label: 'Connexion échouée',           color: 'text-amber-700 bg-amber-50 border-amber-200' },
  password_reset_requested:  { icon: '🔑', label: 'Réinit. mot de passe',        color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  email_confirmation_resent: { icon: '✉', label: 'Email de confirmation renvoyé', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  // Facturation
  trial_started:             { icon: '↗', label: 'Essai démarré',               color: 'text-amber-600 bg-amber-50 border-amber-200' },
  subscription_created:      { icon: '↑', label: 'Abonnement activé',           color: 'text-blue-600 bg-blue-50 border-blue-200' },
  subscription_renewed:      { icon: '↻', label: 'Renouvellement',              color: 'text-blue-500 bg-blue-50 border-blue-200' },
  subscription_upgraded:     { icon: '⬆', label: 'Changement de plan',          color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  subscription_cancelled:    { icon: '↓', label: 'Résiliation',                 color: 'text-orange-600 bg-orange-50 border-orange-200' },
  payment_succeeded:         { icon: '✓', label: 'Paiement réussi',             color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  payment_failed:            { icon: '✗', label: 'Paiement échoué',             color: 'text-red-600 bg-red-50 border-red-200' },
  // Support
  ticket_created:            { icon: '✉', label: 'Ticket ouvert',               color: 'text-purple-600 bg-purple-50 border-purple-200' },
  // Activité
  copropriete_created:       { icon: '🏢', label: 'Copropriété créée',           color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  appel_fonds_created:       { icon: '📋', label: 'Appel de fonds créé',         color: 'text-teal-600 bg-teal-50 border-teal-200' },
  appel_fonds_sent:          { icon: '📤', label: 'Appel de fonds envoyé',       color: 'text-teal-700 bg-teal-50 border-teal-200' },
  ag_created:                { icon: '🗳️', label: 'AG créée',                    color: 'text-sky-600 bg-sky-50 border-sky-200' },
  coproprietaire_added:      { icon: '👤', label: 'Copropriétaire ajouté',       color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  coproprietaire_deleted:    { icon: '🗑️', label: 'Copropriétaire supprimé',     color: 'text-rose-600 bg-rose-50 border-rose-200' },
  document_uploaded:         { icon: '📎', label: 'Document ajouté',             color: 'text-slate-600 bg-slate-50 border-slate-200' },
  // Admin
  admin_user_deleted:              { icon: '🛑', label: 'Compte supprimé (admin)',            color: 'text-red-700 bg-red-50 border-red-200' },
  admin_resend_confirmation:       { icon: '✉', label: 'Confirmation renvoyée (admin)',       color: 'text-sky-700 bg-sky-50 border-sky-200' },
  admin_force_confirm:             { icon: '✓', label: 'Compte vérifié manuellement',         color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  admin_invitation_cancelled:      { icon: '⊘', label: 'Invitation annulée (admin)',          color: 'text-amber-700 bg-amber-50 border-amber-200' },
  admin_role_revoked:              { icon: '↓', label: 'Droits admin retirés',                color: 'text-orange-700 bg-orange-50 border-orange-200' },
  admin_role_granted:              { icon: '↑', label: 'Droits admin accordés',               color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  admin_user_updated:              { icon: '✎', label: 'Utilisateur modifié (admin)',         color: 'text-slate-700 bg-slate-50 border-slate-200' },
  admin_invitation_deleted:        { icon: '🗑', label: 'Invitation supprimée (admin)',        color: 'text-rose-700 bg-rose-50 border-rose-200' },
  admin_subscription_reset:        { icon: '↺', label: 'Abonnement réinitialisé (admin)',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  admin_stripe_sync:               { icon: '⇄', label: 'Synchronisation Stripe (admin)',      color: 'text-blue-700 bg-blue-50 border-blue-200' },
  admin_syndic_reassigned:         { icon: '⇆', label: 'Syndic réassigné (admin)',            color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  admin_copro_updated:             { icon: '🏢', label: 'Copropriété modifiée (admin)',       color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  admin_impersonation_link_created:{ icon: '🔐', label: 'Lien d’impersonation généré',        color: 'text-purple-700 bg-purple-50 border-purple-200' },
  admin_coproprietaire_updated:    { icon: '👤', label: 'Copropriétaire modifié (admin)',     color: 'text-teal-700 bg-teal-50 border-teal-200' },
};

const SEVERITY_DOT: Record<string, string> = {
  info:    'bg-gray-300',
  warning: 'bg-amber-400',
  error:   'bg-red-500',
};

type Category = 'all' | 'billing' | 'account' | 'activity' | 'admin';
type Severity = 'all' | 'info' | 'warning' | 'error';

function fmtDatetime(s: string) {
  return new Date(s).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtPreciseDatetime(s: string) {
  return new Date(s).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

export default function AdminUserLogs({
  email,
  signupAt,
}: {
  email: string;
  signupAt?: string | null;
}) {
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [allEvents, setAllEvents] = useState<UserEvent[] | null>(null);
  const [error, setError]       = useState('');

  // Filtres locaux (appliqués côté client sur allEvents déjà chargés)
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [severity, setSeverity] = useState<Severity>('all');

  const CATEGORY_EVENTS: Record<Exclude<Category, 'all'>, string[]> = {
    billing:  ['trial_started', 'subscription_created', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'subscription_renewed', 'subscription_upgraded'],
    account:  ['account_confirmed', 'user_registered', 'password_reset_requested', 'login_success', 'login_failed', 'email_confirmation_resent'],
    activity: ['copropriete_created', 'appel_fonds_created', 'appel_fonds_sent', 'ag_created', 'coproprietaire_added', 'coproprietaire_deleted', 'document_uploaded', 'ticket_created'],
    admin:    ['admin_user_deleted', 'admin_resend_confirmation', 'admin_force_confirm', 'admin_invitation_cancelled', 'admin_role_revoked', 'admin_role_granted', 'admin_user_updated', 'admin_invitation_deleted', 'admin_subscription_reset', 'admin_stripe_sync', 'admin_syndic_reassigned', 'admin_copro_updated', 'admin_impersonation_link_created', 'admin_coproprietaire_updated'],
  };

  const fetchEvents = async () => {
    if (!email?.trim()) { setError('Email utilisateur manquant.'); setAllEvents([]); return; }
    setError('');
    setLoading(true);
    const filters: GetUserLogsFilters = {};
    const res = await getUserLogs(email, filters);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setAllEvents(res.events ?? []);
  };

  const handleOpen = async () => {
    setOpen(true);
    await fetchEvents();
  };

  const handleRefresh = async () => {
    setAllEvents(null);
    await fetchEvents();
  };

  // Filtrage client-side (rapide, pas de round-trip)
  const filtered = useMemo(() => {
    if (!allEvents) return [];
    return allEvents.filter((ev) => {
      if (severity !== 'all' && ev.severity !== severity) return false;
      if (category !== 'all' && !CATEGORY_EVENTS[category].includes(ev.event_type)) return false;
      if (search.trim()) {
        const needle = search.toLowerCase();
        if (!ev.label.toLowerCase().includes(needle) && !ev.event_type.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [allEvents, severity, category, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = category !== 'all' || severity !== 'all' || search.trim().length > 0;

  return (
    <>
      <button
        onClick={handleOpen}
        title="Voir l'activité de cet utilisateur"
        className="inline-flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <ClipboardList size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">Journal d&apos;activité</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{email}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Inscription : {signupAt ? fmtPreciseDatetime(signupAt) : '—'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Rafraîchir"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Filtres ── */}
            <div className="px-5 pt-3 pb-2 border-b border-gray-100 shrink-0 space-y-2">
              {/* Recherche */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Catégorie + Sévérité */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-1">
                  {(['all', 'billing', 'account', 'activity', 'admin'] as const).map((cat) => (
                    <button key={cat}
                      onClick={() => setCategory(cat)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors ${category === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                      {cat === 'all' ? 'Tout' : cat === 'billing' ? 'Facturation' : cat === 'account' ? 'Compte' : cat === 'activity' ? 'Activité' : 'Admin'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 ml-auto">
                  {(['all', 'warning', 'error'] as const).map((sev) => (
                    <button key={sev}
                      onClick={() => setSeverity(sev)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors ${severity === sev ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                      { sev === 'all' ? 'Tous niveaux' : sev === 'warning' ? '⚠ Warning' : '✗ Erreurs' }
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
              )}
              {!loading && error && (
                <p className="text-sm text-red-500 text-center py-8">{error}</p>
              )}
              {!loading && !error && allEvents !== null && filtered.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  {hasFilters ? 'Aucun événement pour ces filtres.' : 'Aucun événement enregistré.'}
                </p>
              )}
              {!loading && !error && filtered.length > 0 && (
                <ol className="relative border-l border-gray-200 ml-2 space-y-4">
                  {filtered.map((ev) => {
                    const cfg = EVENT_META[ev.event_type];
                    const dot = SEVERITY_DOT[ev.severity] ?? SEVERITY_DOT.info;
                    return (
                      <li key={ev.id} className="ml-4">
                        <div className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${dot}`} />
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded px-1.5 py-0.5 ${cfg?.color ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                              {cfg?.icon ?? '·'} {cfg?.label ?? ev.event_type}
                            </span>
                            {ev.label && (
                              <p className="text-xs text-gray-500 mt-0.5 ml-0.5 truncate">{ev.label}</p>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 shrink-0 mt-0.5 tabular-nums">{fmtDatetime(ev.created_at)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* ── Footer ── */}
            {!loading && allEvents && allEvents.length > 0 && (
              <div className="px-5 py-2.5 border-t border-gray-100 shrink-0 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  {filtered.length}{hasFilters ? ` / ${allEvents.length}` : ''} événement{allEvents.length > 1 ? 's' : ''}
                  {allEvents.length >= 200 && ' · 200 max'}
                </p>
                {hasFilters && (
                  <button
                    onClick={() => { setSearch(''); setCategory('all'); setSeverity('all'); }}
                    className="text-[11px] text-indigo-500 hover:text-indigo-700 underline underline-offset-2"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
