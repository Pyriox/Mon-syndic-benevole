'use client';

/**
 * Bouton "Gérer les cookies" — dispatche l'événement écouté par CookieBanner
 * pour permettre à l'utilisateur de modifier son choix à tout moment (exigence CNIL).
 */
interface CookiePreferencesButtonProps {
  className?: string;
  label?: string;
}

export default function CookiePreferencesButton({
  className = 'hover:text-gray-300 transition-colors text-left',
  label = 'Gérer les cookies',
}: CookiePreferencesButtonProps) {
  function handleClick() {
    window.dispatchEvent(new Event('show-cookie-banner'));
  }

  return (
    <button
      onClick={handleClick}
      className={className}
    >
      {label}
    </button>
  );
}
