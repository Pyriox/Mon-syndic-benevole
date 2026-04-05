import Link from 'next/link';
import SiteLogo from '@/components/ui/SiteLogo';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';

interface PublicFooterProps {
  compact?: boolean;
}

export default function PublicFooter({ compact = false }: PublicFooterProps) {
  return (
    <footer className="bg-slate-950 border-t border-white/5 py-8 px-4 sm:px-6" aria-label="Pied de page">
      <div className="max-w-5xl mx-auto flex flex-col gap-6 sm:gap-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2.5">
            <SiteLogo size={32} />
            <div>
              <p className="font-bold text-white text-sm">Mon Syndic Bénévole</p>
              {!compact && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Gestion de copropriété simple, claire et abordable.
                </p>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} Mon Syndic Bénévole
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Liens utiles" className="flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-400">
            <Link href="/mentions-legales" className="hover:text-gray-200 transition-colors">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="hover:text-gray-200 transition-colors">Confidentialité</Link>
            <Link href="/cgu" className="hover:text-gray-200 transition-colors">CGU / CGV</Link>
            <Link href="/blog" className="hover:text-gray-200 transition-colors">Blog</Link>
            <a href="mailto:contact@mon-syndic-benevole.fr" className="hover:text-gray-200 transition-colors">contact@mon-syndic-benevole.fr</a>
          </nav>
          <CookiePreferencesButton className="text-xs sm:text-sm text-gray-400 hover:text-gray-200" />
        </div>
      </div>
    </footer>
  );
}