'use client';

import dynamic from 'next/dynamic';

const LandingStickyCTA = dynamic(() => import('./LandingStickyCTA'), { ssr: false });
const ScrollToTopButton = dynamic(() => import('@/components/ui/ScrollToTopButton'), { ssr: false });

export default function PublicEnhancements() {
  return (
    <>
      <LandingStickyCTA />
      <ScrollToTopButton />
    </>
  );
}
