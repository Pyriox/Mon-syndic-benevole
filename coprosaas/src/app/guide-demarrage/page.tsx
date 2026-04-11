import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Receipt,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import LandingNav from '../LandingNav';
import PublicFooter from '@/components/layout/PublicFooter';
import GuideChecklist from './GuideChecklist';

export const metadata: Metadata = {
  title: 'Guide de démarrage syndic bénévole',
  description:
    'Guide complet pas à pas pour bien démarrer sur Mon Syndic Bénévole : compte, copropriété, lots, copropriétaires, appels de fonds, dépenses, AG et documents.',
  alternates: {
    canonical: 'https://www.mon-syndic-benevole.fr/guide-demarrage',
  },
  openGraph: {
    title: 'Guide de démarrage — Mon Syndic Bénévole',
    description:
      'Un guide complet, illustré et interactif pour prendre en main la plateforme page par page.',
    url: 'https://www.mon-syndic-benevole.fr/guide-demarrage',
    siteName: 'Mon Syndic Bénévole',
    locale: 'fr_FR',
    type: 'article',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Guide de démarrage Mon Syndic Bénévole',
      },
    ],
  },
};

type GuideStep = {
  id: string;
  step: string;
  title: string;
  page: string;
  href: string;
  icon: React.ElementType;
  accent: string;
  duration: string;
  objective: string;
  actions: string[];
  result: string;
  tips: string[];
  previewTitle: string;
  previewItems: string[];
};

const guideSteps: GuideStep[] = [
  {
    id: 'compte',
    step: 'Étape 1',
    title: 'Créer votre compte et accéder au tableau de bord',
    page: 'Pages `Connexion` / `Inscription` puis `Tableau de bord`',
    href: '/register',
    icon: Shield,
    accent: 'from-blue-500 to-indigo-500',
    duration: '2 à 3 min',
    objective: 'Entrer dans l’application et comprendre la logique générale de navigation.',
    actions: [
      'Créez votre compte avec votre e-mail, votre mot de passe et votre nom.',
      'Confirmez votre adresse si nécessaire, puis connectez-vous.',
      'Repérez les trois zones clés : le sélecteur de copropriété, la navigation de gauche et le tableau de bord central.',
    ],
    result: 'Vous êtes connecté et prêt à créer ou reprendre la gestion de votre copropriété.',
    tips: [
      'Si vous gérez plusieurs immeubles, un seul compte suffit ; chaque copropriété reste séparée.',
      'Le tableau de bord vous servira ensuite de vue synthétique : budget, impayés, incidents et AG.',
    ],
    previewTitle: 'Connexion puis tableau de bord',
    previewItems: ['Créer mon compte', 'Connexion', 'Tableau de bord', 'Alertes & indicateurs'],
  },
  {
    id: 'copropriete',
    step: 'Étape 2',
    title: 'Créer votre copropriété',
    page: 'Page `Copropriétés`',
    href: '/coproprietes/nouvelle',
    icon: Building2,
    accent: 'from-cyan-500 to-blue-500',
    duration: '3 à 5 min',
    objective: 'Poser la base administrative de votre immeuble.',
    actions: [
      'Renseignez le nom de la copropriété, l’adresse et le nombre de lots.',
      'Vérifiez que les informations générales correspondent bien à l’immeuble réellement géré.',
      'Une fois la copro créée, gardez-la sélectionnée dans le menu en haut à gauche.',
    ],
    result: 'Votre environnement de travail est prêt et toutes les pages suivantes seront automatiquement liées à cette copropriété.',
    tips: [
      'Si vous reprenez une copro existante, utilisez le vrai nom connu des copropriétaires pour éviter toute confusion.',
      'Vous pourrez compléter ou corriger les réglages plus tard dans le paramétrage.',
    ],
    previewTitle: 'Fiche copropriété',
    previewItems: ['Nom de la copro', 'Adresse', 'Nombre de lots', 'Paramétrage général'],
  },
  {
    id: 'lots',
    step: 'Étape 3',
    title: 'Renseigner les lots et les tantièmes',
    page: 'Page `Lots`',
    href: '/lots',
    icon: Wrench,
    accent: 'from-violet-500 to-fuchsia-500',
    duration: '5 à 10 min',
    objective: 'Préparer la répartition correcte des charges et des appels de fonds.',
    actions: [
      'Ajoutez chaque lot avec son numéro, son type et ses tantièmes.',
      'Vérifiez la somme totale des tantièmes et corrigez les éventuelles anomalies.',
      'Si votre immeuble utilise des clés spéciales (ascenseur, bâtiment, parking…), paramétrez-les ici ou dans la fiche copropriété.',
    ],
    result: 'Les futures répartitions financières seront calculées automatiquement sur la bonne base.',
    tips: [
      'C’est la page la plus structurante : prenez quelques minutes pour bien la renseigner dès le départ.',
      'Si vous avez un état descriptif de division, gardez-le à côté pour aller plus vite.',
    ],
    previewTitle: 'Registre des lots',
    previewItems: ['Lot 1', 'Lot 2', 'Tantièmes', 'Clés spéciales éventuelles'],
  },
  {
    id: 'coproprietaires',
    step: 'Étape 4',
    title: 'Ajouter les copropriétaires et leurs soldes de reprise',
    page: 'Page `Copropriétaires`',
    href: '/coproprietaires',
    icon: Users,
    accent: 'from-emerald-500 to-teal-500',
    duration: '5 à 10 min',
    objective: 'Associer chaque personne ou entité à ses lots et repartir sur une base propre.',
    actions: [
      'Créez chaque copropriétaire avec son nom, son e-mail et ses coordonnées utiles.',
      'Affectez les lots correspondants à chacun.',
      'Si vous reprenez une gestion en cours d’année, utilisez le solde à la reprise pour refléter la situation réelle de départ.',
      'Invitez ensuite les copropriétaires qui souhaitent accéder à leur espace personnel.',
    ],
    result: 'Vous disposez d’un registre complet, exploitable pour les appels de fonds, les convocations et le suivi des soldes.',
    tips: [
      'Si un copropriétaire ne souhaite pas se connecter, ce n’est pas bloquant : la plateforme fonctionne quand même.',
      'L’historique financier individuel devient très utile dès que vous commencez à enregistrer paiements et ajustements.',
    ],
    previewTitle: 'Liste des copropriétaires',
    previewItems: ['Nom / raison sociale', 'Lots associés', 'Solde', 'Invitation e-mail'],
  },
  {
    id: 'appels',
    step: 'Étape 5',
    title: 'Créer votre premier appel de fonds',
    page: 'Page `Appels de fonds`',
    href: '/appels-de-fonds',
    icon: Receipt,
    accent: 'from-amber-500 to-orange-500',
    duration: '5 min',
    objective: 'Émettre les provisions ou appels exceptionnels et démarrer le suivi des paiements.',
    actions: [
      'Créez un appel de fonds avec son titre, sa date d’échéance et son montant.',
      'Laissez la plateforme calculer automatiquement la quote-part de chaque copropriétaire selon les tantièmes.',
      'Publiez l’appel pour générer les lignes, les avis PDF et les éventuels envois e-mail.',
      'Si vous reprenez un exercice déjà commencé, marquez directement comme payés les versements déjà encaissés.',
    ],
    result: 'Vos provisions sont lancées, les soldes sont mis à jour et les impayés peuvent être suivis correctement.',
    tips: [
      'Pour les appels historiques importés, le statut finalisé est pris en compte dans les impayés du tableau de bord.',
      'Ne laissez pas un appel en brouillon si vous attendez qu’il apparaisse dans les suivis financiers.',
    ],
    previewTitle: 'Appel de fonds',
    previewItems: ['Montant total', 'Échéance', 'Répartition automatique', 'Publier / suivre les paiements'],
  },
  {
    id: 'depenses',
    step: 'Étape 6',
    title: 'Suivre dépenses, paiements et impayés',
    page: 'Pages `Dépenses` et `Tableau de bord`',
    href: '/dashboard',
    icon: LayoutDashboard,
    accent: 'from-rose-500 to-red-500',
    duration: 'au fil de l’eau',
    objective: 'Piloter la trésorerie de la copropriété et garder une vision claire des encaissements et anomalies.',
    actions: [
      'Ajoutez chaque dépense en la classant dans la bonne catégorie.',
      'Marquez les paiements reçus sur les lignes d’appel de fonds concernées.',
      'Surveillez le tableau de bord : provisions, dépenses réelles, solde impayé, incidents et alertes.',
    ],
    result: 'Votre situation financière reste à jour et exploitable sans retraitement manuel.',
    tips: [
      'Le `solde impayé` repose sur les appels échus non marqués comme payés : il doit donc correspondre à votre réalité terrain.',
      'En cas d’erreur, privilégiez un ajustement ou une correction de paiement plutôt qu’une suppression de trace comptable.',
    ],
    previewTitle: 'Pilotage quotidien',
    previewItems: ['Dépenses réelles', 'Impayés', 'Incidents', 'Alertes à traiter'],
  },
  {
    id: 'ag',
    step: 'Étape 7',
    title: 'Préparer et tenir votre assemblée générale',
    page: 'Page `Assemblées`',
    href: '/assemblees',
    icon: CalendarDays,
    accent: 'from-indigo-500 to-purple-500',
    duration: 'selon votre ordre du jour',
    objective: 'Organiser l’AG, centraliser les résolutions et produire les documents utiles.',
    actions: [
      'Créez l’assemblée avec la date, le lieu et le type de séance.',
      'Ajoutez les résolutions et l’ordre du jour.',
      'Envoyez les convocations, suivez la tenue de l’AG puis générez le procès-verbal.',
    ],
    result: 'La partie administrative de l’AG reste structurée, centralisée et beaucoup plus simple à retrouver.',
    tips: [
      'Préparez d’abord la base copropriétaires + lots pour éviter les blocages au moment des convocations.',
      'Après une AG budgétaire, vous pouvez enchaîner rapidement avec les appels de fonds correspondants.',
    ],
    previewTitle: 'Assemblée générale',
    previewItems: ['Date et lieu', 'Résolutions', 'Convocation', 'Procès-verbal'],
  },
  {
    id: 'documents',
    step: 'Étape 8',
    title: 'Classer les documents, suivre les incidents et demander de l’aide',
    page: 'Pages `Documents`, `Incidents`, `Aide`',
    href: '/documents',
    icon: FileText,
    accent: 'from-slate-600 to-slate-800',
    duration: 'usage continu',
    objective: 'Conserver l’historique administratif de la copropriété et gagner du temps au quotidien.',
    actions: [
      'Rangez vos devis, factures, PV, convocations et justificatifs dans les bons dossiers.',
      'Ouvrez un incident quand un sujet de maintenance doit être suivi.',
      'Utilisez la page Aide pour retrouver les réponses fréquentes ou écrire au support.',
    ],
    result: 'Toute la gestion courante est centralisée dans un seul espace, accessible et documenté.',
    tips: [
      'Un bon classement documentaire évite énormément d’allers-retours par e-mail.',
      'La page Aide est utile aussi pour un nouveau copropriétaire invité qui découvre la plateforme.',
    ],
    previewTitle: 'Documents et support',
    previewItems: ['Classement des fichiers', 'Incidents en cours', 'FAQ', 'Contact support'],
  },
];

function GuidePreview({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 bg-slate-50">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <p className="ml-2 text-xs font-medium text-slate-500">Illustration de l’écran</p>
      </div>
      <div className="p-4">
        <div className={`rounded-xl bg-gradient-to-r ${accent} px-3 py-2 text-sm font-semibold text-white`}>
          {title}
        </div>
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GuideDemarragePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Guide de démarrage Mon Syndic Bénévole',
    description: 'Prendre en main la plateforme pas à pas pour gérer une copropriété en syndic bénévole.',
    step: guideSteps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      url: `https://www.mon-syndic-benevole.fr/guide-demarrage#${step.id}`,
      text: step.actions.join(' '),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <LandingNav />

        <main>
          <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white pt-24 pb-14">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-100">
                <BookOpen size={14} /> Nouveau sur la plateforme ? Commencez ici
              </span>

              <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Guide complet de démarrage
              </h1>
              <p className="mt-4 max-w-3xl text-base sm:text-lg text-blue-100/85 leading-relaxed">
                Un parcours <strong>étape par étape</strong>, <strong>page par page</strong>, pour aider un nouveau syndic bénévole à
                prendre la main rapidement sur <strong>Mon Syndic Bénévole</strong> : configuration, lots, copropriétaires,
                appels de fonds, dépenses, AG et documents.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                {[
                  'Temps de prise en main : 20 à 30 min',
                  'Pensé pour un premier démarrage réel',
                  'Guide interactif avec progression',
                ].map((item) => (
                  <span key={item} className="rounded-full bg-white/10 px-3 py-1.5 text-blue-50 border border-white/10">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
                  Créer mon compte <ArrowRight size={16} />
                </Link>
                <Link href="#sommaire" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10 transition-colors">
                  Voir le guide
                </Link>
              </div>
            </div>
          </section>

          <section id="sommaire" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <GuideChecklist steps={guideSteps.map((step) => ({ id: step.id, label: step.title }))} />

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BellRing size={16} className="text-indigo-600" />
                <h2 className="text-lg font-bold">Sommaire page par page</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {guideSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <Link
                      key={step.id}
                      href={`#${step.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-indigo-700">
                        <Icon size={15} />
                        <span className="text-xs font-semibold uppercase tracking-wide">{step.step}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{step.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{step.page}</p>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Page</th>
                    <th className="px-4 py-3 text-left font-semibold">À quoi elle sert</th>
                    <th className="px-4 py-3 text-left font-semibold">Quand y aller</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Tableau de bord', 'Voir l’état général de la copropriété', 'Chaque jour'],
                    ['Copropriétés', 'Créer et paramétrer l’immeuble', 'Au démarrage puis ponctuellement'],
                    ['Lots', 'Définir les tantièmes et bases de répartition', 'Au démarrage, puis si un lot change'],
                    ['Copropriétaires', 'Tenir le registre et inviter les membres', 'Au démarrage puis à chaque mouvement'],
                    ['Appels de fonds', 'Émettre, publier et suivre les encaissements', 'À chaque échéance'],
                    ['Dépenses', 'Enregistrer la vie financière réelle', 'Au fil de l’eau'],
                    ['Assemblées', 'Préparer convocations, votes et PV', 'Avant et après chaque AG'],
                    ['Documents / Aide', 'Classer, retrouver et se faire accompagner', 'En continu'],
                  ].map(([page, usage, timing]) => (
                    <tr key={page}>
                      <td className="px-4 py-3 font-medium text-slate-900">{page}</td>
                      <td className="px-4 py-3 text-slate-600">{usage}</td>
                      <td className="px-4 py-3 text-slate-600">{timing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 space-y-6">
            {guideSteps.map((step) => {
              const Icon = step.icon;
              return (
                <section key={step.id} id={step.id} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                          {step.step}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {step.duration}
                        </span>
                      </div>

                      <div className="mt-3 flex items-start gap-3">
                        <div className={`mt-1 rounded-xl bg-gradient-to-r ${step.accent} p-2 text-white`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
                          <p className="text-sm text-slate-500 mt-1">{step.page}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Objectif</p>
                        <p className="mt-1 text-sm text-blue-900">{step.objective}</p>
                      </div>

                      <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">À faire sur cette page</p>
                          <ol className="mt-2 space-y-2 text-sm text-slate-700">
                            {step.actions.map((action, index) => (
                              <li key={action} className="flex gap-2">
                                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                                  {index + 1}
                                </span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">Résultat attendu</p>
                          <div className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                            <div className="flex items-start gap-2">
                              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-700" />
                              <span>{step.result}</span>
                            </div>
                          </div>

                          <p className="mt-4 text-sm font-semibold text-slate-900">Conseils pratiques</p>
                          <ul className="mt-2 space-y-2 text-sm text-slate-700">
                            {step.tips.map((tip) => (
                              <li key={tip} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-5">
                        <Link href={step.href} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                          Ouvrir la page correspondante <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>

                    <GuidePreview title={step.previewTitle} items={step.previewItems} accent={step.accent} />
                  </div>
                </section>
              );
            })}
          </section>

          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  <h2 className="text-lg font-bold">Si vous êtes un copropriétaire invité</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  <li><strong>1.</strong> Connectez-vous via le lien reçu par e-mail.</li>
                  <li><strong>2.</strong> Ouvrez votre tableau de bord pour voir votre solde, vos appels et la prochaine AG.</li>
                  <li><strong>3.</strong> Consultez vos documents et utilisez la page Aide si vous avez une question.</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-900">Besoin d’un accompagnement ?</h2>
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  Ce guide vous permet d’être opérationnel rapidement, mais vous pouvez aussi utiliser la page <strong>Aide</strong>
                  directement dans l’application pour retrouver les réponses fréquentes ou écrire au support.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                    Essayer gratuitement
                  </Link>
                  <Link href="/blog" className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100/60 transition-colors">
                    Lire les conseils du blog
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
