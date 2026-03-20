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
}

export const posts: BlogPost[] = [
  {
    slug: 'gerer-copropriete-sans-syndic-professionnel',
    title: 'Gérer une copropriété sans syndic professionnel : est-ce vraiment possible ?',
    description:
      'Gérer une copropriété sans syndic professionnel : responsabilités légales, avantages et étapes pratiques. Le guide complet du syndic bénévole.',
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
      { id: 'ce-que-dit-la-loi', text: 'Ce que dit la loi (et ce qu\'elle ne dit pas)' },
      { id: 'qui-choisit', text: 'Qui choisit vraiment le syndic bénévole ?' },
      { id: 'responsabilites', text: 'Les vraies responsabilités du syndic bénévole' },
      { id: 'pourquoi-se-perdent', text: 'Pourquoi autant de syndics bénévoles se perdent en cours de route' },
      { id: 'avantages', text: 'Les avantages concrets d\'une gestion sans cabinet' },
      { id: 'quand-professionnel', text: 'Les situations où un professionnel reste plus adapté' },
      { id: 'comment-passer', text: 'Comment passer d\'un syndic professionnel à un syndic bénévole' },
      { id: 'le-temps', text: 'Ce que les copropriétaires sous-estiment souvent : le temps' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'en-resume', text: 'En résumé' },
    ],
  },
  {
    slug: 'appel-de-fonds-copropriete-calcul-repartition',
    title: 'Appel de fonds copropriété : comment le calculer et le répartir ?',
    description:
      "Appel de fonds copropriété : calcul selon les tantièmes, répartition charges générales et spéciales, régularisation annuelle et gestion des impayés. Guide pratique syndic bénévole.",
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
      { id: 'appel-exceptionnel', text: 'L\'appel de fonds exceptionnel : même logique, calendrier différent' },
      { id: 'impayes', text: 'Ce qui se passe quand un copropriétaire ne paie pas' },
      { id: 'regularisation', text: 'La régularisation annuelle : l\'étape que tout le monde redoute' },
      { id: 'suivi-manuel', text: 'Le principal problème des syndics bénévoles : le suivi manuel' },
      { id: 'fonds-travaux-alur', text: 'Appel de fonds et fonds de travaux ALUR : ne pas confondre' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'ce-quil-faut-retenir', text: 'Ce qu\'il faut retenir' },
    ],
  },
  {
    slug: 'fonds-de-travaux-alur-obligations-montant-gestion',
    title: 'Fonds de travaux ALUR : obligations, montant et gestion pratique',
    description:
      "Fonds de travaux ALUR obligatoire depuis 2017 : montant minimum 5 %, vote en AG, compte séparé, utilisation et cession de lot. Guide complet pour syndic bénévole.",
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
      { id: 'vote-ag', text: 'Le vote en AG : quelle majorité ?' },
      { id: 'compte-separe', text: 'Un compte bancaire séparé : l\'obligation méconnue' },
      { id: 'utilisation', text: 'À quoi peuvent servir ces fonds ?' },
      { id: 'vente-lot', text: 'Ce qui se passe lors de la vente d\'un lot' },
      { id: 'risques', text: 'Les risques en cas de non-respect' },
      { id: 'dtg', text: 'Fonds de travaux et diagnostic technique global (DTG)' },
      { id: 'pratique-erreurs', text: 'Gérer le fonds de travaux en pratique : éviter les erreurs courantes' },
      { id: 'notre-outil', text: 'Ce que Mon Syndic Bénévole fait pour vous' },
      { id: 'questions-frequentes', text: 'Questions fréquentes' },
      { id: 'ce-quil-faut-retenir', text: 'Ce qu\'il faut retenir' },
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
