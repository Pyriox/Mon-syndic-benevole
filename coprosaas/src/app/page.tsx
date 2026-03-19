// ============================================================
// Page d'accueil publique — Landing page de Syndic-Benevole.eu
// ============================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import {
  Building2, CheckCircle, Users, Receipt, CalendarDays,
  AlertTriangle, FileText, Wallet, ArrowRight,
  Shield, Clock, TrendingUp, Zap,
  Scale, ArrowUp, BellRing, Banknote,
  LayoutDashboard, HelpCircle, UserCircle, LogOut, CreditCard,
} from 'lucide-react';
import SiteLogo from '@/components/ui/SiteLogo';
import LandingNav from './LandingNav';
import LandingStickyCTA from './LandingStickyCTA';

// ── Métadonnées spécifiques à la page d'accueil ──────────────
export const metadata: Metadata = {
  title: {
    absolute: 'Mon Syndic Bénévole — Logiciel de gestion de copropriété pour syndic bénévole',
  },
  description:
    'Gérez votre copropriété sans syndic professionnel. Charges, appels de fonds, assemblées générales, documents et incidents — tout en un. À partir de 20 €/mois, 30 jours offerts.',
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
    title: 'Mon Syndic Bénévole — Gestion de copropriété pour syndic bénévole',
    description:
      'Gérez votre copropriété sans syndic professionnel. Charges, appels de fonds, assemblées générales, documents et incidents — tout en un. À partir de 20 €/mois, 30 jours offerts.',
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
    title: 'Mon Syndic Bénévole — Gestion de copropriété pour syndic bénévole',
    description:
      'Gérez votre copropriété sans syndic professionnel. À partir de 20 €/mois, 30 jours gratuits.',
    images: ['/opengraph-image'],
  },
};

const features = [
  {
    icon: Building2,
    title: 'Copropriétés & Lots',
    desc: 'Gérez vos immeubles, lots et tantièmes. Répartitions automatiques selon les millièmes.',
    color: 'blue',
  },
  {
    icon: Users,
    title: 'Annuaire complet',
    desc: 'Centralisez les contacts de vos copropriétaires, leurs lots et leurs coordonnées.',
    color: 'indigo',
  },
  {
    icon: Receipt,
    title: 'Suivi des dépenses',
    desc: 'Enregistrez les charges et obtenez la répartition entre copropriétaires en un clic.',
    color: 'violet',
  },
  {
    icon: Wallet,
    title: 'Appels de fonds',
    desc: 'Générez et envoyez les appels de fonds par e-mail avec export PDF intégré.',
    color: 'purple',
  },
  {
    icon: CalendarDays,
    title: 'Assemblées Générales',
    desc: 'Planifiez, votez, rédigez les PV et envoyez les convocations aux copropriétaires.',
    color: 'blue',
  },
  {
    icon: FileText,
    title: 'GED Documents',
    desc: "Archivez PV, factures et contrats par dossier. Accès instantané à tout moment.",
    color: 'indigo',
  },
  {
    icon: AlertTriangle,
    title: 'Incidents & Travaux',
    desc: 'Signalez les pannes, suivez les interventions et gardez un historique complet.',
    color: 'violet',
  },
  {
    icon: TrendingUp,
    title: 'Tableau de bord',
    desc: 'Vue synthétique : soldes, dépenses, incidents ouverts et prochaines AG.',
    color: 'purple',
  },
];

const colorMap: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  violet: 'bg-violet-100 text-violet-600',
  purple: 'bg-purple-100 text-purple-600',
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
          price: '20',
          priceCurrency: 'EUR',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '20',
            priceCurrency: 'EUR',
            unitText: 'MONTH',
          },
          description: 'Essai gratuit 30 jours, sans engagement.',
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

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full mb-6 sm:mb-8">
            <Zap size={14} className="text-yellow-400 shrink-0" />
            <span>Pensé par un syndic bénévole, pour les syndics bénévoles</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5 sm:mb-6 tracking-tight">
            Le logiciel du syndic bénévole<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              simple &amp; abordable
            </span>
          </h1>

          <p className="text-base sm:text-xl text-blue-100/80 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Configurez votre copropriété en 10 minutes et économisez jusqu&apos;à 2 700 €/an
            par rapport à un syndic professionnel — sans formation, sans prise de tête.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors text-lg shadow-lg shadow-blue-900/30"
            >
              Démarrer gratuitement <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-white/20 text-white/90 font-medium px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors text-lg"
            >
              Se connecter
            </Link>
          </div>

          {/* Badges rassurants */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-blue-200/70">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> 30 jours offerts, facturation au 31e jour</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-green-400" /> Données hébergées en Europe</span>
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-green-400" /> Prêt en 5 minutes</span>
          </div>
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
        </section>
      </header>

      <main>
      {/* ── Chiffres clés ── */}
      <section className="bg-white border-b border-gray-100 py-10 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-600">240 €</p>
            <p className="text-sm text-gray-500 mt-1">par an seulement</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-600">10 min</p>
            <p className="text-sm text-gray-500 mt-1">pour démarrer</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-600">8</p>
            <p className="text-sm text-gray-500 mt-1">modules inclus</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-600">30 j</p>
            <p className="text-sm text-gray-500 mt-1">d&apos;essai gratuit</p>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="bg-white py-14 sm:py-20 px-4 sm:px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-widest mb-3">Simple comme bonjour</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Opérationnel en 3 étapes</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Pas de formation, pas de migration. Vous gérez tout depuis votre navigateur.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
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
          <div className="mt-12 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline text-sm">
              Commencer maintenant — c&apos;est gratuit <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" aria-labelledby="features-heading" className="bg-gradient-to-b from-gray-50 to-white py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Un outil complet, pensé sur le terrain par un syndic bénévole. Rien de superflu, tout l&apos;essentiel.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all group">
                <div className={`w-11 h-11 ${colorMap[color]} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparaison ── */}
      <section className="bg-gray-50 py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-3">Pourquoi le bénévolat ?</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Mon Syndic Bénévole vs cabinet professionnel</h2>
            <p className="text-gray-500 text-lg">Les mêmes fonctions, sans le coût ni les contraintes d&apos;un contrat.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold">
              <div className="py-4 px-5 text-gray-400" />
              <div className="py-4 px-4 text-center text-gray-600 border-l border-gray-200">Syndic professionnel</div>
              <div className="py-4 px-4 text-center text-blue-700 border-l border-gray-200 bg-blue-50/60">Mon Syndic Bénévole</div>
            </div>
            {[
              ['Coût annuel', '1 500 – 3 000 €', 'À partir de 240 €'],
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

      {/* ── Tarif ── */}
      <section id="tarif" aria-labelledby="pricing-heading" className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Tarifs</p>
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent, sans surprise</h2>
            <p className="text-lg text-gray-500">Un abonnement par copropriété. Toutes les fonctionnalités incluses. Résiliable à tout moment.</p>

          </div>

          {/* Callout économies vs syndic professionnel */}
          <div className="flex items-start gap-3 sm:gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 sm:px-6 py-4 mb-8 text-left">
            <div className="text-2xl shrink-0">💡</div>
            <div>
              <p className="text-sm font-bold text-amber-900">Un syndic professionnel coûte entre 1 500 € et 3 000 €/an.</p>
              <p className="text-sm text-amber-700 mt-0.5">Mon Syndic Bénévole : à partir de <span className="font-bold">240 €/an</span>. Soit jusqu&apos;à <span className="font-bold text-amber-900">2 760 € d&apos;économies</span> chaque année — à fonctionnalités équivalentes.</p>
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
                  <span className="text-5xl font-extrabold">20 €</span>
                  <span className="text-blue-200 pb-1.5">/mois</span>
                </div>
                <p className="text-blue-200/80 text-xs mb-6">soit <span className="font-semibold text-white">240 €/an</span></p>
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
                <span className="text-5xl font-extrabold text-gray-900">30 €</span>
                <span className="text-gray-400 pb-1.5">/mois</span>
              </div>
              <p className="text-gray-400 text-xs mb-6">soit <span className="font-semibold text-gray-700">360 €/an</span></p>
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
                <span className="text-5xl font-extrabold text-gray-900">45 €</span>
                <span className="text-gray-400 pb-1.5">/mois</span>
              </div>
              <p className="text-gray-400 text-xs mb-6">soit <span className="font-semibold text-gray-700">540 €/an</span></p>
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

      {/* ── FAQ ── */}
      <section id="faq" aria-labelledby="faq-heading" className="bg-gray-50 py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Questions fréquentes</p>
            <h2 id="faq-heading" className="text-3xl font-bold text-gray-900">Tout ce que vous devez savoir</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              {
                q: "Faut-il un moyen de paiement pour démarrer ?",
                a: "Oui, un moyen de paiement est requis à la souscription. Les 30 premiers jours sont entièrement gratuits — la première facturation intervient au 31e jour, puis l'abonnement se renouvelle chaque année. Vous pouvez annuler à tout moment avant la date de renouvellement.",
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
                a: "Vous pouvez ajouter vos copropriétaires, lots et tantièmes directement depuis l'interface en quelques minutes. L'import automatisé (fichier Excel ou CSV) fait partie de notre roadmap. En attendant, nos guides pas-à-pas rendent la configuration rapide même pour une grande copropriété.",
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
            Prêt à reprendre le contrôle<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              de votre copropriété ?
            </span>
          </h2>
          <p className="text-lg text-blue-100/70 mb-10">
            Rejoignez les syndics bénévoles qui ont simplifié leur gestion. Démarrez aujourd&apos;hui — c&apos;est gratuit pendant 30 jours.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 sm:px-10 py-4 rounded-2xl hover:bg-blue-50 transition-colors text-lg sm:text-xl shadow-xl shadow-blue-900/30"
          >
            Démarrer gratuitement <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-blue-300/50 text-sm">Facturation annuelle · Sans engagement · Résiliez à tout moment</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-blue-300/60">
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> 30 jours gratuits, sans frais immédiats</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Annulation sans frais</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Données hébergées en Europe</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-green-400" /> Prêt en 10 minutes</span>
          </div>
        </div>
      </section>
      </main>

      <LandingStickyCTA />

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

