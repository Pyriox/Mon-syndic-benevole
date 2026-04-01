-- ============================================================
-- Migration : Ajout de coproprietaire_id sur documents
--
-- Permet d'associer un document (ex : avis d'appel de fonds)
-- à un copropriétaire spécifique.
-- NULL = document partagé visible par tous ; valeur = document
-- individuel visible uniquement par le copropriétaire concerné.
-- ============================================================

ALTER TABLE documents ADD COLUMN IF NOT EXISTS coproprietaire_id uuid
  REFERENCES coproprietaires(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS documents_coproprietaire_id_idx
  ON documents(coproprietaire_id)
  WHERE coproprietaire_id IS NOT NULL;

-- Remplace l'ancienne politique (copropriété uniquement) par une
-- politique qui distingue docs partagés et docs individuels.
DROP POLICY IF EXISTS "coproprietaires_select_documents" ON documents;

CREATE POLICY "coproprietaires_select_documents"
  ON documents FOR SELECT
  USING (
    copropriete_id IN (SELECT get_user_copropriete_ids())
    AND (
      coproprietaire_id IS NULL
      OR coproprietaire_id IN (
        SELECT id FROM coproprietaires WHERE user_id = auth.uid()
      )
    )
  );
