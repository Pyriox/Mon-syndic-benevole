// ============================================================
// Blog — métadonnées des articles
// ============================================================

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date string
  updatedAt?: string;
  readingTime: number; // minutes
  category: string;
  keywords: string[];
  toc: { id: string; text: string }[];
  faqs?: { q: string; a: string }[];
}

export const posts: BlogPost[] = [
  {
    slug: 'gerer-copropriete-sans-syndic-professionnel',
    title: 'Gérer une copropriété sans syndic professionnel : guide pratique',
    description:
      'Peut-on gérer une copropriété sans syndic professionnel ? Étapes, obligations, avantages, limites et outils utiles pour un syndic bénévole.',
    // 143 chars — dans la limite Google
    publishedAt: '2026-03-19',
    readingTime: 8,
    category: 'Guide pratique',
    keywords: [
      'syndic bénévole',
      'gestion copropriété sans syndic professionnel',
      'logiciel syndic bénévole',
      'obligations syndic bénévole',
      'avantages syndic bénévole vs syndic professionnel',
      'comment gérer une copropriété bénévole',
      'passer syndic professionnel à syndic bénévole',
    ],
    toc: [
      { id: 'ce-que-dit-la-loi', text: 'Ce que la loi dit — en 3 lignes' },
      { id: 'profils', text: 'Trois profils, trois organisations différentes' },
      { id: 'temps-reel', text: 'Combien de temps ça prend vraiment' },
      { id: 'economie', text: 'Ce que ça représente concrètement en économies' },
      { id: 'responsabilites', text: 'Les vraies responsabilités du syndic bénévole' },
      { id: 'cas-pratiques', text: '3 situations difficiles et comment les gérer' },
      { id: 'pourquoi-se-perdent', text: 'Pourquoi autant de syndics bénévoles abandonnent en cours de route' },
      { id: 'quand-professionnel', text: 'Les 4 cas où un syndic professionnel reste plus adapté' },
      { id: 'comment-passer', text: 'Comment passer d\'un syndic professionnel à un syndic bénévole en 5 étapes' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'en-resume', text: 'En résumé' },
    ],
    faqs: [
      {
        q: "Un copropriétaire sans formation peut-il être syndic bénévole ?",
        a: "Oui. La loi du 10 juillet 1965 n'impose aucun diplôme, agrément ou formation spécifique pour devenir syndic bénévole. Il suffit d'être copropriétaire et d'être élu en assemblée générale à la majorité de l'article 25.",
      },
      {
        q: "Le syndic bénévole a-t-il les mêmes obligations légales qu'un syndic professionnel ?",
        a: "Oui. Le syndic bénévole est soumis aux mêmes obligations légales que tout syndic : convoquer l'AG, tenir les comptes, gérer le fonds de travaux, déclarer les sinistres dans les délais contractuels, archiver les documents.",
      },
      {
        q: "Combien coûte une gestion en syndic bénévole par rapport à un syndic professionnel ?",
        a: "Un syndic professionnel facture en moyenne 150 à 300 € par lot et par an. Une gestion bénévole avec un logiciel dédié revient à quelques dizaines d'euros par mois pour l'ensemble de la copropriété, quel que soit le nombre de lots.",
      },
      {
        q: "Comment passer d'un syndic professionnel à un syndic bénévole ?",
        a: "La transition nécessite un vote en AG à la majorité de l'article 25, la récupération des archives auprès de l'ancien syndic dans les 15 jours, l'ouverture d'un compte bancaire séparé au nom du syndicat, et la notification des prestataires du changement.",
      },
      {
        q: "Peut-on ne pas avoir de syndic dans une copropriété ?",
        a: "Non. La loi du 10 juillet 1965 impose l'existence d'un syndic dans toute copropriété, sans exception. Ce qui est libre, c'est la nature du syndic : professionnel ou bénévole. Gérer sans syndic professionnel signifie confier la gestion à un copropriétaire élu, pas supprimer toute organisation. Une copropriété sans aucun syndic est en situation irrégulière.",
      },
      {
        q: "Quelles sont les obligations légales d'une copropriété gérée en bénévole ?",
        a: "Les obligations sont identiques à celles d'une copropriété avec un syndic professionnel : AG annuelle avec 21 jours de préavis minimum, appels de fonds trimestriels, compte bancaire séparé au nom du syndicat, fonds de travaux ALUR sur compte rémunéré séparé (si plus de 10 lots), assurance multirisques immeuble, archivage des documents pendant 10 ans. Le bénévolat concerne la personne qui exerce — pas le niveau d'exigence légale.",
      },
    ],
  },
  {
    slug: 'appel-de-fonds-copropriete-calcul-repartition',
    title: 'Appel de fonds copropriété : calcul, répartition et modèle',
    description:
      'Comment calculer un appel de fonds en copropriété ? Méthode, répartition par tantièmes, obligations et conseils pratiques pour syndic bénévole.',
    // 152 chars
    publishedAt: '2026-03-19',
    readingTime: 9,
    category: 'Guide pratique – Finances',
    keywords: [
      'appel de fonds copropriété',
      'calcul appel de fonds copropriété',
      'répartition charges copropriété tantièmes',
      'tantièmes millièmes copropriété',
      'budget prévisionnel copropriété',
      'implayés charges copropriété procédure',
      'appel de fonds trimestriel',
      'charges générales spéciales copropriété',
    ],
    toc: [
      { id: 'definition', text: 'Qu\'est-ce qu\'un appel de fonds, exactement ?' },
      { id: 'tantiemes', text: 'La base de tout : les tantièmes' },
      { id: 'types-charges', text: 'Les deux types de charges et leur répartition' },
      { id: 'calcul-trimestriel', text: 'Comment calculer un appel de fonds trimestriel : la méthode pas à pas' },
      { id: 'template-avis', text: 'Modèle d\'avis de paiement : mentions obligatoires' },
      { id: 'appel-exceptionnel', text: 'L\'appel de fonds exceptionnel : même logique, calendrier différent' },
      { id: 'impayes', text: 'Ce qui se passe quand un copropriétaire ne paie pas' },
      { id: 'regularisation', text: 'La régularisation annuelle : l\'étape que tout le monde redoute' },
      { id: 'manuel-vs-outil', text: 'Ce que ça représente de faire ça manuellement' },
      { id: 'fonds-travaux-alur', text: 'Appel de fonds et fonds de travaux ALUR : ne pas confondre' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'ce-quil-faut-retenir', text: 'Ce qu\'il faut retenir' },
    ],
    faqs: [
      {
        q: "À quelle fréquence émettre les appels de fonds en copropriété ?",
        a: "Les appels de fonds de budget prévisionnel sont émis chaque trimestre, en début de trimestre (1er janvier, 1er avril, 1er juillet, 1er octobre). Les appels exceptionnels pour travaux suivent le calendrier voté en AG.",
      },
      {
        q: "Comment calculer la part d'un copropriétaire dans un appel de fonds ?",
        a: "La quote-part se calcule en multipliant le montant total de l'appel par les tantièmes du lot, divisés par le total des tantièmes de la copropriété. Exemple : 120 tantièmes sur 1 000, appel trimestriel de 3 600 € → 432 € pour ce lot.",
      },
      {
        q: "Que faire si un copropriétaire ne paie pas ses charges ?",
        a: "La procédure est progressive : mise en demeure, puis injonction de payer auprès du tribunal judiciaire. Le syndicat bénéficie d'une hypothèque légale sur le lot du débiteur. Une relance proactive dès le premier retard évite généralement d'en arriver là.",
      },
      {
        q: "Quelle est la différence entre appel de fonds et fonds de travaux ALUR ?",
        a: "L'appel de fonds couvre les charges courantes et les travaux votés. Le fonds de travaux ALUR est une cotisation annuelle obligatoire (5 % du budget minimum) placée sur un compte séparé pour anticiper les gros travaux futurs.",
      },
    ],
  },
  {
    slug: 'fonds-de-travaux-alur-obligations-montant-gestion',
    title: 'Fonds de travaux ALUR : obligations, montant et gestion',
    description:
      'Tout comprendre sur le fonds de travaux ALUR : montant minimum, copropriétés concernées, règles de gestion et impact pour un syndic bénévole.',
    // 150 chars
    publishedAt: '2026-03-19',
    readingTime: 8,
    category: 'Guide pratique – Finances & Réglementation',
    keywords: [
      'fonds de travaux ALUR',
      'fonds travaux copropriété obligatoire',
      'cotisation fonds travaux',
      '5% budget prévisionnel',
      'loi ALUR copropriété',
      'compte séparé fonds travaux',
    ],
    toc: [
      { id: 'contexte-loi-alur', text: 'Pourquoi ce fonds existe : le contexte de la loi ALUR' },
      { id: 'qui-est-concerne', text: 'Qui est concerné ?' },
      { id: 'montant-minimum', text: 'Le montant minimum : ce que dit la loi' },
      { id: 'planification', text: 'Comment calculer un plan de dotation réaliste' },
      { id: 'vote-ag', text: 'Le vote en AG : quelle majorité ?' },
      { id: 'compte-separe', text: 'Un compte bancaire séparé : l\'obligation méconnue' },
      { id: 'utilisation', text: 'À quoi peuvent servir ces fonds ?' },
      { id: 'vente-lot', text: 'Ce qui se passe lors de la vente d\'un lot' },
      { id: 'risques', text: 'Les risques en cas de non-respect' },
      { id: 'notre-outil', text: 'Gérer le fonds de travaux sans erreur : ce que l\'outil automatise' },
      { id: 'dtg', text: 'Fonds de travaux et plan pluriannuel de travaux (PPT)' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'ce-quil-faut-retenir', text: 'Ce qu\'il faut retenir' },
    ],
    faqs: [
      {
        q: "Le fonds de travaux ALUR est-il obligatoire pour toutes les copropriétés ?",
        a: "Il est obligatoire pour les copropriétés de 10 lots ou plus depuis le 1er janvier 2017. Les copropriétés de moins de 10 lots peuvent en constituer un volontairement.",
      },
      {
        q: "Quel est le montant minimum du fonds de travaux obligatoire ?",
        a: "Le minimum légal est de 5 % du montant du budget prévisionnel des charges courantes voté en AG. L'AG peut voter un montant supérieur selon les besoins de l'immeuble.",
      },
      {
        q: "Les sommes versées au fonds de travaux sont-elles remboursables lors d'une vente ?",
        a: "Non. Lors de la vente d'un lot, les sommes versées au fonds de travaux restent acquises à la copropriété. Elles ne sont pas remboursables au vendeur.",
      },
      {
        q: "Sur quel compte bancaire doit être placé le fonds de travaux ?",
        a: "Le fonds de travaux doit obligatoirement être placé sur un compte bancaire séparé du compte courant de la copropriété, au nom du syndicat des copropriétaires.",
      },
    ],
  },
  // ── Nouveaux articles ────────────────────────────────────────────────────────
  {
    slug: 'comment-devenir-syndic-benevole',
    title: 'Comment devenir syndic bénévole : les 6 étapes indispensables',
    description:
      'Comment devenir syndic bénévole : conditions légales, élection en AG, démarches dans les 30 premiers jours et obligations récurrentes. Guide complet 2026.',
    publishedAt: '2026-03-21',
    readingTime: 10,
    category: 'Guide pratique – Devenir syndic',
    keywords: [
      'comment devenir syndic bénévole',
      'syndic bénévole',
      'élection syndic bénévole',
      'devenir syndic copropriété',
      'démarches syndic bénévole',
      'syndic non professionnel',
    ],
    toc: [
      { id: 'conditions-legales', text: 'Qui peut devenir syndic bénévole ?' },
      { id: 'election-ag', text: 'L\'élection en AG : comment ça se passe ?' },
      { id: '48h', text: 'J+1 : les premières actions dans les 48h' },
      { id: '30-premiers-jours', text: 'Les 30 premiers jours : 5 démarches indispensables' },
      { id: 'premier-trimestre', text: 'Le premier trimestre : ce qui vous attend concrètement' },
      { id: 'obligations-recurrentes', text: 'Les obligations récurrentes une fois en poste' },
      { id: 'premieres-questions-copros', text: 'Les 5 premières questions des copropriétaires' },
      { id: 'erreurs-debut', text: 'Les 4 erreurs classiques qui coûtent des heures (ou pire, des procès)' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'en-resume', text: 'En résumé' },
    ],
    faqs: [
      {
        q: "Faut-il un diplôme ou une formation pour devenir syndic bénévole ?",
        a: "Non. Aucun diplôme, agrément ou formation n'est requis. Il suffit d'être copropriétaire de l'immeuble et d'être élu en assemblée générale à la majorité de l'article 25.",
      },
      {
        q: "Quelles sont les premières démarches après l'élection comme syndic bénévole ?",
        a: "Dans les 30 premiers jours : récupérer les archives de l'ancien syndic (sous 15 jours), ouvrir un compte bancaire au nom du syndicat des copropriétaires, notifier les prestataires, constituer le registre des copropriétaires, et identifier les contrats en cours.",
      },
      {
        q: "Le syndic bénévole peut-il être rémunéré ?",
        a: "Oui, si l'assemblée générale vote une rémunération. La loi ne l'interdit pas. En pratique, beaucoup de syndics bénévoles exercent sans rémunération ou avec une compensation forfaitaire modeste.",
      },
      {
        q: "Combien de temps prend la gestion d'une copropriété en syndic bénévole ?",
        a: "Pour un immeuble de 5 à 20 lots, comptez entre 2 et 5 heures par mois en gestion courante, plus 4 à 8 heures pour la préparation de l'AG annuelle. Un logiciel dédié réduit significativement ce temps.",
      },
    ],
  },
  {
    slug: 'obligations-syndic-benevole',
    title: 'Obligations du syndic bénévole : ce qu’il faut savoir',
    description:
      'Quelles sont les obligations légales du syndic bénévole ? AG, comptabilité, documents, assurance, fonds travaux et responsabilités à connaître.',
    publishedAt: '2026-03-21',
    readingTime: 9,
    category: 'Guide pratique – Obligations légales',
    keywords: [
      'obligations syndic bénévole',
      'responsabilités syndic bénévole',
      'obligations légales copropriété',
      'checklist syndic bénévole',
      'loi copropriété syndic',
      'mandat syndic obligations',
    ],
    toc: [
      { id: 'cadre-legal', text: 'D\'où viennent ces obligations ? Le cadre légal' },
      { id: 'calendrier-annuel', text: 'Le calendrier complet des obligations annuelles' },
      { id: 'convocation-ag', text: 'Template : convocation d\'AG conforme' },
      { id: 'pv-ag', text: 'Template : procès-verbal d\'AG' },
      { id: 'mise-en-demeure', text: 'Template : mise en demeure pour charges impayées' },
      { id: 'erreurs-a-eviter', text: '5 erreurs qui finissent en contentieux' },
      { id: 'checklist', text: 'Checklist des obligations par période' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'en-resume', text: 'En résumé' },
    ],
    faqs: [
      {
        q: "Quelles sont les principales obligations légales du syndic bénévole ?",
        a: "Le syndic bénévole doit : convoquer l'AG annuelle avec 21 jours de préavis, tenir les comptes, émettre les appels de fonds trimestriels, gérer le fonds de travaux ALUR, maintenir l'assurance multirisques immeuble, et archiver les documents pendant 10 ans.",
      },
      {
        q: "Le syndic bénévole est-il obligé d'ouvrir un compte bancaire séparé ?",
        a: "Oui. La loi du 10 juillet 1965 (article 18-2) impose que le compte soit ouvert au nom du syndicat des copropriétaires, distinct des comptes personnels du syndic. Un second compte séparé est requis pour le fonds de travaux.",
      },
      {
        q: "Quelle est la responsabilité du syndic bénévole en cas de faute ?",
        a: "Le syndic bénévole engage sa responsabilité civile comme tout mandataire. En cas de faute (AG non convoquée dans les délais, absence d'assurance, comptabilité irrégulière), il peut être mis en cause par les copropriétaires lésés.",
      },
      {
        q: "Combien de temps faut-il conserver les documents de copropriété ?",
        a: "Les documents doivent être conservés pendant au moins 10 ans : procès-verbaux d'AG, contrats, factures, correspondances importantes.",
      },
    ],
  },
  {
    slug: 'logiciel-syndic-benevole',
    title: 'Logiciel syndic bénévole : comment choisir le bon outil ?',
    description:
      'Quel logiciel choisir pour un syndic bénévole ? Comparez les fonctions essentielles : appels de fonds, AG, documents, charges et suivi des incidents.',
    publishedAt: '2026-03-21',
    readingTime: 9,
    category: 'Guide pratique – Outils & Logiciels',
    keywords: [
      'logiciel syndic bénévole',
      'logiciel gestion copropriété',
      'outil syndic bénévole',
      'application copropriété',
      'logiciel appel de fonds copropriété',
      'gestion copropriété sans cabinet',
    ],
    toc: [
      { id: 'excel-vs-logiciel', text: 'La comparaison honnête : Excel, logiciel dédié, syndic pro' },
      { id: 'pourquoi-excel-ne-suffit-pas', text: 'Pourquoi Excel ne suffit plus après un an' },
      { id: 'fonctionnalites-indispensables', text: 'Les 6 fonctionnalités vraiment indispensables' },
      { id: 'migration-excel', text: 'Comment migrer depuis Excel en 30 minutes' },
      { id: 'couts', text: 'Le vrai coût : Excel, logiciel dédié, syndic pro' },
      { id: 'criteres-de-choix', text: 'Les critères qui font vraiment la différence' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'en-resume', text: 'En résumé' },
    ],
    faqs: [
      {
        q: "Quel logiciel choisir pour gérer une copropriété en syndic bénévole ?",
        a: "Un bon logiciel de syndic bénévole doit couvrir : la gestion des lots et tantièmes, la génération automatique des appels de fonds, le suivi des paiements, la comptabilité (compte courant + fonds de travaux séparé), la gestion des AG et l'accès des copropriétaires à leurs documents.",
      },
      {
        q: "À partir de combien de lots est-il utile d'utiliser un logiciel de gestion de copropriété ?",
        a: "Dès le deuxième lot. Même une petite copropriété de 3 ou 4 lots a besoin d'un suivi rigoureux des appels de fonds, des paiements et des AG. Le temps gagné justifie le coût dès la première année.",
      },
      {
        q: "Combien coûte un logiciel de gestion pour syndic bénévole ?",
        a: "Mon Syndic Bénévole coûte moins de 25 € par mois pour l'ensemble de la copropriété, quel que soit le nombre de lots. C'est à comparer à 1 500–5 000 € par an pour un syndic professionnel sur un immeuble de 10 à 20 lots.",
      },
      {
        q: "Un logiciel de syndic bénévole est-il conforme aux obligations légales ?",
        a: "Mon Syndic Bénévole intègre la gestion du fonds de travaux ALUR sur compte séparé, la comptabilité en parties doubles pour les copropriétés de plus de 10 lots, et les modèles de documents conformes aux obligations légales.",
      },
    ],
  },
  {
    slug: 'migrer-vers-mon-syndic-benevole',
    title: 'Migrer vers Mon Syndic Bénévole : guide complet en 7 étapes',
    description:
      'Comment migrer vers Mon Syndic Bénévole depuis Excel ou un syndic professionnel : lots, tantièmes, soldes de départ, fonds de travaux, premier appel de fonds — opérationnel en une demi-journée.',
    // 196 chars
    publishedAt: '2026-03-28',
    readingTime: 10,
    category: 'Guide pratique – Migration & Prise en main',
    keywords: [
      'migrer logiciel syndic bénévole',
      'reprendre gestion copropriété',
      'passer syndic professionnel bénévole logiciel',
      'migration données copropriété',
      'démarrer syndic bénévole logiciel',
      'importer copropriété logiciel gestion',
    ],
    toc: [
      { id: 'avant-de-commencer', text: 'Ce que vous devez rassembler avant de commencer' },
      { id: 'etape-1', text: 'Étape 1 — Créer la copropriété' },
      { id: 'etape-2', text: 'Étape 2 — Saisir les lots et les tantièmes' },
      { id: 'etape-3', text: 'Étape 3 — Inviter les copropriétaires' },
      { id: 'etape-4', text: 'Étape 4 — Reprendre le solde comptable de départ' },
      { id: 'etape-5', text: 'Étape 5 — Créer le premier appel de fonds' },
      { id: 'etape-6', text: 'Étape 6 — Importer les documents clés' },
      { id: 'etape-7', text: 'Étape 7 — Vérification avant le premier envoi' },
      { id: 'ce-que-vous-gagnez', text: 'Ce que vous gagnez concrètement le premier mois' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'en-resume', text: 'En résumé' },
    ],
    faqs: [
      {
        q: 'Combien de temps faut-il pour migrer depuis un syndic professionnel ?',
        a: "Pour une copropriété de 10 à 20 lots, comptez environ 2 heures si vous avez tous vos documents en main. La majorité du temps est consacrée à la saisie des tantièmes et des données copropriétaires.",
      },
      {
        q: "Faut-il ressaisir tout l'historique comptable des années précédentes ?",
        a: "Non. Seul le solde de départ à la date de migration est nécessaire. L'historique des exercices précédents peut rester dans vos archives — il n'impacte pas la gestion courante sur Mon Syndic Bénévole.",
      },
      {
        q: "Peut-on migrer en cours d'année, sans attendre le 1er janvier ?",
        a: "Oui. La migration est indépendante du calendrier de l'exercice. Si vous démarrez en cours de trimestre, renseignez le solde à la date exacte de migration. L'exercice en cours se poursuit normalement depuis cette date.",
      },
      {
        q: "Les données sont-elles sécurisées lors de la migration ?",
        a: "Mon Syndic Bénévole est hébergé sur infrastructure européenne conforme au RGPD, avec chiffrement en transit et au repos. Des sauvegardes automatiques quotidiennes protègent contre toute perte accidentelle.",
      },
      {
        q: "Que se passe-t-il si je souhaite arrêter Mon Syndic Bénévole plus tard ?",
        a: "Vos données restent accessibles tant que votre compte est actif. Les PDF générés (avis d'appel de fonds, convocations, PV) sont téléchargeables depuis chaque section et peuvent être archivés avant de quitter. Aucun engagement de durée minimum au-delà de chaque mois souscrit.",
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatPublishedAt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
