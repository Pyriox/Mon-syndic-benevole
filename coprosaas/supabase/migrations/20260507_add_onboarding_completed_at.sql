-- Timestamp enregistré la première fois que tous les modules d'onboarding
-- sont complétés (lots + copropriétaires + AG + appels de fonds).
-- Utilisé pour masquer le banner "Configuration terminée" après 7 jours.

ALTER TABLE public.coproprietes
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
