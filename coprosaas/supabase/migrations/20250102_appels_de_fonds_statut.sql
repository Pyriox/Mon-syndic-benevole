-- ============================================================
-- Migration : Workflow brouillon → publié pour appels de fonds
-- Rappels e-mail automatiques (J-7 et J+15)
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

ALTER TABLE appels_de_fonds
  ADD COLUMN IF NOT EXISTS statut       TEXT NOT NULL DEFAULT 'publie',
  ADD COLUMN IF NOT EXISTS rappel_j7_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rappel_j15_at TIMESTAMPTZ;

-- Les appels existants sont déjà publiés (lignes + soldes déjà gérés)
UPDATE appels_de_fonds SET statut = 'publie' WHERE statut IS NULL OR statut = '';
