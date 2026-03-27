-- Ajoute le champ montant_fonds_travaux à appels_de_fonds
-- Permet de tracer la part fonds travaux ALUR dans un appel budget_previsionnel
-- sans créer un appel distinct : réglementairement c'est le même appel de fonds,
-- mais les deux montants doivent apparaître séparément en comptabilité (102 / 103).

ALTER TABLE appels_de_fonds
  ADD COLUMN IF NOT EXISTS montant_fonds_travaux NUMERIC DEFAULT 0 NOT NULL;
