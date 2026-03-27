-- ============================================================
-- Migration : Politiques RLS INSERT / UPDATE / DELETE pour documents
--
-- Permet aux syndics d'écrire des documents dans leurs copropriétés
-- (correction de l'erreur « new row violates row-level security policy »).
--
-- Ajoute également une politique SELECT pour les syndics, au cas où
-- celle-ci n'aurait pas été créée lors de l'initialisation du schéma.
-- ============================================================

-- ── SELECT (syndic) ──────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "syndic_select_documents"
    ON documents FOR SELECT
    USING (
      copropriete_id IN (
        SELECT id FROM coproprietes WHERE syndic_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── INSERT (syndic) ──────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "syndic_insert_documents"
    ON documents FOR INSERT
    WITH CHECK (
      copropriete_id IN (
        SELECT id FROM coproprietes WHERE syndic_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── UPDATE (syndic) ──────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "syndic_update_documents"
    ON documents FOR UPDATE
    USING (
      copropriete_id IN (
        SELECT id FROM coproprietes WHERE syndic_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── DELETE (syndic) ──────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "syndic_delete_documents"
    ON documents FOR DELETE
    USING (
      copropriete_id IN (
        SELECT id FROM coproprietes WHERE syndic_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
