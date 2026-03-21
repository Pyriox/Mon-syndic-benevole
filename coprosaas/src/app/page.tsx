// ============================================================
// Page d'accueil publique — Landing page de Syndic-Benevole.eu
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import {
  Building2, CheckCircle, Users, Receipt, CalendarDays,
  AlertTriangle, FileText, Wallet, ArrowRight,
  Shield, Scale, ArrowUp, BellRing, Banknote,
  LayoutDashboard, HelpCircle, UserCircle, LogOut, CreditCard,
  X, Clock,
} from 'lucide-react';
import SiteLogo from '@/components/ui/SiteLogo';
import LandingNav from './LandingNav';
import LandingStickyCTA from './LandingStickyCTA';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';

// ── Métadonnées spécifiques à la page d'accueil ──────────────
export const metadata: Metadata = {
  title: {
    absolute: 'Logiciel de gestion de copropriété pour syndic bénévole | Mon Syndic Bénévole',
  },
  description:
    'Logiciel syndic bénévole : gérez charges, appels de fonds, AG, documents et incidents depuis un seul outil. 14 jours gratuits, puis à partir de 300 €/an.',
  keywords: [
    'syndic bénévole',
    'logiciel syndic bénévole',
    'gestion copropriété sans syndic professionnel',
    'appel de fonds copropriété',
    'assemblée générale copropriété',
    'charges copropriété logiciel',
    'tantièmes millièmes',
  ],
  alternates: { canonical: 'https://mon-syndic-benevole.fr' },
  openGraph: {
    title: 'Logiciel de gestion de copropriété pour syndic bénévole | Mon Syndic Bénévole',
    description:
      'Logiciel syndic bénévole : gérez charges, appels de fonds, AG, documents et incidents depuis un seul outil. 14 jours gratuits, puis à partir de 300 €/an.',
    url: 'https://mon-syndic-benevole.fr',
    siteName: 'Mon Syndic Bénévole',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Mon Syndic Bénévole — Logiciel de gestion de copropriété pour syndic bénévole',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Logiciel de gestion de copropriété pour syndic bénévole | Mon Syndic Bénévole',
    description:
      'Logiciel syndic bénévole : charges, appels de fonds, AG et documents. 14 jours gratuits, puis 300 €/an.',
    images: ['/opengraph-image'],
  },
};

const planFeatures = [
  'Copropriétaires illimités',
  'Suivi des dépenses & répartition automatique',
  'Appels de fonds PDF & e-mail',
  'Assemblées Générales complètes (votes, PV)',
  'Convocations & PV envoyés par e-mail',
  'Gestion documentaire par dossiers',
  'Suivi des incidents & travaux',
  'Tableau de bord temps réel',
  'Support par e-mail inclus',
];

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://mon-syndic-benevole.fr/#organization',
        name: 'Mon Syndic Bénévole',
        url: 'https://mon-syndic-benevole.fr',
        logo: 'https://mon-syndic-benevole.fr/logo.png',
        description: 'Logiciel de gestion de copropriété pour syndics bénévoles.',
        sameAs: [],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://mon-syndic-benevole.fr/#app',
        name: 'Mon Syndic Bénévole',
        url: 'https://mon-syndic-benevole.fr',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '300',
          priceCurrency: 'EUR',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '300',
            priceCurrency: 'EUR',
            unitText: 'YEAR',
          },
          description: 'Essai gratuit 14 jours, sans engagement.',
        },
        description:
          'Gérez vos copropriétés simplement : charges, assemblées générales, appels de fonds, documents et incidents. Pensé par un syndic bénévole, pour les syndics bénévoles.',
      },
      {
        '@type': 'WebPage',
        '@id': 'https://mon-syndic-benevole.fr/#webpage',
        url: 'https://mon-syndic-benevole.fr',
        name: 'Mon Syndic Bénévole — La gestion de copropriété simple & abordable',
        isPartOf: { '@id': 'https://mon-syndic-benevole.fr/#organization' },
        inLanguage: 'fr-FR',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://mon-syndic-benevole.fr/#website',
        url: 'https://mon-syndic-benevole.fr',
        name: 'Mon Syndic Bénévole',
        inLanguage: 'fr-FR',
        publisher: { '@id': 'https://mon-syndic-benevole.fr/#organization' },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://mon-syndic-benevole.fr/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: "Faut-il un moyen de paiement pour démarrer ?",
            acceptedAnswer: { '@type': 'Answer', text: "Oui, un moyen de paiement est requis à la souscription. Les 14 premiers jours sont entièrement gratuits — la première facturation intervient au 15e jour, puis l'abonnement se renouvelle chaque année. Vous pouvez annuler à tout moment avant la date de renouvellement." },
          },
          {
            '@type': 'Question',
            name: "Puis-je annuler à tout moment ?",
            acceptedAnswer: { '@type': 'Answer', text: "Oui, sans frais ni préavis. Si vous souhaitez arrêter, votre abonnement n'est pas renouvelé. Vos données restent accessibles jusqu'à la fin de la période payée." },
          },
          {
            '@type': 'Question',
            name: "Mes données sont-elles sécurisées ?",
            acceptedAnswer: { '@type': 'Answer', text: "Vos données sont hébergées en Europe, chiffrées en transit (HTTPS) et au repos. Nous n'accédons jamais à vos données sans votre autorisation explicite." },
          },
          {
            '@type': 'Question',
            name: "Un abonnement couvre-t-il plusieurs copropriétés ?",
            acceptedAnswer: { '@type': 'Answer', text: "Chaque abonnement est lié à une copropriété. Vous pouvez gérer plusieurs copropriétés depuis un seul compte en souscrivant un abonnement par copropriété." },
          },
          {
            '@type': 'Question',
            name: "Est-ce conforme à la loi ALUR et aux obligations du syndic bénévole ?",
            acceptedAnswer: { '@type': 'Answer', text: "Oui. Mon Syndic Bénévole est conçu pour répondre aux obligations légales du syndic non-professionnel : fonds de travaux, appels de charges, convocations AG, procès-verbaux, conservation des documents." },
          },
          {
            '@type': 'Question',
            name: "Y a-t-il une application mobile ?",
            acceptedAnswer: { '@type': 'Answer', text: "L'application est entièrement accessible depuis le navigateur de votre smartphone, iOS ou Android. Elle est optimisée pour mobile — aucune installation requise. Une application native est dans notre feuille de route." },
          },
          {
            '@type': 'Question',
            name: "Puis-je importer mes données existantes ?",
            acceptedAnswer: { '@type': 'Answer', text: "Vous pouvez ajouter vos copropriétaires, lots et tantièmes directement depuis l'interface en quelques minutes. L'import automatisé (fichier Excel ou CSV) est une fonctionnalité prévue dans nos prochaines mises à jour." },
          },
        ],
      },
      {
        '@type': 'HowTo',
        '@id': 'https://mon-syndic-benevole.fr/#howto',
        name: 'Comment gérer sa copropriété avec Mon Syndic Bénévole',
        description: "Gérez votre copropriété en 3 étapes simples, sans formation ni migration.",
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Créez votre copropriété', text: "Renseignez l'adresse, ajoutez vos lots et les tantièmes. Tout est guidé, pas à pas." },
          { '@type': 'HowToStep', position: 2, name: 'Invitez vos copropriétaires', text: "Chaque copropriétaire reçoit un e-mail et accède à son espace personnel sécurisé." },
          { '@type': 'HowToStep', position: 3, name: 'Gérez au quotidien', text: "Charges, appels de fonds, AG, documents — tout centralisé, rien à oublier." },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white font-sans">

      {/* ── Navigation sticky ── */}
      <LandingNav />

      <header>
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white" aria-label="Présentation">
        {/* Orbs décoratifs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full mb-6 sm:mb-8">
            <Banknote size={14} className="shrink-0" />
            Économisez jusqu&apos;à 3&nbsp;000&nbsp;€/an vs un syndic professionnel
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5 sm:mb-6 tracking-tight">
            Gérez votre copropriété<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              sans syndic professionnel
            </span>
          </h1>

          <p className="text-base sm:text-xl text-blue-100/80 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Remplissez vous-même le rôle de syndic bénévole — charges, assemblées générales,
            appels de fonds. Sans connaissances juridiques requises. Opérationnel en moins de 30 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 sm:mb-12">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors text-lg shadow-lg shadow-blue-900/30 w-full sm:w-auto justify-center"
            >
              Créer ma copro gratuitement <ArrowRight size={18} />
            </Link>
            <a
              href="#demo"
              className="flex items-center gap-2 border border-white/20 text-white/90 font-medium px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors text-lg w-full sm:w-auto justify-center"
            >
              Voir l&apos;aperçu
            </a>
          </div>

          {/* Badges rassurants */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-blue-200/70">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> 14 jours offerts, facturation au 15e jour</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-green-400" /> Données hébergées en Europe</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> Conforme loi ALUR</span>
          </div>
        </div>
                </section>
      </header>

      <main>

      {/* ═══════ PROBLÈME ═══════ */}
      <section aria-labelledby="probleme-heading" className="bg-white py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-3">Le problème</p>
            <h2 id="probleme-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Un syndic professionnel vous coûte combien, vraiment&nbsp;?
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Pour une copropriété de <strong className="text-gray-700">10 lots</strong>, le coût annuel
              d&apos;un cabinet professionnel dépasse souvent les 3&nbsp;000&nbsp;€ — hors honoraires supplémentaires
              pour travaux et contentieux.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Syndic pro */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <X size={16} className="text-red-500" />
                </div>
                <p className="font-bold text-gray-800">Cabinet syndic professionnel</p>
              </div>
              <div className="mb-5">
                <p className="text-4xl sm:text-5xl font-extrabold text-red-500">1 500 – 3 000 €</p>
                <p className="text-sm text-gray-500 mt-1">par an &middot; pour 10 lots &middot; hors honoraires travaux</p>
              </div>
              <ul className="space-y-2">
                {[
                  'Contrat de 1 à 3 ans, résiliation compliquée',
                  'Honoraires supplémentaires sur chaque travaux',
                  'Accès à vos données sur demande uniquement',
                  'Délai de réponse de plusieurs jours',
                  'Comptabilité opaque, difficilement vérifiable',
                ].map((pain) => (
                  <li key={pain} className="flex items-start gap-2 text-sm text-gray-600">
                    <X size={14} className="text-red-400 mt-0.5 shrink-0" />
                    {pain}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mon Syndic Bénévole */}
            <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                  <p className="font-bold text-white">Mon Syndic Bénévole</p>
                </div>
                <div className="mb-5">
                  <p className="text-4xl sm:text-5xl font-extrabold text-white">300 €</p>
                  <p className="text-sm text-blue-200 mt-1">par an &middot; plan Essentiel &middot; 10 lots</p>
                </div>
                <ul className="space-y-2">
                  {[
                    'Résiliable à tout moment, sans frais ni préavis',
                    "Toutes les fonctionnalités incluses d'office",
                    'Accès à vos données en temps réel, 24h/24',
                    'Interface intuitive, opérationnel en 5 minutes',
                    'Comptabilité transparente, partageable',
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-blue-100">
                      <CheckCircle size={14} className="text-green-300 mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 bg-white/15 rounded-xl p-3 flex items-center gap-3">
                  <Banknote size={18} className="text-yellow-300 shrink-0" />
                  <div>
                    <p className="text-xs text-blue-200 font-medium">Économies annuelles</p>
                    <p className="text-xl font-extrabold text-yellow-300">jusqu&apos;à 2 700 €/an</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-base mb-4">
              C&apos;est votre copropriété. La loi vous autorise à la gérer vous-même — syndic bénévole, sans agrémentation requise.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-sm">
              Démarrer gratuitement — 14 jours offerts <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ SOLUTION ══════════════════════════════ */}
      <section aria-labelledby="solution-heading" className="bg-gray-50 py-14 sm:py-20 px-4 sm:px-6 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">La solution</p>
            <h2 id="solution-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce que fait un syndic professionnel —{' '}
              <span className="text-blue-600">pour 300&nbsp;€/an</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Mon Syndic Bénévole vous donne les mêmes outils qu&apos;un cabinet syndic, sans le contrat ni les frais.
              Aucune connaissance juridique requise.
            </p>
          </div>

          {/* 3 étapes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative mb-14">
            <div className="hidden md:block absolute top-10 left-[calc(33.33%+0.5rem)] right-[calc(33.33%+0.5rem)] h-px bg-gradient-to-r from-blue-200 to-violet-200" />
            {[
              { step: '1', bg: 'bg-blue-600', ring: 'ring-blue-100', Icon: Building2, title: 'Créez votre copropriété', desc: "Renseignez l'adresse, ajoutez vos lots et les tantièmes. Tout est guidé, pas à pas." },
              { step: '2', bg: 'bg-indigo-600', ring: 'ring-indigo-100', Icon: Users, title: 'Invitez vos copropriétaires', desc: "Chaque copropriétaire reçoit un e-mail et accède à son espace personnel sécurisé." },
              { step: '3', bg: 'bg-violet-600', ring: 'ring-violet-100', Icon: LayoutDashboard, title: 'Gérez au quotidien', desc: "Charges, appels de fonds, AG, documents — tout centralisé, rien à oublier." },
            ].map(({ step, bg, ring, Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className={`relative w-20 h-20 ${bg} ring-8 ${ring} rounded-3xl flex items-center justify-center mb-5 shadow-lg`}>
                  <Icon size={32} className="text-white" />
                  <span className={`absolute -top-2 -right-2 w-6 h-6 ${bg} border-2 border-white rounded-full text-white text-[11px] font-bold flex items-center justify-center`}>{step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>

          {/* 4 modules clés */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { Icon: Wallet, bg: 'bg-blue-100', fg: 'text-blue-600', title: 'Appels de fonds', desc: 'Génération auto, répartition par tantièmes, export PDF & e-mail.' },
              { Icon: CalendarDays, bg: 'bg-indigo-100', fg: 'text-indigo-600', title: 'Assemblées générales', desc: 'Convocations légales, votes, procès-verbal en un clic.' },
              { Icon: Receipt, bg: 'bg-violet-100', fg: 'text-violet-600', title: 'Dépenses & charges', desc: 'Suivi des factures, répartition copropriétaire, tableau de bord.' },
              { Icon: FileText, bg: 'bg-purple-100', fg: 'text-purple-600', title: 'Documents & GED', desc: "Archivage centralisé, dossiers par catégorie, accès partagé." },
            ].map(({ Icon, bg, fg, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={18} className={fg} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Inclus également */}
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 flex flex-wrap gap-x-6 gap-y-2.5 items-center justify-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest w-full text-center mb-1">Inclus également dans tous les plans</span>
            {['Suivi incidents & travaux', 'Espace copropriétaire', 'Notifications automatiques', 'Fonds de travaux ALUR', 'Tableau de bord temps réel', 'Support par e-mail'].map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-sm text-gray-600">
                <CheckCircle size={13} className="text-green-500 shrink-0" /> {f}
              </span>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base">
              Créer ma copro gratuitement <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-sm text-gray-400">Moyen de paiement requis — aucun débit pendant 14 jours &middot; Résiliable à tout moment</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ PREUVES ══════════════════════════════ */}
      <section aria-labelledby="preuves-heading" className="bg-white py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8 text-center mb-16 border-b border-gray-100 pb-16">
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-blue-600">25 €</p>
              <p className="text-sm text-gray-500 mt-1">par mois seulement</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-blue-600">8</p>
              <p className="text-sm text-gray-500 mt-1">modules inclus</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-blue-600">14 j</p>
              <p className="text-sm text-gray-500 mt-1">d&apos;essai gratuit</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-extrabold text-blue-600">100 %</p>
              <p className="text-sm text-gray-500 mt-1">conforme loi ALUR</p>
            </div>
          </div>

          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Comparaison objective</p>
            <h2 id="preuves-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Mon Syndic Bénévole vs cabinet professionnel</h2>
            <p className="text-gray-500 text-lg">Les mêmes fonctions, sans le coût ni les contraintes d&apos;un contrat.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold">
              <div className="py-4 px-5 text-gray-400" />
              <div className="py-4 px-4 text-center text-gray-600 border-l border-gray-200">Syndic professionnel</div>
              <div className="py-4 px-4 text-center text-blue-700 border-l border-gray-200 bg-blue-50/60">Mon Syndic Bénévole</div>
            </div>
            {[
              ['Coût annuel (10 lots)', '1 500 – 3 000 €', 'À partir de 300 €'],
              ['Engagement', 'Contrat 1–3 ans', 'Résiliable à tout moment'],
              ['Accès à vos données', 'Sur demande', 'Temps réel, 24h/24'],
              ['Délai de réponse', 'Plusieurs jours', 'Immédiat'],
              ['Convocations & PV AG', 'Souvent en supplément', '✓ Incluses'],
              ['GED Documents en ligne', '✗ Rarement', '✓ Incluse'],
              ['Tableau de bord live', '✗', '✓'],
              ['Transparence des comptes', 'Partielle', '✓ Totale'],
            ].map(([label, pro, nous], i) => (
              <div key={label} className={`grid grid-cols-3 text-sm border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                <div className="py-3.5 px-5 text-gray-700 font-medium">{label}</div>
                <div className="py-3.5 px-4 text-center text-gray-500 border-l border-gray-100">{pro}</div>
                <div className="py-3.5 px-4 text-center font-semibold text-blue-700 border-l border-gray-100 bg-blue-50/20">{nous}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* ══════════════════════════════ DÉMO ══════════════════════════════ */}
      <section id="demo" aria-labelledby="demo-heading" className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-14 sm:py-20 px-4 sm:px-6">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-sm font-semibold text-blue-300 uppercase tracking-widest mb-3">Aperçu de l&apos;interface</p>
            <h2 id="demo-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
              Votre copropriété, vue d&apos;ensemble,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">en temps réel</span>
            </h2>
            <p className="text-blue-200/70 text-lg max-w-xl mx-auto">
              Tableau de bord, appels de fonds, AG, dépenses et incidents — tout au même endroit, depuis n&apos;importe quel appareil.
            </p>
          </div>
          {/* ── Mobile simplified preview ── */}
          <div className="sm:hidden max-w-xs mx-auto px-4 mt-6 pb-0">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
              <div className="bg-gray-800 px-3 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-[10px] text-gray-400 mx-auto">mon-syndic-benevole.fr</span>
              </div>
              <div className="bg-gray-50 p-3 space-y-2">
                <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl p-2.5 mb-1">
                  <SiteLogo size={22} />
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">Résidence Les Acacias</p>
                    <p className="text-[9px] text-blue-600 font-medium">8 lots · 980 tantièmes</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Copropriétaires', value: '6', color: 'text-blue-600' },
                    { label: 'Lots', value: '8', color: 'text-indigo-600' },
                    { label: 'Charges 2026', value: '4 870 €', color: 'text-violet-600' },
                    { label: 'Incidents', value: '1 ouvert', color: 'text-amber-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-xl p-2.5">
                      <p className="text-[9px] text-gray-400">{label}</p>
                      <p className={`text-sm font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <CalendarDays size={12} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-800 truncate">AGO 2026 — 30 mars · 10h00</p>
                    <p className="text-[9px] text-gray-400">7 copropriétaires invités</p>
                  </div>
                  <span className="shrink-0 text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Planifiée</span>
                </div>
              </div>
            </div>
          </div>
  
          {/* ── Mock Dashboard Preview ── */}
          <div id="apercu" className="relative max-w-5xl mx-auto px-6 pb-0 hidden sm:block">
            {/* Fenêtre navigateur */}
            <div className="rounded-t-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 relative">
              {/* Barre navigateur */}
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
                  mon-syndic-benevole.fr
                </div>
              </div>
              {/* Contenu app simulé */}
              <div className="bg-gray-50 flex" style={{ height: '460px' }}>
                {/* Sidebar */}
                <div className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">
                  {/* Logo */}
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2.5">
                      <SiteLogo size={28} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-gray-900 leading-tight">Mon Syndic</p>
                        <p className="text-[10px] font-semibold text-blue-600 leading-tight">Bénévole</p>
                      </div>
                    </div>
                  </div>
                  {/* Copro selector */}
                  <div className="mx-3 mb-2 px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Copropriété</p>
                    <div className="flex items-center gap-1.5">
                      <Building2 size={11} className="text-blue-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-gray-800 truncate">Résidence Les Acacias</p>
                    </div>
                  </div>
                  {/* Navigation */}
                  <nav className="flex-1 px-2 pb-2 space-y-3 overflow-hidden">
                    {/* Solo : Tableau de bord */}
                    <div>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 rounded-full" />
                        <LayoutDashboard size={13} className="text-blue-600 shrink-0" />
                        <span className="text-[11px] font-semibold text-blue-700">Tableau de bord</span>
                      </div>
                    </div>
                    {/* Section Copropriété */}
                    <div>
                      <p className="px-2.5 mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-gray-300">Copropriété</p>
                      {[
                        { label: 'Lots & bâtiment', Icon: Building2 },
                        { label: 'Copropriétaires', Icon: Users },
                      ].map(({ label, Icon }) => (
                        <div key={label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-500">
                          <Icon size={13} className="text-gray-400 shrink-0" />
                          <span className="text-[11px] font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                    {/* Section AG & Finances */}
                    <div>
                      <p className="px-2.5 mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-gray-300">AG &amp; Finances</p>
                      {[
                        { label: 'Assemblées Générales', Icon: CalendarDays },
                        { label: 'Appels de fonds', Icon: Wallet },
                        { label: 'Dépenses', Icon: Receipt },
                      ].map(({ label, Icon }) => (
                        <div key={label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-500">
                          <Icon size={13} className="text-gray-400 shrink-0" />
                          <span className="text-[11px] font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                    {/* Section Gestion */}
                    <div>
                      <p className="px-2.5 mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-gray-300">Gestion</p>
                      {[
                        { label: 'Documents', Icon: FileText },
                        { label: 'Incidents / Travaux', Icon: AlertTriangle },
                      ].map(({ label, Icon }) => (
                        <div key={label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-500">
                          <Icon size={13} className="text-gray-400 shrink-0" />
                          <span className="text-[11px] font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                    {/* Aide & Contact */}
                    <div>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-500">
                        <HelpCircle size={13} className="text-gray-400 shrink-0" />
                        <span className="text-[11px] font-medium">Aide &amp; Contact</span>
                      </div>
                    </div>
                  </nav>
                  {/* Bas : profil + déconnexion */}
                  <div className="px-2 py-2 border-t border-gray-100 space-y-0.5">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-500">
                      <CreditCard size={13} className="text-gray-400 shrink-0" />
                      <span className="text-[11px] font-medium">Abonnement</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-500">
                      <UserCircle size={13} className="text-gray-400 shrink-0" />
                      <span className="text-[11px] font-medium">Mon profil</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-gray-400">
                      <LogOut size={13} className="text-gray-400 shrink-0" />
                      <span className="text-[11px] font-medium">Déconnexion</span>
                    </div>
                  </div>
                </div>
                {/* Main content */}
                <div className="flex-1 overflow-hidden p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">Tableau de bord</h3>
                      <p className="text-xs text-gray-400">Résidence Les Acacias · 12 lots · 10 copropriétaires</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> En ligne
                    </div>
                  </div>
  
                  {/* Bannière AG urgente */}
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2.5">
                    <BellRing size={12} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] font-semibold text-amber-800 flex-1">
                      Assemblée Générale dans{' '}
                      <span className="bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 text-[9px] font-bold">J−15</span>
                    </p>
                    <span className="text-[10px] text-amber-600">AGO 2026 · 30 mars</span>
                  </div>
  
                  {/* KPIs — Ligne 1 (3 cols) */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {/* Trésorerie */}
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
                        <Scale size={12} className="text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Trésorerie</p>
                        <p className="text-xs font-bold text-indigo-700">+12 540 €</p>
                        <p className="text-[9px] text-gray-400">Encaissés − dépenses</p>
                      </div>
                    </div>
                    {/* Dépenses + tendance */}
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                        <Receipt size={12} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Dépenses 2026</p>
                        <p className="text-xs font-bold text-gray-900">4 320 €</p>
                        <p className="text-[9px] text-red-500 flex items-center gap-0.5 font-medium">
                          <ArrowUp size={8} />+8% vs 2025
                        </p>
                      </div>
                    </div>
                    {/* Impayés */}
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 rounded-lg shrink-0">
                        <Banknote size={12} className="text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Impayés</p>
                        <p className="text-xs font-bold text-red-600">640 €</p>
                        <p className="text-[9px] text-gray-400">2 débiteurs</p>
                      </div>
                    </div>
                  </div>
  
                  {/* KPIs — Ligne 2 (2 cols) */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Incidents */}
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 rounded-lg shrink-0">
                        <AlertTriangle size={12} className="text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Incidents en cours</p>
                        <p className="text-xs font-bold text-gray-900">2</p>
                        <p className="text-[9px] text-gray-400">incidents ouverts</p>
                      </div>
                    </div>
                    {/* Copropriétaires */}
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
                        <Users size={12} className="text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-gray-400 uppercase tracking-wide">Copropriétaires</p>
                        <p className="text-xs font-bold text-gray-900">10</p>
                        <p className="text-[9px] text-gray-400">12 lots recensés</p>
                      </div>
                    </div>
                  </div>
  
                  {/* Contenu bas : dépenses + répartition */}
                  <div className="grid grid-cols-5 gap-2">
                    {/* Dernières dépenses avec point couleur catégorie */}
                    <div className="col-span-3 bg-white border border-gray-200 rounded-xl p-2.5">
                      <p className="text-[10px] font-semibold text-gray-700 mb-1.5">Dernières dépenses 2026</p>
                      <div className="space-y-1">
                        {[
                          { nom: 'Entretien ascenseur', cat: 'Entretien', dotCl: 'bg-orange-400', mt: '480 €' },
                          { nom: 'Prime assurance MRI', cat: 'Assurance', dotCl: 'bg-blue-400', mt: '1 200 €' },
                          { nom: 'EDF parties communes', cat: 'Électricité', dotCl: 'bg-purple-400', mt: '240 €' },
                          { nom: 'Nettoyage hall', cat: 'Nettoyage', dotCl: 'bg-teal-400', mt: '180 €' },
                        ].map(({ nom, cat, dotCl, mt }) => (
                          <div key={nom} className="flex items-center justify-between text-[10px] border-b border-gray-50 pb-1">
                            <div>
                              <p className="font-medium text-gray-800 leading-tight">{nom}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCl}`} />
                                <span className="text-gray-400">{cat}</span>
                              </div>
                            </div>
                            <span className="font-semibold text-gray-700">{mt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
  
                    {/* Répartition visuelle */}
                    <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-2.5">
                      <p className="text-[10px] font-semibold text-gray-700 mb-1.5">Répartition charges</p>
                      <div className="space-y-1.5">
                        {[
                          { cat: 'Entretien', pct: 35, color: 'bg-orange-400' },
                          { cat: 'Assurance', pct: 28, color: 'bg-blue-400' },
                          { cat: 'Électricité', pct: 18, color: 'bg-purple-400' },
                          { cat: 'Travaux', pct: 12, color: 'bg-yellow-400' },
                          { cat: 'Autres', pct: 7, color: 'bg-gray-300' },
                        ].map(({ cat, pct, color }) => (
                          <div key={cat} className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-gray-500 w-14 shrink-0">{cat}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-gray-600 font-medium w-6 text-right">{pct}%</span>
                          </div>
                        ))}
                      </div>
                      {/* AG planifiée */}
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-700 mb-1">AG planifiée</p>
                        <div className="flex items-center gap-1.5 text-[10px] p-1.5 bg-blue-50 rounded-lg">
                          <CalendarDays size={10} className="text-blue-500 shrink-0" />
                          <div>
                            <p className="font-medium text-gray-800">AGO 2026</p>
                            <p className="text-gray-400">30 mars · 10h00</p>
                          </div>
                          <span className="ml-auto text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Planifiée</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dégradé de fondu bas */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none rounded-b-2xl" />
            </div>
          </div>
          <div className="text-center mt-10 sm:mt-14">
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors text-lg shadow-lg shadow-blue-900/30">
              Tester pendant 14 jours <ArrowRight size={18} />
            </Link>
            <p className="mt-3 text-blue-300/50 text-sm">14 jours gratuits · Annulation sans frais</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ COMMENT ÇA MARCHE ══════════════════════════════ */}
      <section aria-labelledby="howto-heading" className="bg-gray-50 border-y border-gray-100 py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Comment ça marche</p>
            <h2 id="howto-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Opérationnel en moins de 30&nbsp;minutes
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Aucune formation, aucune migration. Suivez les 4 étapes et votre copropriété est en ligne.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                step: '01', bg: 'bg-blue-600', ring: 'ring-blue-100', textColor: 'text-blue-600',
                Icon: Building2, time: '5 min',
                title: 'Créez votre copropriété',
                desc: "Renseignez l'adresse, ajoutez chaque lot et ses tantièmes généraux et spéciaux. L'interface vous guide pas à pas.",
                detail: ['Adresse et données de base', 'Lots et tantièmes', 'Documents fondateurs'],
              },
              {
                step: '02', bg: 'bg-indigo-600', ring: 'ring-indigo-100', textColor: 'text-indigo-600',
                Icon: Users, time: '5 min',
                title: 'Invitez vos copropriétaires',
                desc: "Renseignez les coordonnées de chaque copropriétaire. Chacun reçoit une invitation et accède à son espace personnel sécurisé.",
                detail: ['Nom, e-mail, numéro de lot', 'Invitation automatique par e-mail', 'Espace personnel dédié'],
              },
              {
                step: '03', bg: 'bg-violet-600', ring: 'ring-violet-100', textColor: 'text-violet-600',
                Icon: Wallet, time: '10 min',
                title: 'Configurez vos finances',
                desc: "Saisissez votre budget prévisionnel. Mon Syndic Bénévole calcule automatiquement la quote-part de chaque copropriétaire et génère les appels de fonds.",
                detail: ['Budget prévisionnel annuel', 'Appels de fonds trimestriels', 'Fonds de travaux ALUR séparé'],
              },
              {
                step: '04', bg: 'bg-purple-600', ring: 'ring-purple-100', textColor: 'text-purple-600',
                Icon: LayoutDashboard, time: 'Au quotidien',
                title: 'Gérez depuis votre tableau de bord',
                desc: "Trésorerie en temps réel, relances automatiques, AG, dépôt de documents — tout au même endroit, depuis n'importe quel appareil.",
                detail: ['Suivi des paiements et impayés', 'AG et procès-verbaux', 'Documents et incidents'],
              },
            ].map(({ step, bg, ring, textColor, Icon, time, title, desc, detail }) => (
              <div key={step} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 flex gap-5 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 ${bg} ring-8 ${ring} rounded-2xl flex items-center justify-center shadow-md`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className={`text-xs font-bold ${textColor}`}>{step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-base">{title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium shrink-0">{time}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-3">{desc}</p>
                  <ul className="space-y-1.5">
                    {detail.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle size={11} className="text-green-500 shrink-0" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base">
              Démarrer maintenant <ArrowRight size={16} />
            </Link>
            <p className="mt-3 text-sm text-gray-400">Opérationnel en 30 minutes · Aucune formation requise</p>
          </div>
        </div>
      </section>

            {/* ── Tarif ── */}
      <section id="tarif" aria-labelledby="pricing-heading" className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Tarifs</p>
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tarif logiciel syndic bénévole — simple &amp; transparent</h2>
            <p className="text-lg text-gray-500">Un abonnement par copropriété. Toutes les fonctionnalités incluses. Résiliable à tout moment, sans engagement.</p>

          </div>

          {/* Callout économies vs syndic professionnel */}
          <div className="flex items-start gap-3 sm:gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 sm:px-6 py-4 mb-8 text-left">
            <div className="text-2xl shrink-0">💡</div>
            <div>
              <p className="text-sm font-bold text-amber-900">Un syndic professionnel coûte entre 1 500 € et 3 000 €/an.</p>
              <p className="text-sm text-amber-700 mt-0.5">Mon Syndic Bénévole : à partir de <span className="font-bold">300 €/an</span>. Soit jusqu&apos;à <span className="font-bold text-amber-900">2 700 € d&apos;économies</span> chaque année — à fonctionnalités équivalentes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-10">

            {/* Plan Essentiel */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                Le plus populaire
              </div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
              <div className="relative flex-1 flex flex-col">
                <p className="text-blue-200 text-sm font-semibold mb-1">Essentiel</p>
                <p className="text-blue-100/70 text-xs mb-4">10 lots inclus</p>
                <div className="flex items-end gap-1.5 mb-1">
                    <span className="text-5xl font-extrabold">300 €</span>
                    <span className="text-blue-200 pb-1.5">/an</span>
                  </div>
                  <p className="text-blue-200/80 text-xs mb-6">soit <span className="font-semibold text-white">25 €/mois</span></p>
                <Link href="/register" className="block text-center bg-white text-blue-700 font-bold py-3.5 rounded-2xl hover:bg-blue-50 transition-colors mt-auto">
                  Commencer gratuitement →
                </Link>
              </div>
            </div>

            {/* Plan Confort */}
            <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 sm:p-7 shadow-lg flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                Copros moyennes
              </div>
              <p className="text-emerald-700 text-sm font-semibold mb-1">Confort</p>
              <p className="text-gray-400 text-xs mb-4">20 lots inclus</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">450 €</span>
                <span className="text-gray-400 pb-1.5">/an</span>
              </div>
              <p className="text-gray-400 text-xs mb-6">soit <span className="font-semibold text-gray-700">37,50 €/mois</span></p>
              <Link href="/register" className="block text-center bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 transition-colors mt-auto">
                Commencer gratuitement →
              </Link>
            </div>

            {/* Plan Illimité */}
            <div className="bg-white border-2 border-violet-200 rounded-3xl p-5 sm:p-7 shadow-lg flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full">
                Grandes copros
              </div>
              <p className="text-violet-700 text-sm font-semibold mb-1">Illimité</p>
              <p className="text-gray-400 text-xs mb-4">Lots illimités</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">600 €</span>
                <span className="text-gray-400 pb-1.5">/an</span>
              </div>
              <p className="text-gray-400 text-xs mb-6">soit <span className="font-semibold text-gray-700">50 €/mois</span></p>
              <Link href="/register" className="block text-center bg-violet-600 text-white font-bold py-3.5 rounded-2xl hover:bg-violet-700 transition-colors mt-auto">
                Commencer gratuitement →
              </Link>
            </div>

          </div>

          {/* Fonctionnalités incluses dans tous les plans */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 sm:p-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">Inclus dans tous les plans</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              {planFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  <span className="text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            Un abonnement par copropriété. Facturation annuelle.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════ PREUVES SOCIALES ══════════════════════════════ */}
      <section aria-labelledby="preuves-sociales-heading" className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-300 uppercase tracking-widest mb-3">Ils nous font confiance</p>
            <h2 id="preuves-sociales-heading" className="text-3xl md:text-4xl font-bold text-white">
              Des syndics bénévoles qui gèrent mieux, pour moins cher
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {[
              {
                value: '+100',
                label: 'copropriétés accompagnées',
                sublabel: 'et ce chiffre grandit chaque mois',
                Icon: Building2,
                color: 'text-blue-400',
              },
              {
                value: '2 400 €',
                label: 'économisés par an en moyenne',
                sublabel: 'vs un cabinet syndic professionnel',
                Icon: Banknote,
                color: 'text-yellow-400',
              },
              {
                value: '30 min',
                label: 'pour démarrer',
                sublabel: 'de la création à votre premier appel de fonds',
                Icon: Clock,
                color: 'text-green-400',
              },
            ].map(({ value, label, sublabel, Icon, color }) => (
              <div key={label} className="text-center bg-white/5 border border-white/10 rounded-2xl px-6 py-8">
                <Icon size={28} className={`${color} mx-auto mb-4`} />
                <p className={`text-4xl sm:text-5xl font-extrabold ${color} mb-2`}>{value}</p>
                <p className="text-base font-semibold text-white mb-1">{label}</p>
                <p className="text-sm text-blue-200/60">{sublabel}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors text-base shadow-lg shadow-blue-900/30">
              Rejoindre les 100+ copropriétés <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" aria-labelledby="faq-heading" className="bg-gray-50 py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Questions fréquentes</p>
            <h2 id="faq-heading" className="text-3xl font-bold text-gray-900">Questions fréquentes sur la gestion de copropriété en syndic bénévole</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              {
                q: "Faut-il un moyen de paiement pour démarrer ?",
                a: "Oui, un moyen de paiement est requis à la souscription. Les 14 premiers jours sont entièrement gratuits — la première facturation intervient au 15e jour, puis l'abonnement se renouvelle chaque année. Vous pouvez annuler à tout moment avant la date de renouvellement.",
              },
              {
                q: "Puis-je annuler à tout moment ?",
                a: "Oui, sans frais ni préavis. Si vous souhaitez arrêter, votre abonnement n'est pas renouvelé. Vos données restent accessibles jusqu'à la fin de la période payée.",
              },
              {
                q: "Mes données sont-elles sécurisées ?",
                a: "Vos données sont hébergées en Europe, chiffrées en transit (HTTPS) et au repos. Nous n'accédons jamais à vos données sans votre autorisation explicite.",
              },
              {
                q: "Un abonnement couvre-t-il plusieurs copropriétés ?",
                a: "Chaque abonnement est lié à une copropriété. Vous pouvez gérer plusieurs copropriétés depuis un seul compte en souscrivant un abonnement par copropriété.",
              },
              {
                q: "Est-ce conforme à la loi ALUR et aux obligations du syndic bénévole ?",
                a: "Oui. Mon Syndic Bénévole est conçu pour répondre aux obligations légales du syndic non-professionnel : fonds de travaux, appels de charges, convocations AG, procès-verbaux, conservation des documents. Les workflows suivent les bonnes pratiques issues de la loi du 10 juillet 1965 et de ses décrets d'application.",
              },
              {
                q: "Y a-t-il une application mobile ?",
                a: "L'application est entièrement accessible depuis le navigateur de votre smartphone, iOS ou Android. Elle est optimisée pour mobile — aucune installation requise. Une application native est dans notre feuille de route.",
              },
              {
                q: "Puis-je importer mes données existantes ?",
                a: "Vous pouvez ajouter vos copropriétaires, lots et tantièmes directement depuis l'interface en quelques minutes. L'import automatisé (fichier Excel ou CSV) est une fonctionnalité prévue dans nos prochaines mises à jour. En attendant, nos guides pas-à-pas rendent la configuration rapide même pour une grande copropriété.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-base font-semibold text-gray-900 pr-4">{q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform inline-block shrink-0 text-lg leading-none">▾</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section data-cta-final className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-16 sm:py-24 px-4 sm:px-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            Prêt à économiser jusqu'à 3 000 €<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              sur votre copropriété ?
            </span>
          </h2>
          <p className="text-lg text-blue-100/70 mb-10">
            Reprenez la gestion de votre copropriété — comme un pro, pour 10 fois moins cher. Démarrez aujourd&apos;hui, sans risque.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 sm:px-10 py-4 rounded-2xl hover:bg-blue-50 transition-colors text-lg sm:text-xl shadow-xl shadow-blue-900/30"
          >
            Créer ma copro gratuitement <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-blue-300/50 text-sm">Facturation annuelle · Sans engagement · Résiliez à tout moment</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-blue-300/60">
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> 14 jours gratuits, sans frais immédiats</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Annulation sans frais</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Données hébergées en Europe</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Prêt en 10 minutes</span>
          </div>
        </div>
      </section>
      </main>

      <LandingStickyCTA />
      <ScrollToTopButton />

      {/* ── Footer ── */}
      <footer className="bg-slate-950 py-10 px-4 sm:px-6" aria-label="Pied de page">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SiteLogo size={32} />
            <span className="font-bold text-white text-sm">Mon Syndic Bénévole</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Mon Syndic Bénévole — Tous droits réservés
          </p>
          <nav aria-label="Liens du pied de page">
            <div className="flex items-center gap-5 text-sm text-gray-500">
              <Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">Mentions légales</Link>
              <Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link>
              <Link href="/aide" className="hover:text-gray-300 transition-colors">Aide &amp; Contact</Link>
              <Link href="/login" className="hover:text-gray-300 transition-colors">Connexion</Link>
              <Link href="/register" className="hover:text-gray-300 transition-colors">Inscription</Link>
            </div>
          </nav>
        </div>
      </footer>

    </div>
    </>
  );
}

