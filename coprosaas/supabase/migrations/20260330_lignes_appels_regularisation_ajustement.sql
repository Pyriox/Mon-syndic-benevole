-- ============================================================
-- Ajout du détail d'ajustement de régularisation sur les lignes
-- d'appel de fonds (montant reporté, positif ou négatif)
-- ============================================================

ALTER TABLE lignes_appels_de_fonds
ADD COLUMN IF NOT EXISTS regularisation_ajustement numeric NOT NULL DEFAULT 0;
