-- ============================================================
-- Migration : Politiques RLS SELECT pour les vues copropriétaires
--
-- Permet aux copropriétaires d'accéder à leurs données en lecture
-- via le client Supabase normal (session utilisateur) sans bypass
-- de la RLS via le client admin.
--
-- Utilise une fonction SECURITY DEFINER pour éviter la récursion
-- infinie lors des requêtes sur la table coproprietaires elle-même.
-- ============================================================

-- Fonction helper : copropriété IDs accessibles à l'utilisateur courant
-- SECURITY DEFINER = bypass RLS sur la table coproprietaires (évite la récursion)
CREATE OR REPLACE FUNCTION get_user_copropriete_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT copropriete_id
  FROM coproprietaires
  WHERE user_id = auth.uid()
$$;

-- ── depenses ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_depenses"
    ON depenses FOR SELECT
    USING (copropriete_id IN (SELECT get_user_copropriete_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── lots ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_lots"
    ON lots FOR SELECT
    USING (copropriete_id IN (SELECT get_user_copropriete_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── coproprietaires (lecture des co-copropriétaires) ─────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_coproprietaires"
    ON coproprietaires FOR SELECT
    USING (copropriete_id IN (SELECT get_user_copropriete_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── incidents ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_incidents"
    ON incidents FOR SELECT
    USING (copropriete_id IN (SELECT get_user_copropriete_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── appels_de_fonds ──────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_appels_de_fonds"
    ON appels_de_fonds FOR SELECT
    USING (copropriete_id IN (SELECT get_user_copropriete_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── lignes_appels_de_fonds ───────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_lignes_appels"
    ON lignes_appels_de_fonds FOR SELECT
    USING (
      appel_de_fonds_id IN (
        SELECT id FROM appels_de_fonds
        WHERE copropriete_id IN (SELECT get_user_copropriete_ids())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── assemblees_generales ─────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_assemblees"
    ON assemblees_generales FOR SELECT
    USING (copropriete_id IN (SELECT get_user_copropriete_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── resolutions ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_resolutions"
    ON resolutions FOR SELECT
    USING (
      ag_id IN (
        SELECT id FROM assemblees_generales
        WHERE copropriete_id IN (SELECT get_user_copropriete_ids())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── presences ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_presences"
    ON presences FOR SELECT
    USING (
      ag_id IN (
        SELECT id FROM assemblees_generales
        WHERE copropriete_id IN (SELECT get_user_copropriete_ids())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── documents ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_documents"
    ON documents FOR SELECT
    USING (copropriete_id IN (SELECT get_user_copropriete_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── document_dossiers (accès via syndic_id de la copropriété) ─
DO $$ BEGIN
  CREATE POLICY "coproprietaires_select_document_dossiers"
    ON document_dossiers FOR SELECT
    USING (
      syndic_id IN (
        SELECT syndic_id FROM coproprietes
        WHERE id IN (SELECT get_user_copropriete_ids())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Recherche d'un utilisateur auth par email (pour transfert de syndic) ──
-- Contourne le manque de getUserByEmail dans @supabase/supabase-js v2
CREATE OR REPLACE FUNCTION find_auth_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = lower(trim(user_email)) LIMIT 1
$$;
