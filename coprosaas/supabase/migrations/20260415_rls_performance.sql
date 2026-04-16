-- ============================================================
-- RLS Performance — deux classes d'avertissements corrigées
--
-- 1. auth_rls_initplan : auth.uid() / auth.email() appelés
--    sans (select ...) → réévalués ligne par ligne.
--    Fix : remplacer auth.uid() par (select auth.uid()).
--
-- 2. multiple_permissive_policies : politique générique
--    "Authenticated users have full access" (FOR ALL) qui
--    coexiste avec des politiques spécifiques ajoutées ensuite.
--    Fix : ajouter politique syndic explicite + supprimer la
--    politique générique sur les tables concernées.
-- ============================================================

-- ── Helper function ──────────────────────────────────────────
-- Correction interne : auth.uid() sans (select) dans le corps de
-- la fonction SECURITY DEFINER → flagué indirectement par le linter.
CREATE OR REPLACE FUNCTION get_user_copropriete_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT copropriete_id
  FROM coproprietaires
  WHERE user_id = (select auth.uid())
$$;

-- ══════════════════════════════════════════════════════════════
-- PARTIE 1 — auth_rls_initplan : politiques trackées
-- ══════════════════════════════════════════════════════════════

-- ── exercices ────────────────────────────────────────────────
-- Remplacement de exercices_syndic_all (FOR ALL) + exercices_copro_select
-- par une politique SELECT unifiée + politiques d'écriture séparées.
-- Cela corrige à la fois auth_rls_initplan ET multiple_permissive_policies.
DROP POLICY IF EXISTS "exercices_syndic_all" ON public.exercices;
DROP POLICY IF EXISTS "exercices_copro_select" ON public.exercices;

CREATE POLICY "exercices_select"
  ON public.exercices FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
    OR copropriete_id IN (SELECT copropriete_id FROM public.coproprietaires WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "exercices_syndic_insert"
  ON public.exercices FOR INSERT
  WITH CHECK (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));

CREATE POLICY "exercices_syndic_update"
  ON public.exercices FOR UPDATE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));

CREATE POLICY "exercices_syndic_delete"
  ON public.exercices FOR DELETE
  USING (copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())));

-- ── regularisation_lignes ─────────────────────────────────────
DROP POLICY IF EXISTS "regularisation_syndic_all" ON public.regularisation_lignes;
DROP POLICY IF EXISTS "regularisation_copro_select" ON public.regularisation_lignes;

CREATE POLICY "regularisation_select"
  ON public.regularisation_lignes FOR SELECT
  USING (
    exercice_id IN (
      SELECT e.id FROM public.exercices e
      JOIN public.coproprietes c ON c.id = e.copropriete_id
      WHERE c.syndic_id = (select auth.uid())
    )
    OR coproprietaire_id IN (
      SELECT id FROM public.coproprietaires WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "regularisation_syndic_insert"
  ON public.regularisation_lignes FOR INSERT
  WITH CHECK (
    exercice_id IN (
      SELECT e.id FROM public.exercices e
      JOIN public.coproprietes c ON c.id = e.copropriete_id
      WHERE c.syndic_id = (select auth.uid())
    )
  );

CREATE POLICY "regularisation_syndic_update"
  ON public.regularisation_lignes FOR UPDATE
  USING (
    exercice_id IN (
      SELECT e.id FROM public.exercices e
      JOIN public.coproprietes c ON c.id = e.copropriete_id
      WHERE c.syndic_id = (select auth.uid())
    )
  );

CREATE POLICY "regularisation_syndic_delete"
  ON public.regularisation_lignes FOR DELETE
  USING (
    exercice_id IN (
      SELECT e.id FROM public.exercices e
      JOIN public.coproprietes c ON c.id = e.copropriete_id
      WHERE c.syndic_id = (select auth.uid())
    )
  );

-- ── admin_users ───────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
CREATE POLICY "admin_users_self_read"
  ON public.admin_users FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ── support_tickets ───────────────────────────────────────────
DROP POLICY IF EXISTS "support_tickets_select_own" ON public.support_tickets;
CREATE POLICY "support_tickets_select_own"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "support_tickets_insert_own" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_own"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ── support_messages ──────────────────────────────────────────
DROP POLICY IF EXISTS "support_messages_select_own" ON public.support_messages;
CREATE POLICY "support_messages_select_own"
  ON public.support_messages FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "support_messages_insert_client" ON public.support_messages;
CREATE POLICY "support_messages_insert_client"
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    author = 'client'
    AND ticket_id IN (
      SELECT id FROM public.support_tickets WHERE user_id = (select auth.uid())
    )
  );

-- ── user_events ───────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_users_insert_own_events" ON public.user_events;
CREATE POLICY "auth_users_insert_own_events"
  ON public.user_events FOR INSERT TO authenticated
  WITH CHECK (user_email = lower((select auth.email())));

-- ── app_notifications ─────────────────────────────────────────
DROP POLICY IF EXISTS "app_notifications_select_own" ON public.app_notifications;
CREATE POLICY "app_notifications_select_own"
  ON public.app_notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "app_notifications_update_own" ON public.app_notifications;
CREATE POLICY "app_notifications_update_own"
  ON public.app_notifications FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ── email_deliveries ──────────────────────────────────────────
DROP POLICY IF EXISTS "email_deliveries_select_syndic" ON public.email_deliveries;
CREATE POLICY "email_deliveries_select_syndic"
  ON public.email_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coproprietes c
      WHERE c.id = email_deliveries.copropriete_id
        AND c.syndic_id = (select auth.uid())
    )
  );

-- ── email_delivery_events ─────────────────────────────────────
DROP POLICY IF EXISTS "email_delivery_events_select_syndic" ON public.email_delivery_events;
CREATE POLICY "email_delivery_events_select_syndic"
  ON public.email_delivery_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.email_deliveries d
      JOIN public.coproprietes c ON c.id = d.copropriete_id
      WHERE d.id = email_delivery_events.delivery_id
        AND c.syndic_id = (select auth.uid())
    )
  );

-- ── coproprietaire_balance_events ─────────────────────────────
DROP POLICY IF EXISTS "copro_balance_events_select" ON public.coproprietaire_balance_events;
CREATE POLICY "copro_balance_events_select"
  ON public.coproprietaire_balance_events FOR SELECT
  USING (
    copropriete_id IN (
      SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())
    )
    OR coproprietaire_id IN (
      SELECT id FROM public.coproprietaires WHERE user_id = (select auth.uid())
    )
  );

-- ── copro_addons ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Members can read copro add-ons" ON public.copro_addons;
CREATE POLICY "Members can read copro add-ons"
  ON public.copro_addons FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.coproprietaires cp
      WHERE cp.copropriete_id = copro_addons.copropriete_id
        AND cp.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Syndics can insert copro add-ons" ON public.copro_addons;
CREATE POLICY "Syndics can insert copro add-ons"
  ON public.copro_addons FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Syndics can update copro add-ons" ON public.copro_addons;
CREATE POLICY "Syndics can update copro add-ons"
  ON public.copro_addons FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Syndics can delete copro add-ons" ON public.copro_addons;
CREATE POLICY "Syndics can delete copro add-ons"
  ON public.copro_addons FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = (select auth.uid())
    )
  );

-- ── documents : politiques syndic ────────────────────────────
DROP POLICY IF EXISTS "syndic_select_documents" ON public.documents;
CREATE POLICY "syndic_select_documents"
  ON public.documents FOR SELECT
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "syndic_insert_documents" ON public.documents;
CREATE POLICY "syndic_insert_documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "syndic_update_documents" ON public.documents;
CREATE POLICY "syndic_update_documents"
  ON public.documents FOR UPDATE
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "syndic_delete_documents" ON public.documents;
CREATE POLICY "syndic_delete_documents"
  ON public.documents FOR DELETE
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );

-- ══════════════════════════════════════════════════════════════
-- PARTIE 2 — multiple_permissive_policies
-- Suppression de "Authenticated users have full access" (politique
-- trop large créée à l'initialisation du schéma) et remplacement
-- par des politiques syndic explicites sur les tables où il n'en
-- existait pas encore.
-- ══════════════════════════════════════════════════════════════

-- ── lots ─────────────────────────────────────────────────────
-- syndic_select/insert/update/delete_lots + coproprietaires_select_lots
-- couvrent déjà tous les accès → la politique générale est obsolète.
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.lots;

-- ── documents ────────────────────────────────────────────────
-- Idem : syndic_* + coproprietaires_select_documents couvrent tout.
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.documents;

-- ── appels_de_fonds ──────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_appels_de_fonds" ON public.appels_de_fonds;
CREATE POLICY "syndic_all_appels_de_fonds"
  ON public.appels_de_fonds FOR ALL
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  )
  WITH CHECK (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.appels_de_fonds;

-- ── assemblees_generales ──────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_assemblees_generales" ON public.assemblees_generales;
CREATE POLICY "syndic_all_assemblees_generales"
  ON public.assemblees_generales FOR ALL
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  )
  WITH CHECK (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.assemblees_generales;

-- ── coproprietaires ───────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_coproprietaires" ON public.coproprietaires;
CREATE POLICY "syndic_all_coproprietaires"
  ON public.coproprietaires FOR ALL
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  )
  WITH CHECK (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.coproprietaires;

-- ── depenses ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_depenses" ON public.depenses;
CREATE POLICY "syndic_all_depenses"
  ON public.depenses FOR ALL
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  )
  WITH CHECK (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.depenses;

-- ── incidents ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_incidents" ON public.incidents;
CREATE POLICY "syndic_all_incidents"
  ON public.incidents FOR ALL
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  )
  WITH CHECK (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.incidents;

-- ── lignes_appels_de_fonds ────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_lignes_appels" ON public.lignes_appels_de_fonds;
CREATE POLICY "syndic_all_lignes_appels"
  ON public.lignes_appels_de_fonds FOR ALL
  USING (
    appel_de_fonds_id IN (
      SELECT id FROM public.appels_de_fonds
      WHERE copropriete_id IN (
        SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    appel_de_fonds_id IN (
      SELECT id FROM public.appels_de_fonds
      WHERE copropriete_id IN (
        SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())
      )
    )
  );
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.lignes_appels_de_fonds;

-- ── resolutions ───────────────────────────────────────────────
DROP POLICY IF EXISTS "syndic_all_resolutions" ON public.resolutions;
CREATE POLICY "syndic_all_resolutions"
  ON public.resolutions FOR ALL
  USING (
    ag_id IN (
      SELECT id FROM public.assemblees_generales
      WHERE copropriete_id IN (
        SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())
      )
    )
  )
  WITH CHECK (
    ag_id IN (
      SELECT id FROM public.assemblees_generales
      WHERE copropriete_id IN (
        SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())
      )
    )
  );
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.resolutions;

-- ══════════════════════════════════════════════════════════════
-- NON TRAITÉ ICI — politiques non trackées dans les migrations
-- (créées directement dans Supabase lors de l'initialisation)
-- À corriger manuellement via le dashboard Supabase ou après
-- avoir fait `supabase db pull` :
--
--   profiles          → "Authenticated users have full access"
--   coproprietes       → "Authenticated users have full access"
--   repartitions_depenses → "Authenticated users have full access"
--   ag_presences       → "Authenticated full access"
--   votes_coproprietaires → "Authenticated full access"
--   invitations        → "Créer invitation"
--   document_dossiers  → "syndic_gere_ses_dossiers"
--   lots               → syndic_select/insert/update/delete_lots
--
-- Pour chacune : éditer la politique dans Dashboard → Table Editor
-- → Auth policies → modifier l'expression USING pour remplacer
-- auth.uid() par (select auth.uid()).
-- ══════════════════════════════════════════════════════════════
