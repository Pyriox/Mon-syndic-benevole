-- ============================================================
-- Migration : Nouveaux champs pour le workflow incidents/travaux
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS type_incident      TEXT    DEFAULT 'autre',
  ADD COLUMN IF NOT EXISTS localisation       TEXT,
  ADD COLUMN IF NOT EXISTS artisan_nom        TEXT,
  ADD COLUMN IF NOT EXISTS artisan_contact    TEXT,
  ADD COLUMN IF NOT EXISTS montant_devis      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS montant_final      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS date_intervention_prevue DATE,
  ADD COLUMN IF NOT EXISTS notes_internes     TEXT;   -- JSON array [{ date, texte }]

-- Mettre à jour les anciennes valeurs de statut si la contrainte CHECK existe
-- (uniquement si la colonne était auparavant contrainte sur 'ouvert'|'en_cours'|'resolu')
-- ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_statut_check;
-- ALTER TABLE incidents ADD CONSTRAINT incidents_statut_check
--   CHECK (statut IN ('ouvert','devis_demande','devis_recu','en_cours','resolu'));

-- Optionnel : Mettre à jour tous les anciens enregistrements sans type
UPDATE incidents SET type_incident = 'autre' WHERE type_incident IS NULL;
