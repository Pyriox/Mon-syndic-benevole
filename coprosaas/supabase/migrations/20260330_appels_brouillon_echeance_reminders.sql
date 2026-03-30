-- ============================================================
-- Rappels syndic : brouillons non publiés proches échéance
-- - J-14
-- - J-7
-- - D+1 si échéance < 7 jours
-- ============================================================

ALTER TABLE appels_de_fonds
  ADD COLUMN IF NOT EXISTS rappel_brouillon_j14_at timestamptz,
  ADD COLUMN IF NOT EXISTS rappel_brouillon_j7_at timestamptz,
  ADD COLUMN IF NOT EXISTS rappel_brouillon_j1_urgent_at timestamptz;
