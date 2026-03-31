import type { MetadataRoute } from 'next';
import { posts } from '@/lib/blog';

const APP_URL = 'https://mon-syndic-benevole.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${APP_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: 'monthly',
    priority: post.slug === 'logiciel-syndic-benevole' || post.slug === 'migrer-vers-mon-syndic-benevole' ? 0.8 : 0.7,
  }));

  return [
    {
      url: APP_URL,
      lastModified: new Date('2026-03-22'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: new Date('2026-03-22'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogEntries,
    {
      url: `${APP_URL}/mentions-legales`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/cgu`,
      lastModified: new Date('2026-03-24'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/politique-confidentialite`,
      lastModified: new Date('2026-03-24'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
