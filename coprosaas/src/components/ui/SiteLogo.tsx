// Composant logo SVG de Mon Syndic Bénévole
// Maison stylisée sur fond dégradé bleu-indigo

interface SiteLogoProps {
  size?: number;
  className?: string;
}

export default function SiteLogo({ size = 32, className = '' }: SiteLogoProps) {
  const id = 'msb-grad';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Mon Syndic Bénévole"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>

      {/* Fond arrondi dégradé */}
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />

      {/* Toit — triangle épuré */}
      <path d="M16 6L26 14.5H6L16 6Z" fill="white" fillOpacity="0.95" />

      {/* Corps de la maison */}
      <rect x="9" y="14.5" width="14" height="11.5" rx="1" fill="white" fillOpacity="0.95" />

      {/* Porte (laisse transparaître le dégradé) */}
      <rect x="13.5" y="18.5" width="5" height="7.5" rx="1.5" fill={`url(#${id})`} />

      {/* Fenêtre gauche */}
      <rect x="10.5" y="16" width="3" height="3" rx="0.75" fill={`url(#${id})`} fillOpacity="0.75" />

      {/* Fenêtre droite */}
      <rect x="18.5" y="16" width="3" height="3" rx="0.75" fill={`url(#${id})`} fillOpacity="0.75" />
    </svg>
  );
}
