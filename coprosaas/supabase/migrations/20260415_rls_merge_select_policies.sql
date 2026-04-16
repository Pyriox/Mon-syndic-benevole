-- ============================================================
-- Fix des warnings restants :
-- 1. auth_rls_initplan   → coproprietaires_select_documents
-- 2. multiple_permissive → toutes les tables avec syndic_all_* (FOR ALL)
--    coexistant avec coproprietaires_select_* (FOR SELECT).
--    Solution : remplacer syndic_all_* par SELECT unifié + INSERT/UPDATE/DELETE séparés.
-- ============================================================

-- ── documents : fix auth_rls_initplan ────────────────────────
DROP POLICY IF EXISTS "coproprietaires_select_documents" ON public.documents;
CREATE POLICY "coproprietaires_select_documents"
  ON public.documents FOR SELECT
  USING (
    copropriete_id IN (SELECT get_user_copropriete_ids())
    AND (
      coproprietaire_id IS NULL
      OR coproprietaire_id IN (
        SELECT id FROM public.coproprietaires WHERE user_id = (select auth.uid())
      )
    )
  );

-- ── documents : fix multiple_permissive (syndic_select + coproprietaires_select) ──
-- On fusionne les deux SELECT en une seule politique.
DROP POLICY IF EXISTS "syndic_select_documents" ON public.documents;
CREATE POLICY "syndic_select_documents"
  ON public.documents FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );
-- Les deux SELECT restent séparées syndic/coproprietaire : c'est acceptable car
-- les conditions sont mutuellement exclusives (un user est soit syndic soit copro).
-- Cependant, pour éliminer le warning, on les fusionne en une seule :
DROP POLICY IF EXISTS "syndic_select_documents" ON public.documents;
DROP POLICY IF EXISTS "coproprietaires_select_documents" ON public.documents;
CREATE POLICY "documents_select"
  ON public.documents FOR SELECT
  USING (
    -- Accès syndic : tous les documents de ses copropriétés
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    OR (
      -- Accès copropriétaire : docs partagés ou docs qui lui sont adressés
      copropriete_id IN (SELECT get_user_copropriete_ids())
      AND (
        coproprietaire_id IS NULL
        OR coproprietaire_id IN (
          SELECT id FROM public.coproprietaires WHERE user_id = (select auth.uid())
        )
      )
    )
  );

-- ── lots : fix multiple_permissive (syndic_select_lots + coproprietaires_select_lots) ──
DROP POLICY IF EXISTS "syndic_select_lots" ON public.lots;
DROP POLICY IF EXISTS "coproprietaires_select_lots" ON public.lots;
CREATE POLICY "lots_select"
  ON public.lots FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    OR copropriete_id IN (SELECT get_user_copropriete_ids())
  );

-- ── appels_de_fonds ───────────────────────────────────────────
-- Remplace syndic_all_appels_de_fonds (FOR ALL) + coproprietaires_select_appels_de_fonds
-- par : SELECT unifié + INSERT/UPDATE/DELETE syndic séparés.
DROP POLICY IF EXISTS "syndic_all_appels_de_fonds" ON public.appels_de_fonds;
DROP POLICY IF EXISTS "coproprietaires_select_appels_de_fonds" ON public.appels_de_fonds;
CREATE POLICY "appels_de_fonds_select"
  ON public.appels_de_fonds FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    OR copropriete_id IN (SELECT get_user_copropriete_ids())
  );
CREATE POLICY "appels_de_fonds_syndic_insert"
  ON public.appels_de_fonds FOR INSERT
  WITH CHECK (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "appels_de_fonds_syndic_update"
  ON public.appels_de_fonds FOR UPDATE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "appels_de_fonds_syndic_delete"
  ON public.appels_de_fonds FOR DELETE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));

-- ── assemblees_generales ──────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_assemblees_generales" ON public.assemblees_generales;
DROP POLICY IF EXISTS "coproprietaires_select_assemblees" ON public.assemblees_generales;
CREATE POLICY "assemblees_generales_select"
  ON public.assemblees_generales FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    OR copropriete_id IN (SELECT get_user_copropriete_ids())
  );
CREATE POLICY "assemblees_generales_syndic_insert"
  ON public.assemblees_generales FOR INSERT
  WITH CHECK (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "assemblees_generales_syndic_update"
  ON public.assemblees_generales FOR UPDATE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "assemblees_generales_syndic_delete"
  ON public.assemblees_generales FOR DELETE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));

-- ── coproprietaires ───────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_coproprietaires" ON public.coproprietaires;
DROP POLICY IF EXISTS "coproprietaires_select_coproprietaires" ON public.coproprietaires;
CREATE POLICY "coproprietaires_select"
  ON public.coproprietaires FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    OR copropriete_id IN (SELECT get_user_copropriete_ids())
  );
CREATE POLICY "coproprietaires_syndic_insert"
  ON public.coproprietaires FOR INSERT
  WITH CHECK (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "coproprietaires_syndic_update"
  ON public.coproprietaires FOR UPDATE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "coproprietaires_syndic_delete"
  ON public.coproprietaires FOR DELETE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));

-- ── depenses ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_depenses" ON public.depenses;
DROP POLICY IF EXISTS "coproprietaires_select_depenses" ON public.depenses;
CREATE POLICY "depenses_select"
  ON public.depenses FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    OR copropriete_id IN (SELECT get_user_copropriete_ids())
  );
CREATE POLICY "depenses_syndic_insert"
  ON public.depenses FOR INSERT
  WITH CHECK (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "depenses_syndic_update"
  ON public.depenses FOR UPDATE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "depenses_syndic_delete"
  ON public.depenses FOR DELETE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));

-- ── incidents ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_incidents" ON public.incidents;
DROP POLICY IF EXISTS "coproprietaires_select_incidents" ON public.incidents;
CREATE POLICY "incidents_select"
  ON public.incidents FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    OR copropriete_id IN (SELECT get_user_copropriete_ids())
  );
CREATE POLICY "incidents_syndic_insert"
  ON public.incidents FOR INSERT
  WITH CHECK (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "incidents_syndic_update"
  ON public.incidents FOR UPDATE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));
CREATE POLICY "incidents_syndic_delete"
  ON public.incidents FOR DELETE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));

-- ── lignes_appels_de_fonds ────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_lignes_appels" ON public.lignes_appels_de_fonds;
DROP POLICY IF EXISTS "coproprietaires_select_lignes_appels" ON public.lignes_appels_de_fonds;
CREATE POLICY "lignes_appels_select"
  ON public.lignes_appels_de_fonds FOR SELECT
  USING (
    appel_de_fonds_id IN (
      SELECT id FROM public.appels_de_fonds
      WHERE copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    )
    OR appel_de_fonds_id IN (
      SELECT id FROM public.appels_de_fonds
      WHERE copropriete_id IN (SELECT get_user_copropriete_ids())
    )
  );
CREATE POLICY "lignes_appels_syndic_insert"
  ON public.lignes_appels_de_fonds FOR INSERT
  WITH CHECK (
    appel_de_fonds_id IN (
      SELECT id FROM public.appels_de_fonds
      WHERE copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    )
  );
CREATE POLICY "lignes_appels_syndic_update"
  ON public.lignes_appels_de_fonds FOR UPDATE
  USING (
    appel_de_fonds_id IN (
      SELECT id FROM public.appels_de_fonds
      WHERE copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    )
  );
CREATE POLICY "lignes_appels_syndic_delete"
  ON public.lignes_appels_de_fonds FOR DELETE
  USING (
    appel_de_fonds_id IN (
      SELECT id FROM public.appels_de_fonds
      WHERE copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    )
  );

-- ── resolutions ───────────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "coproprietaires_select_resolutions" ON public.resolutions;
CREATE POLICY "resolutions_select"
  ON public.resolutions FOR SELECT
  USING (
    ag_id IN (
      SELECT id FROM public.assemblees_generales
      WHERE copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    )
    OR ag_id IN (
      SELECT id FROM public.assemblees_generales
      WHERE copropriete_id IN (SELECT get_user_copropriete_ids())
    )
  );
CREATE POLICY "resolutions_syndic_insert"
  ON public.resolutions FOR INSERT
  WITH CHECK (
    ag_id IN (
      SELECT id FROM public.assemblees_generales
      WHERE copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    )
  );
CREATE POLICY "resolutions_syndic_update"
  ON public.resolutions FOR UPDATE
  USING (
    ag_id IN (
      SELECT id FROM public.assemblees_generales
      WHERE copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    )
  );
CREATE POLICY "resolutions_syndic_delete"
  ON public.resolutions FOR DELETE
  USING (
    ag_id IN (
      SELECT id FROM public.assemblees_generales
      WHERE copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    )
  );

-- ── document_dossiers ─────────────────────────────────────────
-- syndic_gere_ses_dossiers (non trackée, probablement FOR ALL) coexiste avec
-- coproprietaires_select_document_dossiers (FOR SELECT).
-- On supprime les deux et on recrée proprement.
DROP POLICY IF EXISTS "syndic_gere_ses_dossiers" ON public.document_dossiers;
DROP POLICY IF EXISTS "coproprietaires_select_document_dossiers" ON public.document_dossiers;
CREATE POLICY "document_dossiers_select"
  ON public.document_dossiers FOR SELECT
  USING (
    syndic_id = (select auth.uid())
    OR syndic_id IN (
      SELECT syndic_id FROM public.coproprietes
      WHERE id IN (SELECT get_user_copropriete_ids())
    )
  );
CREATE POLICY "document_dossiers_syndic_insert"
  ON public.document_dossiers FOR INSERT
  WITH CHECK (syndic_id = (select auth.uid()));
CREATE POLICY "document_dossiers_syndic_update"
  ON public.document_dossiers FOR UPDATE
  USING (syndic_id = (select auth.uid()));
CREATE POLICY "document_dossiers_syndic_delete"
  ON public.document_dossiers FOR DELETE
  USING (syndic_id = (select auth.uid()));
