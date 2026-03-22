'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import {
  MailCheck, ChevronDown, ChevronUp, HelpCircle, MessageSquare,
  ExternalLink, Building2, Users, CalendarDays, Wallet,
  Search, ArrowRight, FileText, AlertTriangle,
  Send, RefreshCw, User, Shield, Clock, CheckCircle, X,
} from 'lucide-react';

// ── Catégories FAQ ───────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; bg: string; text: string }> = {
  legal:    { label: 'Légal',       bg: 'bg-purple-100', text: 'text-purple-700' },
  ag:       { label: 'Assemblées',  bg: 'bg-blue-100',   text: 'text-blue-700' },
  finances: { label: 'Finances',    bg: 'bg-green-100',  text: 'text-green-700' },
  app:      { label: 'Application', bg: 'bg-amber-100',  text: 'text-amber-700' },
};

// ── Guides de démarrage rapide ───────────────────────────────
const GUIDES = [
  { icon: Building2,     label: 'Créer une copropriété',       href: '/coproprietes/nouvelle', color: 'bg-blue-50 text-blue-600' },
  { icon: Users,         label: 'Inviter des copropriétaires', href: '/coproprietaires',       color: 'bg-purple-50 text-purple-600' },
  { icon: CalendarDays,  label: 'Planifier une AG',            href: '/assemblees',            color: 'bg-green-50 text-green-600' },
  { icon: Wallet,        label: 'Émettre un appel de fonds',   href: '/appels-de-fonds',       color: 'bg-amber-50 text-amber-600' },
  { icon: FileText,      label: 'Gérer les documents',         href: '/documents',             color: 'bg-teal-50 text-teal-600' },
  { icon: AlertTriangle, label: 'Signaler un incident',        href: '/incidents',             color: 'bg-red-50 text-red-600' },
];

// ── Sujets prédéfinis ────────────────────────────────────────
const SUBJECT_CHIPS = [
  'Question technique',
  'Problème de facturation',
  'Question juridique',
  "Suggestion d'amélioration",
  'Autre',
];

const MAX_MESSAGE = 3000;

// ── Types support ────────────────────────────────────────────
type TicketStatus = 'ouvert' | 'en_cours' | 'resolu';
interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}
interface SupportMessage {
  id: string;
  author: 'client' | 'admin';
  content: string;
  created_at: string;
}

const STATUS_CFG: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  ouvert:   { label: 'Ouvert',   bg: 'bg-blue-50',  text: 'text-blue-700'  },
  en_cours: { label: 'En cours', bg: 'bg-amber-50', text: 'text-amber-700' },
  resolu:   { label: 'Résolu',   bg: 'bg-green-50', text: 'text-green-700' },
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {status === 'resolu' ? <CheckCircle size={9} /> : <Clock size={9} />}
      {c.label}
    </span>
  );
}

// ── Données FAQ ──────────────────────────────────────────────
const FAQ: { question: string; answer: string; category: keyof typeof CATEGORIES }[] = [
  {
    category: 'legal',
    question: "Qui peut être syndic bénévole ?",
    answer: "Tout copropriétaire peut devenir syndic bénévole de sa propre copropriété, sans conditions de diplôme ni de carte professionnelle. La loi Hoguet exige une carte professionnelle uniquement pour les syndics professionnels. Le syndic bénévole doit simplement être élu en AG par les copropriétaires.",
  },
  {
    category: 'legal',
    question: "Quelle est la durée du mandat d'un syndic bénévole ?",
    answer: "Le mandat du syndic est voté en Assemblée Générale. Sa durée maximale est de 3 ans (renouvelable). En pratique, la plupart des copropriétés l'élisent pour 1 ou 2 ans afin de renouveler régulièrement la confiance.",
  },
  {
    category: 'legal',
    question: "Le syndic bénévole peut-il être rémunéré ?",
    answer: "Non, le syndic bénévole n'est pas rémunéré pour sa gestion courante. Il peut cependant percevoir un remboursement de frais engagés pour la copropriété (timbres, déplacements…) à condition que ces remboursements soient votés par l'AG et justifiés.",
  },
  {
    category: 'legal',
    question: "Quelles sont les obligations légales d'un syndic bénévole ?",
    answer: "Le syndic bénévole a les mêmes obligations qu'un syndic professionnel : tenir un compte séparé au nom du syndicat des copropriétaires, convoquer au minimum une AG par an, établir et soumettre le budget prévisionnel, tenir à jour le registre des copropriétaires, et souscrire une assurance responsabilité civile.",
  },
  {
    category: 'ag',
    question: "Comment convoquer une Assemblée Générale ?",
    answer: "La convocation doit être envoyée au moins 21 jours avant la date de l'AG (ou 15 jours si votre règlement de copropriété le prévoit). Elle doit contenir l'ordre du jour, les documents nécessaires aux votes (état des charges, budget…), et être envoyée par lettre recommandée ou par voie dématérialisée si les copropriétaires y ont consenti. Notre application génère automatiquement ce document.",
  },
  {
    category: 'finances',
    question: "Comment calculer les charges en tantièmes ?",
    answer: "Les charges générales sont réparties au prorata des tantièmes de chaque lot, définis dans le règlement de copropriété. Par exemple, un lot disposant de 150 tantièmes sur 1 000 supportera 15 % des charges générales. L'application calcule automatiquement les quotes-parts à partir des tantièmes renseignés.",
  },
  {
    category: 'finances',
    question: "Faut-il ouvrir un compte bancaire au nom de la copropriété ?",
    answer: "Oui, c'est obligatoire. La loi ALUR de 2014 impose au syndic d'ouvrir un compte séparé au nom du syndicat des copropriétaires dès lors que la copropriété compte plus de 15 lots. En dessous de ce seuil, une dispense peut être accordée par l'AG à l'unanimité.",
  },
  {
    category: 'finances',
    question: "Comment gérer les impayés de charges ?",
    answer: "En cas d'impayé, le syndic doit d'abord adresser une mise en demeure par lettre recommandée. Sans réponse, il peut saisir le président du tribunal judiciaire par une procédure d'injonction de payer, sans avocat obligatoire. La créance est garantie par le privilège immobilier spécial sur le lot du débiteur.",
  },
  {
    category: 'legal',
    question: "Comment déclarer un sinistre sur les parties communes ?",
    answer: "Le syndic doit déclarer le sinistre à l'assureur de la copropriété dans les 5 jours ouvrés suivant sa connaissance (ou 2 jours pour un vol). La déclaration mentionne la nature du sinistre, sa date approximative, les parties touchées et les premiers éléments de constat. Conservez bien tous les justificatifs et photos.",
  },
  {
    category: 'app',
    question: "L'application fonctionne-t-elle sur mobile ?",
    answer: "L'interface est intégralement responsive et s'adapte aux smartphones et tablettes. Vous pouvez consulter les données, gérer les incidents et accéder aux documents depuis n'importe quel appareil connecté.",
  },
  {
    category: 'app',
    question: "Comment exporter ou archiver mes données ?",
    answer: "Les documents générés (convocations, PV, appels de fonds) sont au format PDF et peuvent être téléchargés à tout moment depuis chaque section. Un export global de vos données est disponible dans les paramètres de votre compte.",
  },
  {
    category: 'app',
    question: "Mes données sont-elles sécurisées ?",
    answer: "Les données sont hébergées sur des serveurs européens (Supabase — Union Européenne), chiffrées en transit (HTTPS/TLS) et au repos (AES-256). L'accès est protégé par une authentification sécurisée. Nous ne revendons aucune donnée à des tiers.",
  },
];

// ── Composant accordéon FAQ ──────────────────────────────────
function FaqItem({ question, answer, category, defaultOpen = false }: {
  question: string; answer: string; category: keyof typeof CATEGORIES; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cat = CATEGORIES[category];
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 py-4 text-left group"
      >
        <div className="flex items-start gap-2 min-w-0">
          <span className={`mt-0.5 shrink-0 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
            {cat.label}
          </span>
          <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
            {question}
          </span>
        </div>
        {open
          ? <ChevronUp size={15} className="shrink-0 mt-1 text-blue-500" />
          : <ChevronDown size={15} className="shrink-0 mt-1 text-gray-400 group-hover:text-blue-400" />
        }
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-600 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default function AidePage() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [userId, setUserId]   = useState<string | null>(null);

  // Tickets support
  const [tickets, setTickets]               = useState<Ticket[]>([]);
  const [openTicketId, setOpenTicketId]     = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [replyText, setReplyText]           = useState('');
  const [replySending, setReplySending]     = useState(false);
  const [replyError, setReplyError]         = useState('');
  const [unreadTicketIds, setUnreadTicketIds] = useState<Set<string>>(new Set());

  // Recherche + filtre catégorie FAQ
  const [search, setSearch]       = useState('');
  const [activecat, setActivecat] = useState<string>('all');

  // Pré-remplissage depuis la session + chargement tickets
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
      if (user?.id)    setUserId(user.id);
    });
    supabase.from('profiles').select('full_name').maybeSingle().then(({ data }) => {
      if (data?.full_name) setName(data.full_name);
    });
  }, []);

  // Charger les tickets dès qu'on a le userId
  useEffect(() => {
    if (!userId) return;
    setTicketsLoading(true);
    const supabase = createClient();
    Promise.all([
      supabase
        .from('support_tickets')
        .select('id, subject, status, created_at, updated_at')
        .order('updated_at', { ascending: false }),
      supabase
        .from('support_messages')
        .select('ticket_id')
        .eq('author', 'admin')
        .eq('client_read', false),
    ]).then(([{ data: ticketsData }, { data: unreadData }]) => {
      setTickets(ticketsData ?? []);
      setUnreadTicketIds(new Set((unreadData ?? []).map((m) => m.ticket_id)));
      setTicketsLoading(false);
    });
  }, [userId]);

  const loadMessages = async (ticketId: string) => {
    setLoadingMsgs(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('support_messages')
        .select('id, author, content, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      setTicketMessages((data as SupportMessage[]) ?? []);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleOpenTicket = async (id: string) => {
    if (openTicketId === id) { setOpenTicketId(null); return; }
    setOpenTicketId(id);
    setTicketMessages([]);
    setReplyText('');
    setReplyError('');
    // Marquer les messages de ce ticket comme lus (optimiste)
    if (unreadTicketIds.has(id)) {
      setUnreadTicketIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetch('/api/support/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id }),
      }).catch(() => { /* on ignore l'erreur, non bloquant */ });
    }
    await loadMessages(id);
  };

  const handleClientReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openTicketId || !replyText.trim() || replySending) return;
    setReplySending(true);
    setReplyError('');
    try {
      const res = await fetch('/api/support/client-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: openTicketId, message: replyText.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message ?? 'Erreur');
      }
      setReplyText('');
      setTicketMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        author: 'client',
        content: replyText.trim(),
        created_at: new Date().toISOString(),
      }]);
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setReplySending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, userId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSent(true);
      // Ajouter le nouveau ticket à la liste
      if (data.ticketId) {
        setTickets((prev) => [{
          id: data.ticketId,
          subject: subject.trim(),
          status: 'ouvert',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev]);
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer ou nous contacter directement par email.');
    } finally {
      setLoading(false);
    }
  };
  const filteredFaq = useMemo(() => {
    const q = search.toLowerCase();
    return FAQ.filter((item) => {
      const matchCat    = activecat === 'all' || item.category === activecat;
      const matchSearch = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activecat]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">

      {/* ── En-tête ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aide & Contact</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Guides de démarrage, questions fréquentes et formulaire de contact.
        </p>
      </div>

      {/* ── Raccourcis rapides ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Démarrage rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {GUIDES.map(({ icon: Icon, label, href, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all text-center group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 leading-tight">{label}</span>
              <ArrowRight size={11} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mes tickets support ── */}
      {(tickets.length > 0 || ticketsLoading) && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <MessageSquare size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Mes tickets support</h2>
              <p className="text-xs text-gray-400">Historique de vos demandes</p>
            </div>
          </div>
          {ticketsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
              <RefreshCw size={14} className="animate-spin" /> Chargement…
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Header ticket */}
                  <button
                    type="button"
                    onClick={() => handleOpenTicket(ticket.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <MessageSquare size={14} className="text-gray-400" />
                        {unreadTicketIds.has(ticket.id) && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</span>
                      {unreadTicketIds.has(ticket.id) && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white leading-none">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={ticket.status} />
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                      {openTicketId === ticket.id
                        ? <ChevronUp size={14} className="text-gray-400" />
                        : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Conversation */}
                  {openTicketId === ticket.id && (
                    <div className="border-t border-gray-100">
                      {loadingMsgs ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400 px-4 py-4">
                          <RefreshCw size={12} className="animate-spin" /> Chargement…
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 px-4 py-4 bg-gray-50/50">
                          {ticketMessages.map((msg) => {
                            const isAdmin = msg.author === 'admin';
                            return (
                              <div key={msg.id} className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                  isAdmin ? 'bg-blue-100' : 'bg-gray-200'
                                }`}>
                                  {isAdmin
                                    ? <Shield size={11} className="text-blue-600" />
                                    : <User size={11} className="text-gray-500" />}
                                </div>
                                <div className={`max-w-[85%] flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                                  <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                                    isAdmin
                                      ? 'bg-blue-600 text-white rounded-tr-sm'
                                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                                  }`}>
                                    {msg.content}
                                  </div>
                                  <span className="text-[10px] text-gray-400 px-1">
                                    {isAdmin ? 'Support · ' : 'Vous · '}
                                    {new Date(msg.created_at).toLocaleString('fr-FR', {
                                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Répondre (sauf si résolu) */}
                      {ticket.status !== 'resolu' && (
                        <form onSubmit={handleClientReply} className="border-t border-gray-100 px-4 py-3 flex gap-2 items-end bg-white">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Ajouter un message…"
                            rows={2}
                            className="flex-1 resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim() || replySending}
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            {replySending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                            {replySending ? 'Envoi…' : 'Envoyer'}
                          </button>
                        </form>
                      )}
                      {replyError && <p className="text-xs text-red-600 px-4 pb-2">{replyError}</p>}
                      {ticket.status === 'resolu' && (
                        <div className="border-t border-gray-100 px-4 py-2.5 bg-green-50 flex items-center gap-2">
                          <CheckCircle size={12} className="text-green-600" />
                          <p className="text-xs text-green-700">Ce ticket est marqué comme résolu.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Formulaire de contact */}
        <div className="md:col-span-2">
          <Card padding="lg">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <MessageSquare size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Envoyer un message</h2>
                <p className="text-xs text-gray-400">Nous répondons sous 24 h (jours ouvrés)</p>
              </div>
            </div>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <MailCheck size={28} className="text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">Message envoyé !</p>
                <p className="text-sm text-gray-500 max-w-xs">
                  Merci pour votre message. Notre équipe vous répondra dans les meilleurs délais.
                </p>
                <button
                  onClick={() => { setSent(false); setSubject(''); setMessage(''); }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Votre nom"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Dupont"
                    required
                  />
                  <Input
                    label="Adresse email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean@copropriete.fr"
                    required
                  />
                </div>

                {/* Chips de sujets rapides */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Sujet rapide</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SUBJECT_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setSubject(chip)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          subject === chip
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <Input
                    label="Ou saisissez votre sujet"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex : Question sur les appels de fonds"
                    required
                  />
                </div>

                <div>
                  <Textarea
                    label="Votre message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                    placeholder="Décrivez votre question ou problème en détail…"
                    rows={5}
                    required
                  />
                  <p className={`text-right text-xs mt-1 ${message.length > MAX_MESSAGE * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {message.length} / {MAX_MESSAGE}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading}>
                  Envoyer le message
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Contact direct</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare size={13} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Email support</p>
                  <a href="mailto:contact@mon-syndic-benevole.fr" className="text-xs text-blue-600 hover:underline">
                    contact@mon-syndic-benevole.fr
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                  <MailCheck size={13} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Délai de réponse</p>
                  <p className="text-xs text-gray-500">Sous 24 h, lun – ven 9 h – 18 h</p>
                </div>
              </li>
            </ul>
          </Card>

          <Card padding="md">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Ressources officielles</h3>
            <ul className="space-y-2">
              {[
                { label: 'Legifrance – loi du 10 juillet 1965', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000508853' },
                { label: 'ANIL – fiche syndic bénévole',        url: 'https://www.anil.org/votre-projet/vous-etes-proprietaire/syndic-benevole/' },
                { label: 'Service-public.fr – copropriété',     url: 'https://www.service-public.fr/particuliers/vosdroits/N31337' },
              ].map(({ label, url }) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink size={11} className="shrink-0" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <HelpCircle size={16} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Questions fréquentes</h2>
            <p className="text-xs text-gray-400">Sur le syndic bénévole et l&apos;application</p>
          </div>
        </div>

        {/* Barre de recherche + filtres catégories */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une question…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActivecat('all')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activecat === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              Toutes
            </button>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setActivecat(key === activecat ? 'all' : key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activecat === key ? `${cat.bg} ${cat.text} border-transparent` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filteredFaq.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Aucune question trouvée.{' '}
            <button onClick={() => { setSearch(''); setActivecat('all'); }} className="text-blue-600 hover:underline">
              Réinitialiser
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card padding="md">
              {filteredFaq.slice(0, Math.ceil(filteredFaq.length / 2)).map((item, i) => (
                <FaqItem key={i} {...item} defaultOpen={i === 0 && !search} />
              ))}
            </Card>
            <Card padding="md">
              {filteredFaq.slice(Math.ceil(filteredFaq.length / 2)).map((item, i) => (
                <FaqItem key={i} {...item} />
              ))}
            </Card>
          </div>
        )}
      </div>

    </div>
  );
}
