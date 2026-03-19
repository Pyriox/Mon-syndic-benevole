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
}

export const posts: BlogPost[] = [
  {
    slug: 'gerer-copropriete-sans-syndic-professionnel',
    title: 'Gérer une copropriété sans syndic professionnel : est-ce vraiment possible ?',
    description:
      'Syndic bénévole, auto-gestion, copropriétaires qui se regroupent… Gérer sa copropriété sans passer par un cabinet professionnel est légal, courant et souvent bien plus économique. On vous explique comment.',
    publishedAt: '2026-03-19',
    readingTime: 8,
    category: 'Guide pratique',
    keywords: [
      'syndic bénévole',
      'gestion copropriété sans syndic professionnel',
      'syndic non professionnel',
      'auto-gestion copropriété',
      'copropriété bénévole',
      'obligations syndic bénévole',
    ],
  },
  {
    slug: 'appel-de-fonds-copropriete-calcul-repartition',
    title: 'Appel de fonds copropriété : comment le calculer et le répartir ?',
    description:
      "Budget prévisionnel, tantèmes, charges générales ou spéciales… L’appel de fonds est au cœur de la gestion d’une copropriété. Voici comment le calculer, le répartir équitablement, et éviter les erreurs classiques.",
    publishedAt: '2026-03-19',
    readingTime: 9,
    category: 'Guide pratique – Finances',
    keywords: [
      'appel de fonds copropriété',
      'calcul appel de fonds',
      'répartition charges copropriété',
      'tantièmes millièmes copropriété',
      'budget prévisionnel copropriété',
      'impayés charges copropriété',
    ],
  },
  {
    slug: 'fonds-de-travaux-alur-obligations-montant-gestion',
    title: 'Fonds de travaux ALUR : obligations, montant et gestion pratique',
    description:
      "Le fonds de travaux ALUR est obligatoire depuis 2017 pour les copropriétés de 10 lots et plus. Montant minimum, règles de vote, utilisation des sommes… voici tout ce qu’un syndic bénévole doit savoir.",
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
