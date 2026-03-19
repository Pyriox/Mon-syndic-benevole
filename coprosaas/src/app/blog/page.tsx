import type { Metadata } from 'next';
import Link from 'next/link';
import SiteLogo from '@/components/ui/SiteLogo';
import { posts, formatPublishedAt } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog — Conseils pour votre copropriété | Mon Syndic Bénévole',
  description:
    'Guides pratiques, obligations légales et conseils financiers pour les syndics bénévoles. Gérez votre copropriété sereinement.',
  openGraph: {
    title: 'Blog — Mon Syndic Bénévole',
    description:
      'Guides pratiques et conseils pour gérer votre copropriété en tant que syndic bénévole.',
    url: 'https://mon-syndic-benevole.fr/blog',
    siteName: 'Mon Syndic Bénévole',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://mon-syndic-benevole.fr/blog' },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      {/* Header */}
      <header className="border-b border-slate-800 py-4 px-6 sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <SiteLogo size={32} />
            <span className="font-bold text-white text-sm">Mon Syndic Bénévole</span>
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-colors"
          >
            Essai gratuit
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        <p className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-3">Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          Tout ce que doit savoir un syndic bénévole
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-2xl">
          Guides pratiques, règles légales et conseils financiers pour gérer votre copropriété sans
          cabinet professionnel.
        </p>
      </section>

      {/* Article grid */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-800/60 transition-all"
            >
              {/* Category */}
              <span className="inline-block text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-0.5 mb-4 self-start">
                {post.category}
              </span>

              {/* Title */}
              <h2 className="text-base font-bold text-white leading-snug mb-3 group-hover:text-blue-100 transition-colors">
                {post.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-400 leading-relaxed flex-1 mb-5">
                {post.description}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-slate-800 pt-4">
                <span>{formatPublishedAt(post.publishedAt)}</span>
                <span>{post.readingTime} min de lecture</span>
              </div>

              {/* CTA */}
              <div className="mt-4 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                Lire l&apos;article →
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Mon Syndic Bénévole</span>
          <nav className="flex items-center gap-5" aria-label="Liens du pied de page">
            <Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">
              Mentions légales
            </Link>
            <Link href="/login" className="hover:text-gray-300 transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-gray-300 transition-colors">
              Inscription
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
