-- ============================================================
-- Migration : coproprietes.syndic_id → ON DELETE SET NULL
--
-- Problème : supprimer un profil (profiles) échoue car
-- coproprietes.syndic_id est une FK sans ON DELETE SET NULL.
-- Solution : recréer la contrainte avec ON DELETE SET NULL pour
-- que la suppression d'un compte détache la copropriété
-- (syndic_id → null) sans supprimer ses données.
-- ============================================================

-- 1. Supprimer la contrainte existante (quel que soit son nom)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name
    INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
     AND kcu.table_schema    = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name      = 'coproprietes'
      AND kcu.column_name    = 'syndic_id';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE coproprietes DROP CONSTRAINT %I',
      constraint_name
    );
  END IF;
END $$;

-- 2. Recréer avec ON DELETE SET NULL
ALTER TABLE coproprietes
  ADD CONSTRAINT coproprietes_syndic_id_fkey
  FOREIGN KEY (syndic_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;
