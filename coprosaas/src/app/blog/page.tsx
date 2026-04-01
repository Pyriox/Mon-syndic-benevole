import type { Metadata } from 'next';
import Link from 'next/link';
import SiteLogo from '@/components/ui/SiteLogo';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';
import LandingNav from '@/app/LandingNav';
import { posts, formatPublishedAt } from '@/lib/blog';
import PublicFooter from '@/components/layout/PublicFooter';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Blog syndic bénévole — Guides pratiques et logiciel de gestion | Mon Syndic Bénévole',
  description:
    'Guides pratiques pour syndic bénévole : obligations légales, appels de fonds, fonds de travaux ALUR, logiciel de gestion copropriété. Tout ce que vous devez savoir pour gérer sans cabinet professionnel.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Blog syndic bénévole — Mon Syndic Bénévole',
    description:
      'Guides pratiques et conseils pour gérer votre copropriété en tant que syndic bénévole. Logiciel de gestion à partir de 25 €/mois.',
    url: 'https://mon-syndic-benevole.fr/blog',
    siteName: 'Mon Syndic Bénévole',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://mon-syndic-benevole.fr/blog' },
};

export default function BlogPage() {
  return (
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

      {/* Article grid */}
      <main className="max-w-5xl mx-auto px-6 py-12 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
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
  );
}
