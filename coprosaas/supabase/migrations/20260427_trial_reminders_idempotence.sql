-- Idempotence pour les rappels fin d'essai J-3 et J-1.
-- Empêche un double-envoi si Vercel rejoue le cron ou si un run manuel est lancé
-- le même jour qu'un run automatique.

ALTER TABLE public.coproprietes
  ADD COLUMN IF NOT EXISTS rappel_trial_j3_at timestamptz,
  ADD COLUMN IF NOT EXISTS rappel_trial_j1_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_coproprietes_plan_period_end_trial
  ON public.coproprietes (plan, plan_period_end)
  WHERE plan = 'essai';
