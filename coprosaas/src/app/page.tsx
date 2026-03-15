// ============================================================
// Page d'accueil publique — Landing page de Syndic-Benevole.eu
// ============================================================
import Link from 'next/link';
import {
  Building2, CheckCircle, Users, Receipt, CalendarDays,
  AlertTriangle, FileText, Wallet, ArrowRight, Star,
  Shield, Clock, TrendingUp, Zap,
  Scale, ArrowUp, BellRing, Banknote,
  LayoutDashboard, HelpCircle, UserCircle, LogOut, CreditCard,
} from 'lucide-react';
import SiteLogo from '@/components/ui/SiteLogo';

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
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Navigation ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
        {/* Orbs décoratifs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Zap size={14} className="text-yellow-400" />
            Pensé par un syndic bénévole, pour les syndics bénévoles
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            La gestion de copropriété<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              enfin simple &amp; abordable
            </span>
          </h1>

          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gérez vos charges, assemblées générales, appels de fonds et documents
            depuis une seule plateforme — sans formation, sans prise de tête.
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
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200/70">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> 30 jours offerts</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-400" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-green-400" /> Données hébergées en Europe</span>
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-green-400" /> Prêt en 5 minutes</span>
          </div>
        </div>

        {/* ── Mock Dashboard Preview ── */}
        <div id="apercu" className="relative max-w-5xl mx-auto px-6 pb-0">
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
                app.mon-syndic-benevole.fr
              </div>
            </div>
            {/* Contenu app simulé */}
            <div className="bg-gray-50 flex" style={{ height: '680px' }}>
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

      {/* ── Problèmes résolus ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Conçu pour vous</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            En avez-vous assez des tableurs et des dossiers papier ?
          </h2>
          <p className="text-lg text-gray-500 mb-14 max-w-2xl mx-auto">
            Mon Syndic Bénévole centralise toute la gestion de votre copropriété. Fini le suivi hasardeux,
            les oublis de convocations et les répartitions de charges calculées à la main.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                emoji: '📊',
                title: 'Répartitions automatiques',
                desc: 'Saisissez une dépense — l\'appli calcule instantanément la part de chaque copropriétaire selon ses tantièmes.',
              },
              {
                emoji: '📧',
                title: 'Envois automatiques',
                desc: 'Convocations, appels de fonds et PV d\'AG envoyés par e-mail à tous vos copropriétaires en un clic.',
              },
              {
                emoji: '📁',
                title: 'Zéro papier perdu',
                desc: 'GED intégrée avec dossiers thématiques. Retrouvez n\'importe quel document en quelques secondes.',
              },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="text-3xl mb-4">{emoji}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fonctionnalités ── */}
      <section id="fonctionnalites" className="bg-gradient-to-b from-gray-50 to-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tout ce dont vous avez besoin</h2>
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

      {/* ── Tarif ── */}
      <section id="tarif" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Tarifs</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent, sans surprise</h2>
            <p className="text-lg text-gray-500">Un abonnement par copropriété. Toutes les fonctionnalités incluses. Résiliable à tout moment.</p>
            <p className="text-sm text-green-600 font-medium mt-2">-10 % sur tous les plans pour un paiement annuel</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

            {/* Plan Essentiel */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-7 text-white shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                Le plus populaire
              </div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
              <div className="relative flex-1 flex flex-col">
                <p className="text-blue-200 text-sm font-semibold mb-1">Essentiel</p>
                <p className="text-blue-100/70 text-xs mb-4">Jusqu’à 15 lots inclus</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-5xl font-extrabold">20 €</span>
                  <span className="text-blue-200 pb-1.5">/mois</span>
                </div>
                <p className="text-blue-200/80 text-xs mb-1">ou <span className="font-semibold text-white">216 €/an</span> (18 €/mois — −10 %)</p>
                <p className="text-blue-200/70 text-xs mb-6">30 premiers jours offerts</p>
                <div className="space-y-2 mb-6 flex-1">
                  {planFeatures.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle size={10} className="text-green-300" />
                      </div>
                      <span className="text-white/90">{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className="block text-center bg-white text-blue-700 font-bold py-3.5 rounded-2xl hover:bg-blue-50 transition-colors">
                  Commencer gratuitement →
                </Link>
              </div>
            </div>

            {/* Plan Confort */}
            <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-lg flex flex-col">
              <p className="text-gray-900 text-sm font-semibold mb-1">Confort</p>
              <p className="text-gray-400 text-xs mb-4">Jusqu’à 25 lots inclus</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">30 €</span>
                <span className="text-gray-400 pb-1.5">/mois</span>
              </div>
              <p className="text-gray-400 text-xs mb-1">ou <span className="font-semibold text-gray-700">324 €/an</span> (27 €/mois — −10 %)</p>
              <p className="text-gray-400 text-xs mb-6">30 premiers jours offerts</p>
              <div className="space-y-2 mb-6 flex-1">
                {planFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm">
                    <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <CheckCircle size={10} className="text-blue-500" />
                    </div>
                    <span className="text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="block text-center bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors">
                Commencer gratuitement →
              </Link>
            </div>

            {/* Plan Illimité */}
            <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-lg flex flex-col">
              <p className="text-gray-900 text-sm font-semibold mb-1">Illimité</p>
              <p className="text-gray-400 text-xs mb-4">Lots illimités</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-extrabold text-gray-900">50 €</span>
                <span className="text-gray-400 pb-1.5">/mois</span>
              </div>
              <p className="text-gray-400 text-xs mb-1">ou <span className="font-semibold text-gray-700">540 €/an</span> (45 €/mois — −10 %)</p>
              <p className="text-gray-400 text-xs mb-6">30 premiers jours offerts</p>
              <div className="space-y-2 mb-6 flex-1">
                {planFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm">
                    <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <CheckCircle size={10} className="text-blue-500" />
                    </div>
                    <span className="text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="block text-center bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors">
                Commencer gratuitement →
              </Link>
            </div>

          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            Un abonnement par copropriété. Carte bancaire requise. Les 30 premiers jours ne seront pas facturés.
          </p>
        </div>
      </section>

      {/* ── Avis ── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Ils nous font confiance</p>
            <h2 className="text-3xl font-bold text-gray-900">Des syndics bénévoles comme vous</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Marie L.',
                role: 'Syndic bénévole · 8 lots',
                text: "Avant, je gérais tout sous Excel. Maintenant les répartitions de charges se font automatiquement. J'ai économisé des heures chaque mois.",
              },
              {
                name: 'Thierry M.',
                role: 'Syndic bénévole · 14 lots',
                text: "L'envoi des convocations et des PV par e-mail directement depuis l'app est un gain de temps énorme. Mes copropriétaires apprécient aussi !",
              },
              {
                name: 'Sophie D.',
                role: 'Syndic bénévole · 6 lots',
                text: "Simple, rapide, efficace. En 10 minutes j'avais saisi ma copropriété et mes premiers copropriétaires. L'outil idéal pour les petites copros.",
              },
            ].map(({ name, role, text }) => (
              <div key={name} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map((i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-24 px-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
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
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-10 py-4 rounded-2xl hover:bg-blue-50 transition-colors text-xl shadow-xl shadow-blue-900/30"
          >
            Démarrer gratuitement <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-blue-300/50 text-sm">20€/mois après l&apos;essai · Sans engagement · Résiliez à tout moment</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-[9px]">MSB</div>
            <span className="font-bold text-white text-sm">Mon Syndic Bénévole</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Mon Syndic Bénévole — Tous droits réservés
          </p>
          <div className="flex items-center gap-5 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-300 transition-colors">Connexion</Link>
            <Link href="/register" className="hover:text-gray-300 transition-colors">Inscription</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

