'use client';

import { useEffect, useState } from 'react';

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 350);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Remonter en haut de la page"
      className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 19V5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M6 11L12 5L18 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
