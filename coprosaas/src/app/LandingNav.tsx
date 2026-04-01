'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteLogo from '@/components/ui/SiteLogo';
import CtaLink from '@/components/ui/CtaLink';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/#fonctionnalites', label: 'Fonctionnalités' },
  { href: '/#tarif', label: 'Tarifs' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

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
          <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
            Connexion
          </Link>
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
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="text-sm text-white/70 hover:text-white py-2.5 transition-colors"
          >
            Connexion
          </Link>
        </div>
      )}
    </nav>
  );
}
