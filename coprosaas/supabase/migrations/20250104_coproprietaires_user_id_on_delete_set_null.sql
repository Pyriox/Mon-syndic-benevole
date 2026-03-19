-- ============================================================
-- Migration : coproprietaires.user_id → ON DELETE SET NULL
--
-- Problème : supprimer un utilisateur dans auth.users échoue
-- car coproprietaires.user_id est un FK sans ON DELETE SET NULL.
-- Solution : recréer la contrainte avec ON DELETE SET NULL pour
-- que la suppression d'un compte auth détache le copropriétaire
-- sans supprimer ses données (lots, appels, etc.).
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
     AND kcu.table_name = tc.table_name
   WHERE tc.table_name = 'coproprietaires'
     AND tc.constraint_type = 'FOREIGN KEY'
     AND kcu.column_name = 'user_id'
   LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE coproprietaires DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- 2. Recréer avec ON DELETE SET NULL
ALTER TABLE coproprietaires
  ADD CONSTRAINT coproprietaires_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;
