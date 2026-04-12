'use client';

import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteLogo from '@/components/ui/SiteLogo';
import CtaLink from '@/components/ui/CtaLink';
import { createClient } from '@/lib/supabase/client';
import { LayoutGrid, Loader2, Menu, X } from 'lucide-react';

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
    const supabase = createClient();
    let active = true;

    void router.prefetch('/login');
    void router.prefetch('/dashboard');
    void router.prefetch('/register');

    supabase.auth.getSession().then((result) => {
      if (!active) return;
      const isAuthenticated = !!result.data.session;
      setAccountHref(isAuthenticated ? '/dashboard' : '/login');
      setAccountLabel(isAuthenticated ? 'Mon espace' : 'Connexion');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const isAuthenticated = !!session;
      setAccountHref(isAuthenticated ? '/dashboard' : '/login');
      setAccountLabel(isAuthenticated ? 'Mon espace' : 'Connexion');
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const handleAccountNavigation = () => {
    setNavPending(true);
    setOpen(false);
    router.push(accountHref);
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
            {navPending ? <Loader2 size={14} className="animate-spin" /> : <LayoutGrid size={14} aria-hidden="true" />}
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
            {open ? <X size={20} /> : <Menu size={20} />}
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
            {navPending ? <Loader2 size={14} className="animate-spin" /> : <LayoutGrid size={14} aria-hidden="true" />}
            {navPending ? 'Ouverture...' : accountLabel}
          </button>
        </div>
      )}
    </nav>
  );
}
