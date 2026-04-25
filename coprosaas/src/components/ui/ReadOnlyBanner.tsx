// Server component — bandeau CTA pour les modules en lecture seule
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';

export default function ReadOnlyBanner() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-4 text-white shadow-md">
      <Lock size={18} className="shrink-0 opacity-90 hidden sm:block" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-snug">
          Ce module est en lecture seule.
        </p>
        <p className="text-sm opacity-90 mt-0.5">
          Abonnez-vous pour créer, modifier et supprimer des éléments —{' '}
          <span className="font-semibold">14 jours gratuits</span>, le paiement est prélevé au 15e jour.
        </p>
      </div>
      <Link
        href="/abonnement"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors shadow-sm whitespace-nowrap"
      >
        <Sparkles size={14} />
        S&apos;abonner — 14j gratuits
      </Link>
    </div>
  );
}
