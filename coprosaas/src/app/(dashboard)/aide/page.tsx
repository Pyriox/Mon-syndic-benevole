'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import {
  MailCheck, ChevronDown, ChevronUp, HelpCircle, MessageSquare,
  ExternalLink, Search,
  Send, RefreshCw, User, Shield, Clock, CheckCircle,
  BookOpen, Info,
} from 'lucide-react';

// ── Catégories FAQ ───────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; bg: string; text: string }> = {
  demarrage: { label: 'Démarrage',   bg: 'bg-blue-100',   text: 'text-blue-700' },
  finances:  { label: 'Finances',    bg: 'bg-green-100',  text: 'text-green-700' },
  ag:        { label: 'Assemblées',  bg: 'bg-indigo-100', text: 'text-indigo-700' },
  app:       { label: 'Application', bg: 'bg-amber-100',  text: 'text-amber-700' },
};

// ── Sujets prédéfinis ────────────────────────────────────────
const SUBJECT_CHIPS = [
  'Question technique',
  'Problème de facturation',
  'Question juridique',
  "Suggestion d'amélioration",
  'Autre',
];

const SUBJECT_CHIPS_COPRO = [
  'Question sur mon solde',
  'Document ou convocation',
  'Problème de connexion',
  'Signaler une anomalie',
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
    category: 'demarrage',
    question: "Par où commencer après la création de mon compte ?",
    answer: "L'ordre idéal est : (1) créer votre copropriété (nom, adresse) ; (2) ajouter vos lots avec les tantièmes ; (3) ajouter vos copropriétaires et les associer à leurs lots ; (4) émettre votre premier appel de fonds.",
  },
  {
    category: 'demarrage',
    question: "Je prends la gestion en cours d'année — que faire des appels de fonds déjà émis ?",
    answer: "Ressaisissez les appels de fonds de l'année en cours (même un seul appel global couvrant les trimestres passés) et marquez directement comme payés les versements déjà encaissés après publication. Le tableau de bord affichera ainsi les bons soldes et impayés dès le premier jour. Pour les copropriétaires qui avaient un solde sur l'ancien outil, utilisez le champ « Solde à la reprise » lors de leur ajout.",
  },
  {
    category: 'demarrage',
    question: "Comment inviter mes copropriétaires sur la plateforme ?",
    answer: "Depuis la page Copropriétaires, cliquez sur le bouton « Inviter » en face de chaque copropriétaire. Un e-mail leur sera envoyé avec un lien d'accès à leur espace personnel (solde, documents, convocations AG). L'invitation est facultative : la plateforme fonctionne pleinement sans que les copropriétaires soient connectés.",
  },
  {
    category: 'demarrage',
    question: "Comment gérer plusieurs copropriétés depuis un seul compte ?",
    answer: "Depuis le sélecteur de copropriété en haut à gauche du tableau de bord, vous pouvez créer ou basculer d'une copropriété à l'autre. Chaque copropriété a son propre abonnement et ses propres données, entièrement cloisonnées.",
  },
  {
    category: 'finances',
    question: "Comment émettre un premier appel de fonds ?",
    answer: "Depuis « Appels de fonds », cliquez sur « Créer ». Si vous avez déjà une AG terminée avec un budget approuvé, l'application la présélectionne automatiquement et importe le budget. Sinon, choisissez « Appel exceptionnel sans AG » pour saisir le montant et la date librement. La répartition par tantièmes est calculée automatiquement.",
  },
  {
    category: 'finances',
    question: "Comment enregistrer une dépense et la répartir entre copropriétaires ?",
    answer: "Depuis la page « Dépenses », ajoutez la dépense avec sa catégorie et son montant. La répartition au prorata des tantièmes est calculée instantanément. Vous pouvez ensuite marquer les paiements reçus un par un ou en masse.",
  },
  {
    category: 'finances',
    question: "Comment suivre les impayés ?",
    answer: "Le tableau de bord affiche un récapitulatif des impayés avec un indicateur d'alerte. Chaque copropriétaire dispose d'un solde mis à jour en temps réel. Depuis la page Appels de fonds, vous pouvez voir le statut de paiement de chaque ligne et envoyer un rappel si nécessaire.",
  },
  {
    category: 'finances',
    question: "Comment fonctionne la régularisation annuelle des charges ?",
    answer: "En fin d'exercice, depuis la page « Régularisation », l'application compare les provisions appelées et les dépenses réelles pour calculer automatiquement le solde de chaque copropriétaire (complément à payer ou trop-perçu à rembourser). La régularisation est disponible à partir du 1er janvier de l'année suivante.",
  },
  {
    category: 'ag',
    question: "Comment créer et envoyer une convocation d'AG ?",
    answer: "Depuis « Assemblées », créez une AG (type, date, lieu) et ajoutez les résolutions à l'ordre du jour. Une fois planifiée, le bouton « Envoyer la convocation » génère un PDF et l'envoie par e-mail à tous les copropriétaires. Le délai légal est de 21 jours avant la date de l'AG.",
  },
  {
    category: 'ag',
    question: "Les appels de fonds votés en AG sont-ils générés automatiquement ?",
    answer: "Non, il faut les créer manuellement depuis « Appels de fonds » — mais c'est très rapide : l'application importe automatiquement le budget et le calendrier approuvés, pré-remplit les montants et propose le 1er janvier de l'année suivante comme date par défaut. Il suffit de vérifier et de publier.",
  },
  {
    category: 'app',
    question: "Comment modifier ou supprimer un élément créé par erreur ?",
    answer: "La plupart des éléments (copropriétaires, lots, dépenses, appels de fonds en préparation, résolutions) sont modifiables ou supprimables depuis leur liste. Les appels de fonds déjà émis ne peuvent plus être supprimés directement pour conserver l'historique comptable : contactez le support si vous avez besoin d'une correction.",
  },
  {
    category: 'app',
    question: 'Où régler les tantièmes et les clés de répartition spéciales ?',
    answer: 'Depuis la page de la copropriété, ouvrez « Paramétrage », puis l’onglet « Répartition des charges ». C’est ici que vous ajustez les tantièmes généraux, ajoutez les clés spéciales (ascenseur, bâtiment, parking…) et vérifiez les bases utilisées dans les appels de fonds, les dépenses et la régularisation.',
  },
];

const FAQ_COPRO: { question: string; answer: string; category: keyof typeof CATEGORIES }[] = [
  {
    category: 'demarrage',
    question: 'Comment accéder à ma copropriété et retrouver mes informations ?',
    answer: 'Depuis le menu de navigation, vous retrouvez votre tableau de bord, vos lots, vos documents et vos informations de profil. Si vous avez accès à plusieurs copropriétés, utilisez le sélecteur en haut à gauche.',
  },
  {
    category: 'finances',
    question: 'Comment consulter mon solde et mes appels de fonds ?',
    answer: 'Le tableau de bord affiche votre solde en temps réel et les charges à régler. La page « Appels de fonds » vous permet de consulter vos échéances, leur statut et les montants déjà réglés ou encore dus.',
  },
  {
    category: 'finances',
    question: 'Pourquoi mon solde est-il en rouge ou en vert ?',
    answer: 'Un solde en rouge signifie qu’un montant reste à payer. Un solde en vert signifie au contraire qu’une avance ou un crédit est enregistré en votre faveur.',
  },
  {
    category: 'ag',
    question: 'Où retrouver ma convocation d’AG ou le procès-verbal ?',
    answer: 'Les convocations, procès-verbaux et autres documents partagés sont disponibles dans la page « Documents ». Vous n’y voyez que les fichiers auxquels vous avez accès.',
  },
  {
    category: 'ag',
    question: 'Comment connaître la date de la prochaine AG ?',
    answer: 'La prochaine assemblée générale apparaît sur votre tableau de bord dès qu’elle est planifiée. Vous pouvez également consulter la page « Assemblées » pour retrouver la date, le lieu et les résolutions.',
  },
  {
    category: 'finances',
    question: 'À quoi correspond la régularisation annuelle ?',
    answer: 'En fin d’exercice, le syndic compare les provisions appelées et les dépenses réelles. Si le résultat est négatif, un complément reste à payer ; s’il est positif, un crédit est enregistré en votre faveur.',
  },
  {
    category: 'app',
    question: 'Je ne vois pas un document ou un avis de fonds, que faire ?',
    answer: 'Vérifiez d’abord que la bonne copropriété est sélectionnée. Si un document manque encore, contactez votre syndic ou utilisez le formulaire de support sur cette page.',
  },
  {
    category: 'app',
    question: 'Comment poser une question ou signaler un problème ?',
    answer: 'Depuis cette page, vous pouvez envoyer un message au support. Si votre demande concerne votre dossier ou votre copropriété, pensez à préciser le contexte afin de recevoir une réponse plus rapide.',
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
  const router = useRouter();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [userId, setUserId]   = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'syndic' | 'copropriétaire' | null>(null);
  const [selectedCoproName, setSelectedCoproName] = useState('');

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

  // Pré-remplissage depuis la session + détection du contexte utilisateur
  useEffect(() => {
    let cancelled = false;

    const readCookie = (key: string) => {
      if (typeof document === 'undefined') return null;
      const value = document.cookie
        .split('; ')
        .find((item) => item.startsWith(`${key}=`))
        ?.split('=')[1];
      return value ?? null;
    };

    const loadUserContext = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;

      if (user?.email) setEmail(user.email);
      if (user?.id) setUserId(user.id);

      const selectedCoproId = readCookie('selected_copro_id');

      const profileQuery = supabase.from('profiles').select('full_name').maybeSingle();
      const syndicQuery = selectedCoproId
        ? supabase.from('coproprietes').select('id, nom').eq('id', selectedCoproId).eq('syndic_id', user?.id ?? '').maybeSingle()
        : supabase.from('coproprietes').select('id, nom').eq('syndic_id', user?.id ?? '').maybeSingle();
      const coproQuery = selectedCoproId
        ? supabase.from('coproprietaires').select('id').eq('copropriete_id', selectedCoproId).eq('user_id', user?.id ?? '').maybeSingle()
        : supabase.from('coproprietaires').select('id').eq('user_id', user?.id ?? '').maybeSingle();

      const [{ data: profile }, { data: syndicCopro }, { data: coproMember }] = await Promise.all([
        profileQuery,
        syndicQuery,
        coproQuery,
      ]);

      if (cancelled) return;

      if (profile?.full_name) setName(profile.full_name);
      if (syndicCopro?.nom) setSelectedCoproName(syndicCopro.nom);

      if (syndicCopro) {
        setUserRole('syndic');
      } else if (coproMember) {
        setUserRole('copropriétaire');
      }
    };

    loadUserContext().catch(() => undefined);

    return () => {
      cancelled = true;
    };
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
      }).then(() => {
        // Rafraîchit les Server Components (layout) pour vider la cloche
        router.refresh();
      }).catch(() => { /* non bloquant */ });
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
  const isCoproView = userRole === 'copropriétaire';
  const faqItems = isCoproView ? FAQ_COPRO : FAQ;
  const subjectChips = isCoproView ? SUBJECT_CHIPS_COPRO : SUBJECT_CHIPS;
  const resourceLinks = isCoproView
    ? [
        { label: 'Service Public – acteurs de la copropriété', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/N31338' },
        { label: 'ANIL – en copropriété', url: 'https://www.anil.org/votre-besoin/gerer-un-bien/copropriete/' },
        { label: 'ANIL – assemblée générale des copropriétaires', url: 'https://www.anil.org/votre-besoin/gerer-un-bien/copropriete/assemblee-generale/' },
      ]
    : [
        { label: 'Legifrance – loi du 10 juillet 1965', url: 'https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006068256' },
        { label: 'ANIL – le syndic en copropriété', url: 'https://www.anil.org/votre-besoin/gerer-un-bien/copropriete/syndic/' },
        { label: 'Service Public – syndic de copropriété', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2608' },
      ];
  const cycleSteps = isCoproView
    ? [
        {
          num: '1',
          color: 'bg-blue-100 text-blue-700',
          title: 'Consultez votre solde et vos échéances',
          body: 'Votre tableau de bord vous indique immédiatement si un appel de fonds reste à régler et vous permet de suivre vos montants dus ou vos éventuels crédits.',
        },
        {
          num: '2',
          color: 'bg-purple-100 text-purple-700',
          title: 'Retrouvez vos documents partagés',
          body: 'La page « Documents » vous donne accès aux avis de fonds, convocations d’AG, procès-verbaux et autres fichiers que le syndic partage avec vous.',
        },
        {
          num: '3',
          color: 'bg-green-100 text-green-700',
          title: 'Suivez les assemblées générales',
          body: 'Dès qu’une AG est planifiée, vous retrouvez la date et les documents associés dans votre espace. Les convocations et PV restent consultables en ligne.',
        },
        {
          num: '4',
          color: 'bg-amber-100 text-amber-700',
          title: 'Contactez le support si besoin',
          body: 'Si vous constatez une anomalie ou un document manquant, utilisez le formulaire ci-dessous pour nous écrire. Nous pourrons vous guider rapidement.',
        },
      ]
    : [
        {
          num: '1',
          color: 'bg-purple-100 text-purple-700',
          title: "L'AG vote le budget prévisionnel",
          body: "Chaque année, l'Assemblée Générale vote le budget de l'exercice suivant. Ex : l'AG de juin 2026 vote le budget 2027.",
        },
        {
          num: '2',
          color: 'bg-blue-100 text-blue-700',
          title: 'Le syndic crée les appels de fonds',
          body: "Dans « Appels de fonds », créez une série liée à l'AG : 4 appels trimestriels avec des échéances en 2027 (01/01, 01/04, 01/07, 01/10). Les quotes-parts sont calculées automatiquement selon les tantièmes.",
        },
        {
          num: '3',
          color: 'bg-amber-100 text-amber-700',
          title: 'Publiez et notifiez les copropriétaires',
          body: "À la publication, chaque copropriétaire reçoit son avis de paiement par email. Son solde est débité automatiquement. Marquez chaque paiement reçu pour mettre à jour les soldes en temps réel.",
        },
        {
          num: '4',
          color: 'bg-green-100 text-green-700',
          title: "Le dashboard reflète l'exercice en cours",
          body: "Les provisions 2027, les dépenses réelles et l'écart prévisionnel s'affichent automatiquement dès que les données sont saisies. Le solde impayé = somme des soldes négatifs des copropriétaires.",
        },
        {
          num: '5',
          color: 'bg-orange-100 text-orange-700',
          title: "Régularisation en fin d'exercice",
          body: "En fin d'année, comparez les provisions appelées aux dépenses réelles. Si écart positif → trop-perçu à rembourser ou reporter. Si négatif → appel complémentaire à émettre.",
        },
      ];

  const filteredFaq = useMemo(() => {
    const q = search.toLowerCase();
    return faqItems.filter((item) => {
      const matchCat    = activecat === 'all' || item.category === activecat;
      const matchSearch = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activecat, faqItems]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">

      {/* ── En-tête ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isCoproView ? 'Aide copropriétaire' : 'Aide & Contact'}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {isCoproView
            ? `Réponses utiles pour consulter votre espace, vos documents et votre solde${selectedCoproName ? ` — ${selectedCoproName}` : ''}.`
            : 'Retrouvez ici les réponses essentielles sur la gestion, l’application et le support.'}
        </p>
      </div>

      {isCoproView && (
        <Card className="border-blue-200 bg-blue-50/70">
          <div className="flex items-start gap-3">
            <Info size={18} className="shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Dans votre espace copropriétaire</p>
              <p className="text-sm text-blue-800 mt-1">
                Vous pouvez consulter votre solde, télécharger vos documents partagés, suivre les assemblées générales et contacter le support si nécessaire.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── FAQ ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <HelpCircle size={16} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Questions fréquentes</h2>
            <p className="text-xs text-gray-400">
              {isCoproView ? 'Réponses utiles pour votre espace copropriétaire' : "Questions sur le syndic bénévole et l'application"}
            </p>
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

      {/* ── Support : tickets + formulaire ── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <MessageSquare size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Support</h2>
            <p className="text-xs text-gray-400">
              {isCoproView ? 'Questions sur votre espace, vos documents ou votre accès' : 'Vos demandes et notre formulaire de contact'}
            </p>
          </div>
        </div>

        {/* Mes tickets support */}
        {(tickets.length > 0 || ticketsLoading) && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Mes tickets</p>
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

        {/* Formulaire + sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Formulaire de contact */}
          <div className="md:col-span-2">
            <Card padding="lg">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MessageSquare size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Envoyer un message</h3>
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
                      {subjectChips.map((chip) => (
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
                    <p className={`text-right text-xs mt-1 ${message.length > MAX_MESSAGE * 0.9 ? 'text-amber-700' : 'text-gray-500'}`}>
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
                    <MailCheck size={13} className="text-green-600" />
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
                {resourceLinks.map(({ label, url }) => (
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
      </div>

      {/* ── Cycle annuel ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <BookOpen size={16} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isCoproView ? 'Comprendre votre espace copropriétaire' : 'Comprendre le cycle annuel'}
            </h2>
            <p className="text-xs text-gray-400">
              {isCoproView ? 'Solde · Documents · Assemblées · Support' : 'AG · Appels de fonds · Dashboard · Régularisation'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-0">
          {cycleSteps.map((step, i, arr) => (
            <div key={step.num} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.color}`}>
                  {step.num}
                </div>
                {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
              </div>
              <div className="pb-5 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}

          {!isCoproView && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-2">
              <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Première année sur Mon Syndic Bénévole ?</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Les appels de fonds de l'exercice en cours ont probablement été gérés sur une autre plateforme.
                  Vous pouvez les re-saisir manuellement (même sous la forme d’un seul appel global annuel) pour que le tableau de bord
                  affiche les bonnes provisions et les bons impayés. Les T1/T2 déjà réglés peuvent être marqués comme payés
                  directement après publication.
                </p>
                <a
                  href="/blog/migrer-vers-mon-syndic-benevole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
                >
                  Lire le guide de migration complet →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
