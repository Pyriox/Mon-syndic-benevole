-- ============================================================
-- Journal des mouvements de solde par copropriétaire
-- Trace chaque évolution du solde (manuelle et automatique)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coproprietaire_balance_events (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id    uuid        NOT NULL REFERENCES public.coproprietes(id) ON DELETE CASCADE,
  coproprietaire_id uuid        NOT NULL REFERENCES public.coproprietaires(id) ON DELETE CASCADE,
  event_date        date        NOT NULL DEFAULT CURRENT_DATE,
  source_type       text        NOT NULL CHECK (source_type IN (
                      'manual_adjustment',
                      'solde_initial',
                      'opening_balance',
                      'appel_publication',
                      'appel_suppression',
                      'payment_received',
                      'payment_cancelled',
                      'regularisation_closure'
                    )),
  account_type      text        NOT NULL DEFAULT 'principal' CHECK (account_type IN (
                      'principal',
                      'fonds_travaux',
                      'regularisation',
                      'mixte'
                    )),
  label             text        NOT NULL,
  reason            text,
  amount            numeric     NOT NULL,
  balance_before    numeric     NOT NULL,
  balance_after     numeric     NOT NULL,
  source_id         uuid,
  metadata          jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_by        uuid        REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS copro_balance_events_coproprietaire_date_idx
  ON public.coproprietaire_balance_events(coproprietaire_id, event_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS copro_balance_events_copropriete_date_idx
  ON public.coproprietaire_balance_events(copropriete_id, event_date DESC, created_at DESC);

ALTER TABLE public.coproprietaire_balance_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coproprietaire_balance_events'
      AND policyname = 'copro_balance_events_select'
  ) THEN
    CREATE POLICY "copro_balance_events_select"
      ON public.coproprietaire_balance_events FOR SELECT
      USING (
        copropriete_id IN (
          SELECT id FROM public.coproprietes WHERE syndic_id = auth.uid()
        )
        OR coproprietaire_id IN (
          SELECT id FROM public.coproprietaires WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.apply_coproprietaire_balance_delta(
  p_coproprietaire_id uuid,
  p_delta numeric,
  p_label text,
  p_source_type text,
  p_effective_date date DEFAULT CURRENT_DATE,
  p_reason text DEFAULT NULL,
  p_account_type text DEFAULT 'principal',
  p_source_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(event_id uuid, balance_before numeric, balance_after numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_copropriete_id uuid;
  v_balance_before numeric;
  v_balance_after numeric;
  v_event_id uuid;
BEGIN
  IF COALESCE(BTRIM(p_label), '') = '' THEN
    RAISE EXCEPTION 'BALANCE_LABEL_REQUIRED';
  END IF;

  SELECT c.copropriete_id, ROUND(COALESCE(c.solde, 0)::numeric, 2)
  INTO v_copropriete_id, v_balance_before
  FROM public.coproprietaires c
  WHERE c.id = p_coproprietaire_id
  FOR UPDATE;

  IF v_copropriete_id IS NULL THEN
    RAISE EXCEPTION 'COPROPRIETAIRE_NOT_FOUND';
  END IF;

  IF v_uid IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.coproprietes co
    WHERE co.id = v_copropriete_id
      AND co.syndic_id = v_uid
  ) THEN
    RAISE EXCEPTION 'BALANCE_ACCESS_DENIED';
  END IF;

  p_delta := ROUND(COALESCE(p_delta, 0)::numeric, 2);

  IF ABS(p_delta) < 0.005 THEN
    RETURN QUERY SELECT NULL::uuid, v_balance_before, v_balance_before;
    RETURN;
  END IF;

  v_balance_after := ROUND(v_balance_before + p_delta, 2);

  UPDATE public.coproprietaires
  SET solde = v_balance_after
  WHERE id = p_coproprietaire_id;

  v_event_id := gen_random_uuid();

  INSERT INTO public.coproprietaire_balance_events (
    id,
    copropriete_id,
    coproprietaire_id,
    event_date,
    source_type,
    account_type,
    label,
    reason,
    amount,
    balance_before,
    balance_after,
    source_id,
    metadata,
    created_by
  )
  VALUES (
    v_event_id,
    v_copropriete_id,
    p_coproprietaire_id,
    COALESCE(p_effective_date, CURRENT_DATE),
    p_source_type,
    COALESCE(NULLIF(BTRIM(p_account_type), ''), 'principal'),
    p_label,
    NULLIF(BTRIM(COALESCE(p_reason, '')), ''),
    p_delta,
    v_balance_before,
    v_balance_after,
    p_source_id,
    COALESCE(p_metadata, '{}'::jsonb),
    COALESCE(v_uid, p_created_by)
  );

  RETURN QUERY SELECT v_event_id, v_balance_before, v_balance_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_coproprietaire_balance_manually(
  p_coproprietaire_id uuid,
  p_new_balance numeric,
  p_reason text,
  p_effective_date date DEFAULT CURRENT_DATE,
  p_label text DEFAULT 'Ajustement manuel du solde',
  p_account_type text DEFAULT 'principal',
  p_source_type text DEFAULT 'manual_adjustment',
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(event_id uuid, balance_before numeric, balance_after numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_delta numeric;
BEGIN
  IF COALESCE(BTRIM(p_reason), '') = '' THEN
    RAISE EXCEPTION 'MANUAL_REASON_REQUIRED';
  END IF;

  SELECT ROUND(COALESCE(solde, 0)::numeric, 2)
  INTO v_current_balance
  FROM public.coproprietaires
  WHERE id = p_coproprietaire_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'COPROPRIETAIRE_NOT_FOUND';
  END IF;

  v_delta := ROUND(COALESCE(p_new_balance, 0)::numeric - v_current_balance, 2);

  RETURN QUERY
  SELECT *
  FROM public.apply_coproprietaire_balance_delta(
    p_coproprietaire_id := p_coproprietaire_id,
    p_delta := v_delta,
    p_label := p_label,
    p_source_type := p_source_type,
    p_effective_date := p_effective_date,
    p_reason := p_reason,
    p_account_type := p_account_type,
    p_source_id := NULL,
    p_metadata := COALESCE(p_metadata, '{}'::jsonb),
    p_created_by := p_created_by
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_coproprietaire_balance_delta(uuid, numeric, text, text, date, text, text, uuid, jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_coproprietaire_balance_delta(uuid, numeric, text, text, date, text, text, uuid, jsonb, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_coproprietaire_balance_delta(uuid, numeric, text, text, date, text, text, uuid, jsonb, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_coproprietaire_balance_manually(uuid, numeric, text, date, text, text, text, jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_coproprietaire_balance_manually(uuid, numeric, text, date, text, text, text, jsonb, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_coproprietaire_balance_manually(uuid, numeric, text, date, text, text, text, jsonb, uuid) TO authenticated, service_role;

INSERT INTO public.coproprietaire_balance_events (
  copropriete_id,
  coproprietaire_id,
  event_date,
  source_type,
  account_type,
  label,
  reason,
  amount,
  balance_before,
  balance_after,
  metadata,
  created_by
)
SELECT
  c.copropriete_id,
  c.id,
  CURRENT_DATE,
  'opening_balance',
  'principal',
  'Solde d''ouverture de l''historique',
  'Instantané initial créé lors de l’activation du journal financier.',
  ROUND(COALESCE(c.solde, 0)::numeric, 2),
  0,
  ROUND(COALESCE(c.solde, 0)::numeric, 2),
  jsonb_build_object('origin', 'migration_bootstrap'),
  NULL
FROM public.coproprietaires c
WHERE ABS(COALESCE(c.solde, 0)::numeric) >= 0.005
  AND NOT EXISTS (
    SELECT 1
    FROM public.coproprietaire_balance_events e
    WHERE e.coproprietaire_id = c.id
      AND e.source_type = 'opening_balance'
      AND e.metadata ->> 'origin' = 'migration_bootstrap'
  );

CREATE OR REPLACE FUNCTION public.cloturer_regularisation_exercice(p_exercice_id uuid)
RETURNS TABLE (copropriete_id uuid, updated_rows integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_copropriete_id uuid;
  v_annee integer;
BEGIN
  UPDATE exercices
  SET statut = 'cloture',
      cloture_at = COALESCE(cloture_at, now())
  WHERE id = p_exercice_id
    AND statut <> 'cloture'
  RETURNING exercices.copropriete_id, exercices.annee
  INTO v_copropriete_id, v_annee;

  IF v_copropriete_id IS NULL THEN
    RAISE EXCEPTION 'EXERCICE_ALREADY_CLOSED_OR_MISSING';
  END IF;

  INSERT INTO public.coproprietaire_balance_events (
    copropriete_id,
    coproprietaire_id,
    event_date,
    source_type,
    account_type,
    label,
    reason,
    amount,
    balance_before,
    balance_after,
    source_id,
    metadata,
    created_by
  )
  SELECT
    c.copropriete_id,
    c.id,
    CURRENT_DATE,
    'regularisation_closure',
    'regularisation',
    CASE
      WHEN v_annee IS NULL THEN 'Clôture de régularisation'
      ELSE 'Clôture de régularisation ' || v_annee::text
    END,
    NULL,
    ROUND(balances.total_balance, 2),
    ROUND(COALESCE(c.solde, 0)::numeric, 2),
    ROUND(COALESCE(c.solde, 0)::numeric + balances.total_balance, 2),
    p_exercice_id,
    jsonb_build_object('exercice_id', p_exercice_id, 'annee', v_annee),
    NULL
  FROM public.coproprietaires c
  JOIN (
    SELECT coproprietaire_id, COALESCE(SUM(balance), 0)::numeric AS total_balance
    FROM public.regularisation_lignes
    WHERE exercice_id = p_exercice_id
    GROUP BY coproprietaire_id
  ) AS balances
    ON balances.coproprietaire_id = c.id
  WHERE ABS(balances.total_balance) >= 0.005;

  UPDATE coproprietaires AS c
  SET solde = ROUND((COALESCE(c.solde, 0)::numeric + balances.total_balance), 2)
  FROM (
    SELECT coproprietaire_id, COALESCE(SUM(balance), 0)::numeric AS total_balance
    FROM public.regularisation_lignes
    WHERE exercice_id = p_exercice_id
    GROUP BY coproprietaire_id
  ) AS balances
  WHERE c.id = balances.coproprietaire_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  copropriete_id = v_copropriete_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.cloturer_regularisation_exercice(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cloturer_regularisation_exercice(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cloturer_regularisation_exercice(uuid) TO service_role;
