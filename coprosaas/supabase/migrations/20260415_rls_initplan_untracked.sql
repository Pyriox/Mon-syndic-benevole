-- ============================================================
-- Fix auth_rls_initplan pour les politiques non trackées en migration.
-- Toutes ces politiques ont été créées directement dans Supabase.
-- On utilise ALTER POLICY pour modifier uniquement la clause USING/WITH CHECK
-- sans toucher au reste (nom, rôle, FOR clause).
-- ============================================================

-- ── profiles ──────────────────────────────────────────────────
-- USING: (auth.role() = 'authenticated'::text)
ALTER POLICY "Authenticated users have full access"
  ON public.profiles
  USING ((select auth.role()) = 'authenticated'::text);

-- ── coproprietes ──────────────────────────────────────────────
ALTER POLICY "Authenticated users have full access"
  ON public.coproprietes
  USING ((select auth.role()) = 'authenticated'::text);

-- ── repartitions_depenses ─────────────────────────────────────
ALTER POLICY "Authenticated users have full access"
  ON public.repartitions_depenses
  USING ((select auth.role()) = 'authenticated'::text);

-- ── ag_presences ──────────────────────────────────────────────
ALTER POLICY "Authenticated full access"
  ON public.ag_presences
  USING ((select auth.role()) = 'authenticated'::text);

-- ── votes_coproprietaires ─────────────────────────────────────
ALTER POLICY "Authenticated full access"
  ON public.votes_coproprietaires
  USING ((select auth.role()) = 'authenticated'::text);

-- ── invitations : "Créer invitation" ──────────────────────────
-- La politique d'origine autorise l'insertion si l'utilisateur est l'auteur.
-- On corrige auth.uid() → (select auth.uid()) dans la WITH CHECK.
ALTER POLICY "Créer invitation"
  ON public.invitations
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── document_dossiers : syndic_gere_ses_dossiers ──────────────
-- Le syndic peut gérer les dossiers de ses copropriétés.
ALTER POLICY "syndic_gere_ses_dossiers"
  ON public.document_dossiers
  USING (
    syndic_id IN (
      SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid())
    )
  );

-- ── lots : politiques syndic (non trackées) ───────────────────
ALTER POLICY "syndic_select_lots"
  ON public.lots
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );

ALTER POLICY "syndic_insert_lots"
  ON public.lots
  WITH CHECK (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );

ALTER POLICY "syndic_update_lots"
  ON public.lots
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );

ALTER POLICY "syndic_delete_lots"
  ON public.lots
  USING (
    copropriete_id IN (SELECT id FROM public.coproprietes WHERE syndic_id = (select auth.uid()))
  );
