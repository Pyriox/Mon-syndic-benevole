'use client';

import { useEffect, useState } from 'react';
import CtaLink from '@/components/ui/CtaLink';
import { ArrowRight } from 'lucide-react';

export default function LandingStickyCTA() {
  const [show, setShow] = useState(false);
  const [hiddenByCTA, setHiddenByCTA] = useState(false);
  const [cookieBannerVisible, setCookieBannerVisible] = useState(false);

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

  useEffect(() => {
    const handleVisibility = (event: Event) => {
      const nextVisible = (event as CustomEvent<{ visible?: boolean }>).detail?.visible === true;
      setCookieBannerVisible(nextVisible);
    };

    window.addEventListener('msb-cookie-banner-visibility', handleVisibility as EventListener);
    return () => window.removeEventListener('msb-cookie-banner-visibility', handleVisibility as EventListener);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (show && !hiddenByCTA && !cookieBannerVisible) {
      root.style.setProperty('--msb-mobile-bottom-offset', '88px');
    } else {
      root.style.setProperty('--msb-mobile-bottom-offset', '0px');
    }

    return () => root.style.setProperty('--msb-mobile-bottom-offset', '0px');
  }, [cookieBannerVisible, hiddenByCTA, show]);

  if (!show || hiddenByCTA || cookieBannerVisible) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-xl px-4 pt-3 flex items-center gap-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-tight">14 jours gratuits</p>
        <p className="text-xs text-gray-500 truncate">Sans engagement · À partir de 300 €/an</p>
      </div>
      <CtaLink
        href="/register"
        ctaLocation="sticky_cta"
        className="shrink-0 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-sm transition-colors"
      >
        Essai gratuit <ArrowRight size={14} />
      </CtaLink>
    </div>
  );
}
