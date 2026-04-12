'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteLogo from '@/components/ui/SiteLogo';
import CtaLink from '@/components/ui/CtaLink';

function DashboardIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function hasLikelyAuthCookie() {
  if (typeof document === 'undefined') return false;

  return document.cookie
    .split('; ')
    .some((cookie) => cookie.startsWith('sb-') && cookie.includes('auth-token='));
}

const navLinks = [
  { href: '/#fonctionnalites', label: 'Fonctionnalités' },
  { href: '/#tarif', label: 'Tarifs' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
];

export default function LandingNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountHref, setAccountHref] = useState('/login');
  const [accountLabel, setAccountLabel] = useState('Connexion');
  const [navPending, setNavPending] = useState(false);

  useEffect(() => {
    const prefetch = () => {
      void router.prefetch('/login');
      void router.prefetch('/dashboard');
      void router.prefetch('/register');
    };

    const updateAccountState = () => {
      const isAuthenticated = hasLikelyAuthCookie();
      setAccountHref(isAuthenticated ? '/dashboard' : '/login');
      setAccountLabel(isAuthenticated ? 'Mon espace' : 'Connexion');
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(prefetch, { timeout: 1200 })
      : window.setTimeout(prefetch, 300);

    updateAccountState();
    window.addEventListener('focus', updateAccountState);
    document.addEventListener('visibilitychange', updateAccountState);

    return () => {
      if (typeof idle === 'number') {
        window.clearTimeout(idle);
      } else if (window.cancelIdleCallback) {
        window.cancelIdleCallback(idle);
      }
      window.removeEventListener('focus', updateAccountState);
      document.removeEventListener('visibilitychange', updateAccountState);
    };
  }, [router]);

  const handleAccountNavigation = () => {
    setNavPending(true);
    setOpen(false);
    router.push(accountHref);
    // Filet de sécurité si la navigation est interrompue.
    window.setTimeout(() => setNavPending(false), 3000);
  };

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <SiteLogo size={28} />
          <span className="font-bold text-white text-sm hidden sm:block">Mon Syndic Bénévole</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={handleAccountNavigation}
            disabled={navPending}
            aria-busy={navPending}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/35 transition-colors disabled:opacity-70"
          >
            {navPending ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <DashboardIcon />}
            {navPending ? 'Ouverture...' : accountLabel}
          </button>
          <CtaLink
            href="/register"
            ctaLocation="nav_header"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Essai gratuit
          </CtaLink>
        </div>

        {/* Mobile right-side buttons */}
        <div className="flex items-center gap-2 md:hidden">
          <CtaLink
            href="/register"
            ctaLocation="nav_header_mobile"
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors"
          >
            Essai gratuit
          </CtaLink>
          <button
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-slate-900/98 px-6 py-4 flex flex-col gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="text-sm text-white/70 hover:text-white py-2.5 border-b border-white/5 last:border-0 transition-colors"
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleAccountNavigation}
            disabled={navPending}
            aria-busy={navPending}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/35 transition-colors disabled:opacity-70"
          >
            {navPending ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <DashboardIcon />}
            {navPending ? 'Ouverture...' : accountLabel}
          </button>
        </div>
      )}
    </nav>
  );
}
