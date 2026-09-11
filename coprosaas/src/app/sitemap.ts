import type { MetadataRoute } from 'next';
import { posts } from '@/lib/blog';

const APP_URL = 'https://www.mon-syndic-benevole.fr';

export default function sitemap(): MetadataRoute.Sitemap {
  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${APP_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
  }));

  // /blog lists every post, so its lastmod tracks the most recently touched post.
  const blogIndexLastModified = posts.reduce(
    (latest, post) => {
      const postDate = new Date(post.updatedAt ?? post.publishedAt);
      return postDate > latest ? postDate : latest;
    },
    new Date('2026-04-15')
  );

  return [
    {
      url: APP_URL,
      lastModified: new Date('2026-04-15'),
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: blogIndexLastModified,
    },
    ...blogEntries,
  ];
}
