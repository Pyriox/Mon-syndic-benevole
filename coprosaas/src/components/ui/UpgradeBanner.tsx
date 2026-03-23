// Server component — pas de 'use client' nécessaire
import Link from 'next/link';
import { Crown } from 'lucide-react';

interface Props {
  /**
   * compact=true  → petit bouton pour la zone d'actions en haut des pages.
   * compact=false → bloc centré pour l'EmptyState (défaut).
   */
  compact?: boolean;
}

export default function UpgradeBanner({ compact = false }: Props) {
  if (compact) {
    return (
      <Link
        href="/abonnement"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
      >
        <Crown size={13} />
        S&apos;abonner — 14j gratuits
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-600 text-center">
        Abonnez-vous pour créer et modifier des éléments dans ce module.
      </p>
      <Link
        href="/abonnement"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
      >
        <Crown size={14} />
        Démarrer l&apos;essai gratuit 14 jours
      </Link>
    </div>
  );
}
