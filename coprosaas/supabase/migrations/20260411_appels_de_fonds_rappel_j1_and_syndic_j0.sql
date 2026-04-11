-- Ajoute les marqueurs d'envoi pour les nouvelles relances automatiques appels de fonds
-- - rappel_j1_at        : relance envoyée au copropriétaire à J+1 après échéance
-- - rappel_syndic_j0_at : récapitulatif des impayés envoyé au syndic à J0

ALTER TABLE public.appels_de_fonds
  ADD COLUMN IF NOT EXISTS rappel_j1_at timestamptz,
  ADD COLUMN IF NOT EXISTS rappel_syndic_j0_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_appels_de_fonds_rappel_j1_at
  ON public.appels_de_fonds (date_echeance, rappel_j1_at)
  WHERE statut = 'publie';

CREATE INDEX IF NOT EXISTS idx_appels_de_fonds_rappel_syndic_j0_at
  ON public.appels_de_fonds (date_echeance, rappel_syndic_j0_at)
  WHERE statut = 'publie';
