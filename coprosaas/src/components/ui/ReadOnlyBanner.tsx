// Server component — bandeau informatif pour les modules en lecture seule
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function ReadOnlyBanner() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Lock size={15} className="shrink-0 text-amber-500" />
      <span className="flex-1">
        Ce module est en <strong>lecture seule</strong>. Abonnez-vous pour créer, modifier et supprimer des éléments.{' '}
        <strong>14 jours gratuits</strong>, le paiement est prélevé au 15e jour.
      </span>
      <Link
        href="/abonnement"
        className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors"
      >
        Choisir un abonnement
      </Link>
    </div>
  );
}
