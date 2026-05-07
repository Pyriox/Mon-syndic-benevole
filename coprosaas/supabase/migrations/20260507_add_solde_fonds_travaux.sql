-- Suivi séparé du fonds de travaux ALUR par copropriétaire.
-- Cette colonne est maintenue en parallèle de `solde` (qui reste le solde global)
-- pour permettre l'affichage d'un KPI dédié dans l'espace copropriétaire.

ALTER TABLE public.coproprietaires
  ADD COLUMN IF NOT EXISTS solde_fonds_travaux numeric DEFAULT 0 NOT NULL;

-- Mettre à jour la fonction apply_coproprietaire_balance_delta pour
-- maintenir solde_fonds_travaux quand account_type = 'fonds_travaux'.
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
  v_resolved_account_type text;
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

  v_resolved_account_type := COALESCE(NULLIF(BTRIM(p_account_type), ''), 'principal');
  v_balance_after := ROUND(v_balance_before + p_delta, 2);

  -- Mettre à jour le solde global dans tous les cas
  UPDATE public.coproprietaires
  SET solde = v_balance_after
  WHERE id = p_coproprietaire_id;

  -- Mettre à jour solde_fonds_travaux uniquement pour les mouvements dédiés FdT
  IF v_resolved_account_type = 'fonds_travaux' THEN
    UPDATE public.coproprietaires
    SET solde_fonds_travaux = ROUND(COALESCE(solde_fonds_travaux, 0) + p_delta, 2)
    WHERE id = p_coproprietaire_id;
  END IF;

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
    v_resolved_account_type,
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
