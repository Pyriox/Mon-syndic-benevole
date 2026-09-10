// ============================================================
// Bouton "Connexion / Mon espace" de la nav publique.
// Isolé de LandingNav et chargé via next/dynamic (ssr:false) pour que le
// bundle @supabase/ssr (utilisé uniquement pour lire la session) ne fasse
// pas partie du JS critique hydraté au premier affichage de la home.
// ============================================================
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

interface AccountNavButtonProps {
  className: string;
  onNavigate?: () => void;
}

export default function AccountNavButton({ className, onNavigate }: AccountNavButtonProps) {
  const router = useRouter();
  const [accountHref, setAccountHref] = useState('/login');
  const [accountLabel, setAccountLabel] = useState('Connexion');
  const [navPending, setNavPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const updateAccountState = async () => {
      const { data } = await supabase.auth.getSession();
      const isAuthenticated = Boolean(data.session);
      setAccountHref(isAuthenticated ? '/dashboard' : '/login');
      setAccountLabel(isAuthenticated ? 'Mon espace' : 'Connexion');
    };

    void updateAccountState();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void updateAccountState();
    });
    const handleWindowFocus = () => void updateAccountState();
    const handleVisibilityChange = () => void updateAccountState();
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleClick = () => {
    onNavigate?.();
    setNavPending(true);
    router.push(accountHref);
    // Filet de sécurité si la navigation est interrompue.
    window.setTimeout(() => setNavPending(false), 3000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={navPending}
      aria-busy={navPending}
      className={className}
    >
      {navPending ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <DashboardIcon />}
      {navPending ? 'Ouverture...' : accountLabel}
    </button>
  );
}
