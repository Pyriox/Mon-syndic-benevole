import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2, Users, LayoutDashboard, CalendarDays,
  FileText, Clock, ArrowRight, Star, CheckCircle2,
} from 'lucide-react';
import LandingNav from '@/app/LandingNav';
import SiteLogo from '@/components/ui/SiteLogo';
import FeatureShowcase from './FeatureShowcase';

export const metadata: Metadata = {
  title: 'Guide & Démo — Mon Syndic Bénévole',
  description:
    "Découvrez toutes les fonctionnalités de Mon Syndic Bénévole : tableau de bord, appels de fonds, assemblées générales, dépenses, documents et incidents. Guide interactif avec aperçu de l'interface.",
  openGraph: {
    title: 'Guide & Démo — Mon Syndic Bénévole',
    description: 'Explorez chaque fonctionnalité avec un aperçu réel de l\'interface. Aucune inscription requise.',
    url: 'https://mon-syndic-benevole.fr/demo',
  },
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-blue-500/20 text-blue-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
            Guide interactif
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Découvrez Mon Syndic Bénévole{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              en 5 minutes
            </span>
          </h1>
          <p className="text-blue-200/80 text-lg mb-8">
            Explorez chaque fonctionnalité avec des aperçus réels de l&apos;interface.
            Aucune inscription requise.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Essai gratuit 14 jours <ArrowRight size={16} />
            </Link>
            <Link
              href="#fonctionnalites"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Explorer les fonctionnalités
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick start ──────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-900 mb-8">Démarrez en 3 étapes</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                time: '2 min',
                icon: Building2,
                title: 'Créez votre copropriété',
                desc: 'Nom, adresse, règlement de copropriété. Votre espace est prêt instantanément.',
                color: 'bg-blue-500',
              },
              {
                step: '2',
                time: '5 min',
                icon: Users,
                title: 'Ajoutez lots & copropriétaires',
                desc: 'Configurez chaque lot avec ses tantièmes. Invitez les copropriétaires par email.',
                color: 'bg-indigo-500',
              },
              {
                step: '3',
                time: 'Quotidien',
                icon: LayoutDashboard,
                title: 'Gérez au quotidien',
                desc: 'Dépenses, appels de fonds, AG, incidents. Tout est centralisé et accessible.',
                color: 'bg-violet-500',
              },
            ].map(({ step, time, icon: Icon, title, desc, color }) => (
              <div key={step} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Clock size={12} />
                    {time}
                  </div>
                </div>
                {/* Background step number */}
                <span className="absolute top-3 right-4 text-gray-100 font-black text-5xl leading-none select-none pointer-events-none">
                  {step}
                </span>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature showcase (interactive tabs) ──────────────────────────── */}
      <section id="fonctionnalites" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Toutes les fonctionnalités
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Cliquez sur chaque module pour voir l&apos;interface en détail et comprendre ce que vous pouvez faire.
            </p>
          </div>
          <FeatureShowcase />
        </div>
      </section>

      {/* ── Vue copropriétaire ────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Users size={15} />
              Vue copropriétaire
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Un espace dédié pour chaque résident
            </h2>
            <p className="text-gray-500 leading-relaxed mb-5">
              Vos copropriétaires accèdent à un espace personnel sécurisé. Ils consultent leurs
              charges, téléchargent les documents partagés et suivent les assemblées — sans
              pouvoir modifier la comptabilité ni les paramètres.
            </p>
            <ul className="space-y-2.5">
              {[
                'Solde personnel et historique des paiements',
                'Appels de fonds à régler (montant et échéance)',
                'Documents partagés par le syndic',
                'Dates et compte-rendus des AG',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mock copropriétaire screen */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg select-none">
            <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 bg-gray-700 rounded px-3 py-0.5 text-[10px] text-gray-400 text-center max-w-48 mx-auto">
                mon-syndic-benevole.fr
              </div>
            </div>
            <div className="bg-gray-50 p-3 space-y-2.5">
              {/* Header */}
              <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <SiteLogo size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-900">Bonjour, Jean Dupont</p>
                  <p className="text-[9px] text-gray-400">Résidence Les Acacias · Lot A01</p>
                </div>
              </div>
              {/* Solde + prochain appel */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] text-gray-400 mb-0.5">Mon solde</p>
                  <p className="text-sm font-bold text-green-600">À jour ✓</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
                  <p className="text-[9px] text-gray-400 mb-0.5">Prochain appel</p>
                  <p className="text-sm font-bold text-blue-600">375 €</p>
                </div>
              </div>
              {/* Prochaine AG */}
              <div className="bg-white border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Prochaine AG</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <CalendarDays size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-800">AGO 2026</p>
                    <p className="text-[9px] text-gray-400">30 mars · 10h00 · Salle commune</p>
                  </div>
                </div>
              </div>
              {/* Documents */}
              <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Documents partagés</p>
                {['PV AGO 2025.pdf', 'Appel de fonds T4 2025.pdf', 'Contrat d\'entretien 2026.pdf'].map((f) => (
                  <div key={f} className="flex items-center gap-2 py-1 border-t border-gray-50 first:border-0">
                    <FileText size={10} className="text-blue-400 shrink-0" />
                    <p className="text-[9px] text-gray-600 flex-1 truncate">{f}</p>
                    <span className="text-[8px] text-blue-500 font-medium">PDF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center"
        data-cta-final
      >
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={18} fill="currentColor" className="text-yellow-300" />
            ))}
          </div>
          <h2 className="text-3xl font-extrabold mb-3">Prêt à simplifier votre gestion ?</h2>
          <p className="text-blue-100 mb-8 leading-relaxed">
            14 jours d&apos;essai gratuit. Aucune carte bancaire requise.
            Configuration en moins de 10 minutes.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
            >
              Créer mon compte gratuitement <ArrowRight size={16} />
            </Link>
            <Link
              href="/#tarif"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-medium px-6 py-3.5 rounded-xl text-sm transition-colors"
            >
              Voir les tarifs
            </Link>
          </div>
          <p className="mt-5 text-blue-200/60 text-xs">
            À partir de 25 €/mois · Sans engagement · Données hébergées en Europe
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-6 px-4 bg-gray-900 text-center">
        <p className="text-gray-500 text-xs">
          © 2026 Mon Syndic Bénévole ·{' '}
          <Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">
            Mentions légales
          </Link>
          {' · '}
          <Link href="/" className="hover:text-gray-300 transition-colors">
            Accueil
          </Link>
          {' · '}
          <Link href="/blog" className="hover:text-gray-300 transition-colors">
            Blog
          </Link>
        </p>
      </footer>
    </div>
  );
}
