'use client';

/**
 * Bouton "Gérer les cookies" — dispatche l'événement écouté par CookieBanner
 * pour permettre à l'utilisateur de modifier son choix à tout moment (exigence CNIL).
 */
export default function CookiePreferencesButton() {
  function handleClick() {
    window.dispatchEvent(new Event('show-cookie-banner'));
  }

  return (
    <button
      onClick={handleClick}
      className="hover:text-gray-300 transition-colors text-left"
    >
      Gérer les cookies
    </button>
  );
}
