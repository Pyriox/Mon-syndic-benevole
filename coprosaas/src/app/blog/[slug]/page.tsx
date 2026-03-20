import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import SiteLogo from '@/components/ui/SiteLogo';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';
import { getPost, formatPublishedAt, posts } from '@/lib/blog';

// ── Content components ───────────────────────────────────────────────────────────
import ArticleGerer from '../_content/gerer-copropriete-sans-syndic-professionnel';
import ArticleAppel from '../_content/appel-de-fonds-copropriete-calcul-repartition';
import ArticleFonds from '../_content/fonds-de-travaux-alur-obligations-montant-gestion';

const contentMap: Record<string, ComponentType> = {
  'gerer-copropriete-sans-syndic-professionnel': ArticleGerer,
  'appel-de-fonds-copropriete-calcul-repartition': ArticleAppel,
  'fonds-de-travaux-alur-obligations-montant-gestion': ArticleFonds,
};

// ── Static params ────────────────────────────────────────────────────────────
export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Mon Syndic Bénévole`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://mon-syndic-benevole.fr/blog/${post.slug}`,
      siteName: 'Mon Syndic Bénévole',
      locale: 'fr_FR',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
    },
    alternates: { canonical: `https://mon-syndic-benevole.fr/blog/${post.slug}` },
  };
}

// ── Page component ────────────────────────────────────────────────────────────
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const ContentComponent = contentMap[slug];
  if (!ContentComponent) notFound();

  // Related articles (others)
  const related = posts.filter((p) => p.slug !== slug).slice(0, 2);

  const APP_URL = 'https://mon-syndic-benevole.fr';
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${APP_URL}/blog/${post.slug}#article`,
        headline: post.title,
        description: post.description,
        url: `${APP_URL}/blog/${post.slug}`,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        inLanguage: 'fr-FR',
        keywords: post.keywords.join(', '),
        author: { '@type': 'Organization', name: 'Mon Syndic Bénévole', url: APP_URL },
        publisher: {
          '@type': 'Organization',
          name: 'Mon Syndic Bénévole',
          url: APP_URL,
          logo: { '@type': 'ImageObject', url: `${APP_URL}/logo.png` },
        },
        isPartOf: { '@type': 'Blog', name: 'Blog Mon Syndic Bénévole', url: `${APP_URL}/blog` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${APP_URL}/blog/${post.slug}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: APP_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${APP_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: `${APP_URL}/blog/${post.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="article-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="min-h-screen bg-white text-gray-900">

      {/* ── Header ── */}
      <header className="border-b border-gray-200 py-4 px-6 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <SiteLogo size={32} />
            <span className="font-bold text-gray-900 text-sm hidden sm:block">Mon Syndic Bénévole</span>
          </Link>
          <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            Blog
          </Link>
        </div>
      </header>

      {/* ── Article hero ── */}
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-4">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700 transition-colors">Accueil</Link>
          <span className="text-gray-300" aria-hidden="true">/</span>
          <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
          <span className="text-gray-300" aria-hidden="true">/</span>
          <span className="text-gray-500 truncate max-w-[200px]">{post.title}</span>
        </nav>
        {/* Category */}
        <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-0.5 mb-6">
          {post.category}
        </span>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-b border-gray-200 pb-8 mb-4">
          <span>
            <time dateTime={post.publishedAt}>{formatPublishedAt(post.publishedAt)}</time>
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
          <span>{post.readingTime} min de lecture</span>
        </div>
      </div>

      {/* ── Article body ── */}
      <main className="max-w-3xl mx-auto px-6 pb-16">
        <ContentComponent />
      </main>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-6 mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 p-8 text-center shadow-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Gérez votre copropriété sans vous noyer dans les tableurs
          </h2>
          <p className="text-blue-100 mb-6 text-sm sm:text-base max-w-xl mx-auto">
            Mon Syndic Bénévole automatise les appels de fonds, les relances et la comptabilité de votre copropriété. 100&nbsp;% conçu pour les syndics non-professionnels.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm sm:text-base"
          >
            Essayer gratuitement →
          </Link>
        </div>
      </section>

      {/* ── Related articles ── */}
      {related.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 mb-20">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Articles liés</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
              >
                <span className="text-xs text-blue-600 font-medium">{rel.category}</span>
                <h3 className="text-sm font-semibold text-gray-900 mt-2 mb-2 group-hover:text-blue-700 transition-colors leading-snug">
                  {rel.title}
                </h3>
                <span className="text-xs text-blue-600 group-hover:text-blue-700 font-medium transition-colors">
                  Lire →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ScrollToTopButton />

      {/* ── Footer ── */}
      <footer className="bg-gray-50 border-t border-gray-200 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Mon Syndic Bénévole</span>
          <nav className="flex items-center gap-5" aria-label="Liens du pied de page">
            <Link href="/mentions-legales" className="hover:text-gray-700 transition-colors">
              Mentions légales
            </Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">
              Blog
            </Link>
            <Link href="/login" className="hover:text-gray-700 transition-colors">
              Connexion
            </Link>
          </nav>
        </div>
      </footer>
    </div>
    </>
  );
}
