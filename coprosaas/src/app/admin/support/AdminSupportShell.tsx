'use client';
// ============================================================
// AdminSupportShell — Interface de messagerie support admin
// ============================================================
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LifeBuoy, Search, Send, RefreshCw, ChevronDown,
  CheckCircle, MessageSquare, User, Shield,
  Circle, AlertCircle, Inbox, Mail,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────

type TicketStatus = 'ouvert' | 'en_cours' | 'resolu';
type TicketReadState = 'waiting_support' | 'client_unread' | 'client_read' | 'no_messages';

interface Ticket {
  id: string;
  user_email: string;
  user_name: string;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  last_message_author?: 'client' | 'admin' | null;
  last_message_at?: string | null;
  read_state?: TicketReadState;
  has_unread_admin_messages?: boolean;
}

interface Message {
  id: string;
  ticket_id: string;
  author: 'client' | 'admin';
  content: string;
  created_at: string;
  client_read?: boolean | null;
}

// ── Helpers ────────────────────────────────────────────────

const STATUS_CFG: Record<TicketStatus, { label: string; bg: string; text: string; dot: string }> = {
  ouvert:   { label: 'Ouvert',    bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  en_cours: { label: 'En cours',  bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  resolu:   { label: 'Résolu',    bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
};

const READ_STATE_CFG: Record<TicketReadState, { label: string; tone: string }> = {
  waiting_support: { label: 'En attente du support', tone: 'bg-slate-100 text-slate-700' },
  client_unread:   { label: 'Non lu par le client',  tone: 'bg-amber-50 text-amber-700' },
  client_read:     { label: 'Lu par le client',      tone: 'bg-emerald-50 text-emerald-700' },
  no_messages:     { label: 'Nouveau ticket',         tone: 'bg-blue-50 text-blue-700' },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ReadStateBadge({ readState }: { readState: TicketReadState | undefined }) {
  const cfg = READ_STATE_CFG[readState ?? 'no_messages'];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.tone}`}>
      {cfg.label}
    </span>
  );
}

function formatDateFR(d: string) {
  const date = new Date(d);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000)          return 'à l\'instant';
  if (diff < 3_600_000)       return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)      return `il y a ${Math.floor(diff / 3_600_000)} h`;
  if (diff < 86_400_000 * 2)  return 'hier';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatDateFull(d: string) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Composant principal ─────────────────────────────────────

export default function AdminSupportShell({
  initialTickets,
  initialSearch = '',
  initialFilterStatus = 'all',
  initialTicketId = null,
}: {
  initialTickets: Ticket[];
  initialSearch?: string;
  initialFilterStatus?: 'all' | TicketStatus;
  initialTicketId?: string | null;
}) {
  const [tickets, setTickets]       = useState<Ticket[]>(initialTickets);
  const [selectedId, setSelectedId] = useState<string | null>(initialTicketId ?? initialTickets[0]?.id ?? null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reply, setReply]           = useState('');
  const [sending, setSending]       = useState(false);
  const [sendError, setSendError]   = useState('');
  const [sendEmailWarning, setSendEmailWarning] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [search, setSearch]         = useState(initialSearch);
  const [filterStatus, setFilterStatus] = useState<'all' | TicketStatus>(initialFilterStatus);
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null;

  // ── Charger les messages d'un ticket ──
  const loadMessages = useCallback(async (ticketId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/support/messages?ticketId=${encodeURIComponent(ticketId)}`);
      if (!res.ok) throw new Error();
      const data: Message[] = await res.json();
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      setMessages([]);
      setReply('');
      setSendError('');
      setSendEmailWarning(false);
      loadMessages(selectedId);
    }
  }, [selectedId, loadMessages]);

  // Scroll to bottom when messages load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Rafraîchir la liste des tickets ──
  const refreshTickets = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/support/tickets');
      if (!res.ok) throw new Error();
      const data: Ticket[] = await res.json();
      setTickets(data);
    } catch { /* silencieux */ } finally {
      setRefreshing(false);
    }
  }, []);

  // ── Polling fiable côté admin (fallback au lieu du realtime bloqué par RLS) ──
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void refreshTickets();
      if (selectedId) {
        void loadMessages(selectedId);
      }
    }, 15000);

    const handleFocus = () => {
      void refreshTickets();
      if (selectedId) {
        void loadMessages(selectedId);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadMessages, refreshTickets, selectedId]);

  // ── Envoyer une réponse admin ──
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !reply.trim() || sending) return;
    setSending(true);
    setSendError('');
    setSendEmailWarning(false);
    try {
      const res = await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedId, message: reply.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.message ?? 'Erreur');
      }
      if (d.emailWarning) setSendEmailWarning(true);
      setReply('');
      // Optimistic update
      const nowIso = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          ticket_id: selectedId,
          author: 'admin',
          content: reply.trim(),
          created_at: nowIso,
          client_read: false,
        },
      ]);
      setTickets((prev) => prev.map((t) =>
        t.id === selectedId
          ? {
              ...t,
              status: t.status === 'ouvert' ? 'en_cours' : t.status,
              updated_at: nowIso,
              last_message_author: 'admin',
              last_message_at: nowIso,
              read_state: 'client_unread',
              has_unread_admin_messages: true,
            }
          : t
      ));
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  // ── Modifier le statut ──
  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedId || statusLoading) return;
    setStatusLoading(true);
    try {
      const res = await fetch('/api/support/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedId, status }),
      });
      if (!res.ok) throw new Error();
      setTickets((prev) => prev.map((t) =>
        t.id === selectedId ? { ...t, status, updated_at: new Date().toISOString() } : t
      ));
    } catch { /* silencieux */ } finally {
      setStatusLoading(false);
    }
  };

  // ── Filtrage liste ──
  const filteredTickets = useMemo(() => tickets.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q
      || t.user_name.toLowerCase().includes(q)
      || t.user_email.toLowerCase().includes(q)
      || t.subject.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [tickets, filterStatus, search]);

  const countByStatus = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;
  const PAGE_SIZE = 12;
  const [listPage, setListPage] = useState(1);
  useEffect(() => {
    setListPage(1);
  }, [search, filterStatus]);
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(listPage, totalPages);
  const pagedTickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Keyboard shortcut : Cmd/Ctrl+Enter → envoyer ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy size={20} className="text-indigo-600" />
            Support
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total
            {countByStatus('ouvert') > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                <AlertCircle size={10} /> {countByStatus('ouvert')} ouvert{countByStatus('ouvert') > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={refreshTickets}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 bg-white rounded-lg px-3 py-2 transition-colors"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tickets ouverts', value: countByStatus('ouvert'), tone: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'En cours', value: countByStatus('en_cours'), tone: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Résolus', value: countByStatus('resolu'), tone: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Résultats filtrés', value: filteredTickets.length, tone: 'bg-slate-50 text-slate-700 border-slate-200' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.tone}`}>
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-xs font-semibold mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Corps : liste + conversation ── */}
      <div className="flex gap-5 items-start" style={{ minHeight: '70vh' }}>

        {/* ── Colonne gauche : liste des tickets ── */}
        <div className="w-72 shrink-0 flex flex-col gap-2">

          {/* Recherche */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtres statut */}
          <div className="flex gap-1 flex-wrap">
            {([['all', 'Tous'] as const, ['ouvert', 'Ouverts'] as const, ['en_cours', 'En cours'] as const, ['resolu', 'Résolus'] as const]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterStatus(val)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filterStatus === val
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
                {val !== 'all' && (
                  <span className="ml-1 opacity-60">{countByStatus(val)}</span>
                )}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-10">
                <Inbox size={28} className="mx-auto text-gray-500 mb-2" />
                <p className="text-xs text-gray-500">Aucun ticket</p>
              </div>
            ) : pagedTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`text-left w-full px-3 py-3 rounded-xl border transition-all ${
                  selectedId === t.id
                    ? 'bg-white border-blue-200 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-gray-900 truncate flex-1">{t.user_name}</span>
                  <span className="shrink-0 text-[10px] text-gray-500">{formatDateFR(t.updated_at)}</span>
                </div>
                <p className="text-[11px] text-gray-500 truncate mb-1">{t.user_email}</p>
                <p className="text-xs text-gray-600 truncate mb-1.5">{t.subject}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={t.status} />
                  <ReadStateBadge readState={t.read_state} />
                </div>
              </button>
            ))}
            {filteredTickets.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-1 pt-2 text-[11px] text-gray-500">
                <span>Page {safePage}/{totalPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="rounded border border-gray-200 px-2 py-1 disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : conversation ── */}
        <div className="flex-1 min-w-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: '70vh' }}>

          {!selectedTicket ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
              <MessageSquare size={36} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">Sélectionnez un ticket pour afficher la conversation</p>
            </div>
          ) : (
            <>
              {/* Header ticket */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 truncate">{selectedTicket.subject}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium">{selectedTicket.user_name}</span>
                    {' · '}{selectedTicket.user_email}
                    {' · '}créé le {formatDateFull(selectedTicket.created_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <ReadStateBadge readState={selectedTicket.read_state} />
                    <Link href={`/admin/utilisateurs?q=${encodeURIComponent(selectedTicket.user_email)}`} className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 font-medium text-indigo-700 hover:border-indigo-300">
                      <User size={11} /> Voir l’utilisateur
                    </Link>
                    <Link href={`/admin/emails?q=${encodeURIComponent(selectedTicket.user_email)}`} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 font-medium text-gray-700 hover:border-gray-300">
                      <Mail size={11} /> Historique e-mails
                    </Link>
                  </div>
                </div>

                {/* Sélecteur de statut */}
                <StatusSelector
                  current={selectedTicket.status}
                  loading={statusLoading}
                  onChange={handleStatusChange}
                />
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw size={20} className="animate-spin text-gray-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-gray-500">Aucun message dans ce ticket</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Zone de réponse */}
              {selectedTicket.status !== 'resolu' ? (
                <form
                  onSubmit={handleSend}
                  className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2 bg-gray-50/60"
                >
                  <textarea
                    ref={textareaRef}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Répondre au client… (Ctrl+Entrée pour envoyer)"
                    rows={3}
                    className="w-full resize-none text-sm border border-gray-200 bg-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  {sendError && (
                    <p className="text-xs text-red-600">{sendError}</p>
                  )}
                  {sendEmailWarning && (
                    <p className="text-xs text-amber-600">Réponse enregistrée mais l&apos;email n&apos;a pas pu être envoyé au client (Resend).</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-500">
                      Un e-mail sera envoyé au client lors de votre réponse.
                    </p>
                    <button
                      type="submit"
                      disabled={!reply.trim() || sending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {sending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      {sending ? 'Envoi…' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="border-t border-gray-100 px-5 py-3 bg-green-50 flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-600 shrink-0" />
                  <p className="text-xs text-green-700 font-medium">Ce ticket est résolu.</p>
                  <button
                    onClick={() => handleStatusChange('ouvert')}
                    className="ml-auto text-xs text-green-700 underline hover:no-underline"
                  >
                    Rouvrir
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bulle de message ────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isAdmin = msg.author === 'admin';
  return (
    <div className={`flex gap-2.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
        isAdmin ? 'bg-blue-100' : 'bg-gray-100'
      }`}>
        {isAdmin
          ? <Shield size={13} className="text-blue-600" />
          : <User size={13} className="text-gray-500" />
        }
      </div>
      <div className={`max-w-[80%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isAdmin
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-gray-500 px-1">
          {isAdmin ? 'Admin · ' : 'Client · '}
          {new Date(msg.created_at).toLocaleString('fr-FR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
          {isAdmin && (
            <span className={`ml-1.5 font-medium ${msg.client_read ? 'text-emerald-600' : 'text-amber-600'}`}>
              · {msg.client_read ? 'Lu' : 'Non lu'}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// ── Sélecteur de statut (dropdown) ─────────────────────────

function StatusSelector({ current, loading, onChange }: {
  current: TicketStatus;
  loading: boolean;
  onChange: (s: TicketStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[current];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${cfg.bg} ${cfg.text} border-current/20`}
      >
        <Circle size={7} className="fill-current" />
        {cfg.label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
          {(Object.entries(STATUS_CFG) as [TicketStatus, typeof STATUS_CFG[TicketStatus]][]).map(([val, c]) => (
            <button
              key={val}
              type="button"
              onClick={() => { onChange(val); setOpen(false); }}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                val === current ? 'font-semibold' : ''
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
