import type { MetadataRoute } from 'next';

const APP_URL = 'https://mon-syndic-benevole.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/blog/gerer-copropriete-sans-syndic-professionnel`,
      lastModified: new Date('2025-11-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/blog/appel-de-fonds-copropriete-calcul-repartition`,
      lastModified: new Date('2025-12-10'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/blog/fonds-de-travaux-alur-obligations-montant-gestion`,
      lastModified: new Date('2026-01-20'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/mentions-legales`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
