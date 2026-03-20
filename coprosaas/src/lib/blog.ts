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
