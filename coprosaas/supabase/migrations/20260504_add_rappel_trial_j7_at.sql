-- Idempotence pour le rappel fin d'essai J-7.
-- Complète la séquence trial J-7 → J-3 → J-1 introduite dans
-- l'audit email P2.d : l'email J-7 prépare la décision d'achat
-- avec suffisamment d'avance avant les rappels J-3 et J-1.

ALTER TABLE public.coproprietes
  ADD COLUMN IF NOT EXISTS rappel_trial_j7_at timestamptz;
