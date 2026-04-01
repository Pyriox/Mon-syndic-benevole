import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import SiteLogo from '@/components/ui/SiteLogo';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';
import ArticleViewTracker from '@/components/ui/ArticleViewTracker';
import LandingNav from '@/app/LandingNav';
import { getPost, formatPublishedAt, posts } from '@/lib/blog';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';

export const dynamic = 'force-static';
export const revalidate = 86400;

// ── Content components ───────────────────────────────────────────────────────────
import ArticleGerer from '../_content/gerer-copropriete-sans-syndic-professionnel';
import ArticleAppel from '../_content/appel-de-fonds-copropriete-calcul-repartition';
import ArticleFonds from '../_content/fonds-de-travaux-alur-obligations-montant-gestion';
import ArticleCommentDevenir from '../_content/comment-devenir-syndic-benevole';
import ArticleObligations from '../_content/obligations-syndic-benevole';
import ArticleLogiciel from '../_content/logiciel-syndic-benevole';
import ArticleMigrer from '../_content/migrer-vers-mon-syndic-benevole';

const contentMap: Record<string, ComponentType> = {
  'gerer-copropriete-sans-syndic-professionnel': ArticleGerer,
  'appel-de-fonds-copropriete-calcul-repartition': ArticleAppel,
  'fonds-de-travaux-alur-obligations-montant-gestion': ArticleFonds,
  'comment-devenir-syndic-benevole': ArticleCommentDevenir,
  'obligations-syndic-benevole': ArticleObligations,
  'logiciel-syndic-benevole': ArticleLogiciel,
  'migrer-vers-mon-syndic-benevole': ArticleMigrer,
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
    robots: { index: true, follow: true },
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
      ...(post.faqs && post.faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${APP_URL}/blog/${post.slug}#faq`,
              mainEntity: post.faqs.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <Script
        id="article-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <ArticleViewTracker slug={slug} title={post.title} />
      <div className="min-h-screen bg-white text-gray-900">

      {/* ── Header ── */}
      <LandingNav />
      {/* Spacer pour compenser le fixed positioning de LandingNav */}
      <div className="h-16" aria-hidden="true" />

      {/* ── Article hero ── */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
        <div className="max-w-3xl mx-auto px-6 pt-12 pb-10">
          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-blue-200 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <span className="text-blue-400/60" aria-hidden="true">/</span>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span className="text-blue-400/60" aria-hidden="true">/</span>
            <span className="text-blue-100/80 truncate max-w-[200px]">{post.title}</span>
          </nav>
          {/* Category */}
          <span className="inline-block text-xs font-medium text-blue-200 bg-white/10 border border-white/20 rounded-full px-3 py-0.5 mb-6">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-blue-200 border-t border-white/20 pt-6">
            <span>
              <time dateTime={post.publishedAt}>{formatPublishedAt(post.publishedAt)}</time>
            </span>
            <span className="w-1 h-1 rounded-full bg-blue-300/60" aria-hidden="true" />
            <span>{post.readingTime} min de lecture</span>
          </div>
        </div>
      </div>

      {/* ── Table des matières ── */}
      {post.toc.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 mt-8 mb-2">
          <nav aria-label="Table des matières" className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-5">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Table des matières</p>
            <ol className="space-y-1.5">
              {post.toc.map((entry, i) => (
                <li key={entry.id} className="flex items-baseline gap-2.5 text-sm">
                  <span className="text-blue-300 font-mono text-xs shrink-0">{i + 1}.</span>
                  <a href={`#${entry.id}`} className="text-blue-700 hover:text-blue-900 hover:underline underline-offset-2 transition-colors leading-snug">
                    {entry.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}

      {/* ── Article body ── */}
      <main className="max-w-3xl mx-auto px-6 pb-16">
        <ContentComponent />
      </main>

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
      <footer className="bg-slate-950 py-10 px-4 sm:px-6" aria-label="Pied de page">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SiteLogo size={32} />
            <span className="font-bold text-white text-sm">Mon Syndic Bénévole</span>
          </div>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Mon Syndic Bénévole — Tous droits réservés</p>
          <nav aria-label="Liens du pied de page">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-400">
              <Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">Mentions légales</Link>
              <Link href="/cgu" className="hover:text-gray-300 transition-colors">CGU / CGV</Link>
              <Link href="/blog" className="hover:text-gray-300 transition-colors">Blog</Link>
              <Link href="/login" className="hover:text-gray-300 transition-colors">Connexion</Link>
              <Link href="/register" className="hover:text-gray-300 transition-colors">Inscription</Link>
              <a href="mailto:contact@mon-syndic-benevole.fr" className="hover:text-gray-300 transition-colors">contact@mon-syndic-benevole.fr</a>
              <CookiePreferencesButton />
            </div>
          </nav>
        </div>
      </footer>
    </div>
    </>
  );
}
