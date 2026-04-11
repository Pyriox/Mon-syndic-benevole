import Link from 'next/link';
import SiteLogo from '@/components/ui/SiteLogo';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';

interface PublicFooterProps {
  compact?: boolean;
}

export default function PublicFooter({ compact = false }: PublicFooterProps) {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-5 sm:py-8 px-4 sm:px-6" aria-label="Pied de page">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-7">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <SiteLogo size={28} />
            <div className="min-w-0">
              <p className="font-bold text-white text-sm">Mon Syndic Bénévole</p>
              {!compact && (
                <p className="hidden sm:block text-xs text-gray-500 mt-0.5">
                  Gestion de copropriété simple, claire et abordable.
                </p>
              )}
            </div>
          </div>
          <p className="shrink-0 text-[11px] sm:text-sm text-gray-500">
            © {new Date().getFullYear()}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Liens utiles" className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] sm:text-sm text-gray-400">
            <Link href="/mentions-legales" className="hover:text-gray-200 transition-colors">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-gray-200 transition-colors">Confidentialité</Link>
            <Link href="/cgu" className="hover:text-gray-200 transition-colors">CGU / CGV</Link>
            <Link href="/blog" className="hover:text-gray-200 transition-colors">Blog</Link>
            <a href="mailto:contact@mon-syndic-benevole.fr" className="hover:text-gray-200 transition-colors">
              <span className="sm:hidden">Contact</span>
              <span className="hidden sm:inline">contact@mon-syndic-benevole.fr</span>
            </a>
          </nav>
          <CookiePreferencesButton className="text-[11px] sm:text-sm text-gray-400 hover:text-gray-200 text-left" />
        </div>
      </div>
    </footer>
  );
}