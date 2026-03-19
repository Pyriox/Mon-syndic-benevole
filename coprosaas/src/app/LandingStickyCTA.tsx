'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingStickyCTA() {
  const [show, setShow] = useState(false);
  const [hiddenByCTA, setHiddenByCTA] = useState(false);

  // Show after 400px of scroll
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hide when the final CTA section enters the viewport
  useEffect(() => {
    const target = document.querySelector('[data-cta-final]');
    if (!target) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHiddenByCTA(entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, []);

  if (!show || hiddenByCTA) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-tight">30 jours gratuits</p>
        <p className="text-xs text-gray-500 truncate">Sans engagement · À partir de 20 €/mois</p>
      </div>
      <Link
        href="/register"
        className="shrink-0 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
      >
        Démarrer <ArrowRight size={14} />
      </Link>
    </div>
  );
}
