import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import SiteLogo from '@/components/ui/SiteLogo';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';
import LandingNav from '@/app/LandingNav';
import { posts, formatPublishedAt } from '@/lib/blog';
import PublicFooter from '@/components/layout/PublicFooter';

export const dynamic = 'force-static';
export const revalidate = 86400;

const sortedPosts = [...posts].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt)
);

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Conseils syndic bénévole et gestion de copropriété',
  description:
    'Guides pratiques sur la copropriété : appels de fonds, AG, fonds de travaux ALUR, obligations du syndic bénévole et gestion sans syndic professionnel.',
  url: 'https://www.mon-syndic-benevole.fr/blog',
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: sortedPosts.length,
    itemListElement: sortedPosts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://www.mon-syndic-benevole.fr/blog/${post.slug}`,
      name: post.title,
    })),
  },
};

export const metadata: Metadata = {
  title: 'Conseils syndic bénévole et gestion de copropriété | Blog',
  description:
    'Guides pratiques sur la copropriété : appels de fonds, AG, fonds de travaux ALUR, obligations du syndic bénévole et gestion sans syndic professionnel.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Conseils syndic bénévole et gestion de copropriété | Blog',
    description:
      'Guides pratiques sur la copropriété : appels de fonds, AG, fonds de travaux ALUR, obligations du syndic bénévole et gestion sans syndic professionnel.',
    url: 'https://www.mon-syndic-benevole.fr/blog',
    siteName: 'Mon Syndic Bénévole',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://www.mon-syndic-benevole.fr/blog' },
};

export default function BlogPage() {
  const [featuredPost, ...restPosts] = sortedPosts;
  return (
    <>
      <Script
        id="blog-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <div className="min-h-screen bg-white text-gray-900">
        <LandingNav />
        {/* Spacer pour compenser le fixed positioning de LandingNav */}
        <div className="h-16" aria-hidden="true" />

        {/* Hero — dark gradient, same as articles */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
          <div className="max-w-5xl mx-auto px-6 pt-12 pb-12">
            {/* Breadcrumb */}
            <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-blue-200 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <span className="text-blue-400/60" aria-hidden="true">/</span>
              <span className="text-blue-100/80">Blog</span>
            </nav>

            {/* Label */}
            <span className="inline-block text-xs font-medium text-blue-200 bg-white/10 border border-white/20 rounded-full px-3 py-0.5 mb-6">
              Guides pratiques · {posts.length} articles
            </span>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-5 max-w-2xl">
              Tout ce que doit savoir un syndic bénévole
            </h1>

            {/* Description */}
            <p className="text-blue-200 text-base sm:text-lg max-w-2xl leading-relaxed border-t border-white/20 pt-6">
              Obligations légales, appels de fonds, fonds de travaux, choix du bon outil&nbsp;— des guides concrets pour gérer votre copropriété sans cabinet professionnel.
            </p>
          </div>
        </div>

        {/* Article listing */}
        <main className="max-w-5xl mx-auto px-6 py-12 pb-20">

          {/* Featured article (latest) */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Dernier article
          </p>
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group flex flex-col sm:flex-row bg-white border-2 border-blue-100 rounded-2xl overflow-hidden shadow-sm hover:border-blue-300 hover:shadow-md transition-all mb-12"
          >
            {/* Left accent bar */}
            <div className="h-1.5 sm:h-auto sm:w-1.5 bg-gradient-to-r sm:bg-gradient-to-b from-blue-500 to-indigo-600 shrink-0" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 sm:p-8 w-full">
              <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-0.5">
                    {featuredPost.category}
                  </span>
                  <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
                    Nouveau
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors">
                  {featuredPost.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                  {featuredPost.description}
                </p>
              </div>

              {/* Meta + CTA */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4 shrink-0 w-full sm:w-auto">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <time dateTime={featuredPost.publishedAt}>{formatPublishedAt(featuredPost.publishedAt)}</time>
                  <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
                  <span>{featuredPost.readingTime} min</span>
                </div>
                <span className="text-sm font-semibold text-white bg-blue-600 group-hover:bg-blue-700 transition-colors rounded-xl px-5 py-2.5 shrink-0 whitespace-nowrap">
                  Lire l&apos;article →
                </span>
              </div>
            </div>
          </Link>

          {/* Remaining articles */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Tous les articles
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
              >
                {/* Category */}
                <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-0.5 mb-4 self-start">
                  {post.category}
                </span>

                {/* Title */}
                <h2 className="text-base font-bold text-gray-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors flex-1">
                  {post.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3">
                  {post.description}
                </p>

                {/* Meta + CTA */}
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <time dateTime={post.publishedAt}>{formatPublishedAt(post.publishedAt)}</time>
                    <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
                    <span>{post.readingTime} min</span>
                  </div>
                  <span className="text-blue-600 group-hover:text-blue-700 font-semibold transition-colors">
                    Lire →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </main>

        <ScrollToTopButton />

        <PublicFooter compact />
      </div>
    </>
  );
}
