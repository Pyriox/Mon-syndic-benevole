import type { MetadataRoute } from 'next';

const APP_URL = 'https://www.mon-syndic-benevole.fr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/dashboard',
          '/coproprietes',
          '/depenses',
          '/appels-de-fonds',
          '/documents',
          '/assemblees',
          '/incidents',
          '/lots',
          '/coproprietaires',
          '/profil',
          '/abonnement',
          '/admin',
          '/api/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
