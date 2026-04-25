// Server component — bandeau CTA pour les modules en lecture seule ou version gratuite
import Link from 'next/link';
import { Lock, Sparkles, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface ReadOnlyBannerProps {
  /**
   * freemium=true → accès ouvert mais limité (ex: 10 lots max).
   * Affiche "Version gratuite" au lieu de "lecture seule".
   */
  freemium?: boolean;
  /** Texte de description personnalisé (mode freemium). */
  description?: string;
}

export default async function ReadOnlyBanner({ freemium = false, description }: ReadOnlyBannerProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let trialUsed = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_used')
      .eq('id', user.id)
      .single();
    trialUsed = profile?.trial_used === true;
  }

  if (freemium) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-4 text-white shadow-md">
        <Zap size={18} className="shrink-0 opacity-90 hidden sm:block" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug">Version gratuite.</p>
          <p className="text-sm opacity-90 mt-0.5">
            {description ?? (trialUsed
              ? 'Abonnez-vous pour accéder à toutes les fonctionnalités.'
              : <>Abonnez-vous pour accéder à toutes les fonctionnalités —{' '}
                  <span className="font-semibold">14 jours gratuits</span>, le paiement est prélevé au 15e jour.</>
            )}
          </p>
        </div>
        <Link
          href="/abonnement"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors shadow-sm whitespace-nowrap"
        >
          <Sparkles size={14} />
          {trialUsed ? 'Choisir un abonnement' : "S'abonner — 14j gratuits"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-4 text-white shadow-md">
      <Lock size={18} className="shrink-0 opacity-90 hidden sm:block" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-snug">
          Ce module est en lecture seule.
        </p>
        <p className="text-sm opacity-90 mt-0.5">
          {trialUsed
            ? 'Abonnez-vous pour créer, modifier et supprimer des éléments.'
            : <>Abonnez-vous pour créer, modifier et supprimer des éléments —{' '}
                <span className="font-semibold">14 jours gratuits</span>, le paiement est prélevé au 15e jour.</>
          }
        </p>
      </div>
      <Link
        href="/abonnement"
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors shadow-sm whitespace-nowrap"
      >
        <Sparkles size={14} />
        {trialUsed ? 'Choisir un abonnement' : "S'abonner — 14j gratuits"}
      </Link>
    </div>
  );
}
