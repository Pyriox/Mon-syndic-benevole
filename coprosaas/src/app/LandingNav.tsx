'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteLogo from '@/components/ui/SiteLogo';
import CtaLink from '@/components/ui/CtaLink';

// Chargé après hydratation : évite d'embarquer @supabase/ssr dans le JS critique de la home.
const AccountNavButton = dynamic(() => import('./AccountNavButton'), { ssr: false });

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

const navLinks = [
  { href: '/#fonctionnalites', label: 'Fonctionnalités' },
  { href: '/#tarif', label: 'Tarifs' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
];

export default function LandingNav() {
  const router = useRouter();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const prefetch = () => {
      void router.prefetch('/login');
      void router.prefetch('/dashboard');
      void router.prefetch('/register');
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(prefetch, { timeout: 1200 })
      : window.setTimeout(prefetch, 300);

    return () => {
      if (typeof idle === 'number') {
        window.clearTimeout(idle);
      } else if (window.cancelIdleCallback) {
        window.cancelIdleCallback(idle);
      }
    };
  }, [router]);

  useEffect(() => {
    if (!open) return;

    const menu = mobileMenuRef.current;
    if (!menu) return;

    const focusableSelector = 'a[href], button:not([disabled])';
    const firstFocusable = menu.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    const handleMenuKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(menu.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    menu.addEventListener('keydown', handleMenuKeyDown);
    return () => menu.removeEventListener('keydown', handleMenuKeyDown);
  }, [open]);

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
          <AccountNavButton className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/35 transition-colors disabled:opacity-70" />
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
            ref={menuButtonRef}
            type="button"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="mobile-navigation-menu"
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          ref={mobileMenuRef}
          id="mobile-navigation-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation mobile"
          className="md:hidden border-t border-white/10 bg-slate-900/98 px-6 py-4 flex flex-col gap-1"
        >
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
          <AccountNavButton
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/35 transition-colors disabled:opacity-70"
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </nav>
  );
}
