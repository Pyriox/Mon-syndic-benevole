-- Add-ons payants par copropriété + verrouillage backend des charges spéciales.

CREATE TABLE IF NOT EXISTS public.copro_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  copropriete_id uuid NOT NULL REFERENCES public.coproprietes(id) ON DELETE CASCADE,
  addon_key text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  stripe_subscription_id text NULL,
  stripe_subscription_item_id text NULL,
  stripe_price_id text NULL,
  current_period_end timestamptz NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT copro_addons_unique_key UNIQUE (copropriete_id, addon_key),
  CONSTRAINT copro_addons_addon_key_check CHECK (addon_key ~ '^[a-z0-9_]+$'),
  CONSTRAINT copro_addons_status_check CHECK (status IN ('inactive', 'active', 'trialing', 'past_due', 'canceled')),
  CONSTRAINT copro_addons_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS copro_addons_copro_status_idx
  ON public.copro_addons (copropriete_id, status);

CREATE INDEX IF NOT EXISTS copro_addons_subscription_item_idx
  ON public.copro_addons (stripe_subscription_item_id);

ALTER TABLE public.copro_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read copro add-ons" ON public.copro_addons;
CREATE POLICY "Members can read copro add-ons"
  ON public.copro_addons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.coproprietaires cp
      WHERE cp.copropriete_id = copro_addons.copropriete_id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Syndics can insert copro add-ons" ON public.copro_addons;
CREATE POLICY "Syndics can insert copro add-ons"
  ON public.copro_addons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Syndics can update copro add-ons" ON public.copro_addons;
CREATE POLICY "Syndics can update copro add-ons"
  ON public.copro_addons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Syndics can delete copro add-ons" ON public.copro_addons;
CREATE POLICY "Syndics can delete copro add-ons"
  ON public.copro_addons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.coproprietes c
      WHERE c.id = copro_addons.copropriete_id
        AND c.syndic_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.set_copro_addons_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_copro_addons_updated_at ON public.copro_addons;
CREATE TRIGGER set_copro_addons_updated_at
  BEFORE UPDATE ON public.copro_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_copro_addons_updated_at();

CREATE OR REPLACE FUNCTION public.copro_has_active_addon(
  p_copropriete_id uuid,
  p_addon_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.copro_addons ca
    WHERE ca.copropriete_id = p_copropriete_id
      AND ca.addon_key = p_addon_key
      AND (
        ca.status IN ('active', 'trialing', 'past_due')
        OR (
          ca.cancel_at_period_end = true
          AND ca.current_period_end IS NOT NULL
          AND ca.current_period_end > timezone('utc', now())
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.try_parse_jsonb(p_value text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_value IS NULL OR btrim(p_value) = '' THEN
    RETURN NULL;
  END IF;

  RETURN p_value::jsonb;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.jsonb_uses_special_charge_scope(p_payload jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_payload IS NULL OR jsonb_typeof(p_payload) <> 'array' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_payload) AS item
      WHERE COALESCE(item->>'repartition_type', 'generale') = 'groupe'
         OR NULLIF(BTRIM(COALESCE(item->>'repartition_cible', '')), '') IS NOT NULL
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_charges_speciales_addon_for_lots()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_special_scope boolean;
  changes_special_scope boolean;
BEGIN
  has_special_scope := COALESCE(array_length(NEW.groupes_repartition, 1), 0) > 0
    OR COALESCE(NEW.tantiemes_groupes, '{}'::jsonb) <> '{}'::jsonb;

  changes_special_scope := TG_OP = 'INSERT'
    OR COALESCE(NEW.groupes_repartition, '{}'::text[]) <> COALESCE(OLD.groupes_repartition, '{}'::text[])
    OR COALESCE(NEW.tantiemes_groupes, '{}'::jsonb) <> COALESCE(OLD.tantiemes_groupes, '{}'::jsonb);

  IF has_special_scope
     AND changes_special_scope
     AND NOT public.copro_has_active_addon(NEW.copropriete_id, 'charges_speciales') THEN
    RAISE EXCEPTION 'L''option payante "Charges spéciales" doit être activée pour modifier les clés de répartition spéciales.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_charges_speciales_addon_for_lots ON public.lots;
CREATE TRIGGER ensure_charges_speciales_addon_for_lots
  BEFORE INSERT OR UPDATE ON public.lots
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_charges_speciales_addon_for_lots();

CREATE OR REPLACE FUNCTION public.ensure_charges_speciales_addon_for_depenses()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_special_scope boolean;
  changes_special_scope boolean;
BEGIN
  has_special_scope := COALESCE(NEW.repartition_type, 'generale') = 'groupe'
    OR NULLIF(BTRIM(COALESCE(NEW.repartition_cible, '')), '') IS NOT NULL;

  changes_special_scope := TG_OP = 'INSERT'
    OR COALESCE(NEW.repartition_type, 'generale') <> COALESCE(OLD.repartition_type, 'generale')
    OR COALESCE(NEW.repartition_cible, '') <> COALESCE(OLD.repartition_cible, '');

  IF has_special_scope
     AND changes_special_scope
     AND NOT public.copro_has_active_addon(NEW.copropriete_id, 'charges_speciales') THEN
    RAISE EXCEPTION 'L''option payante "Charges spéciales" doit être activée pour utiliser une répartition spéciale sur une dépense.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_charges_speciales_addon_for_depenses ON public.depenses;
CREATE TRIGGER ensure_charges_speciales_addon_for_depenses
  BEFORE INSERT OR UPDATE ON public.depenses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_charges_speciales_addon_for_depenses();

CREATE OR REPLACE FUNCTION public.ensure_charges_speciales_addon_for_resolutions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_copro_id uuid;
  has_special_scope boolean;
  changes_special_scope boolean;
BEGIN
  SELECT ag.copropriete_id
  INTO current_copro_id
  FROM public.assemblees_generales ag
  WHERE ag.id = NEW.ag_id;

  has_special_scope := public.jsonb_uses_special_charge_scope(COALESCE(NEW.budget_postes, '[]'::jsonb));
  changes_special_scope := TG_OP = 'INSERT'
    OR COALESCE(NEW.budget_postes, '[]'::jsonb) <> COALESCE(OLD.budget_postes, '[]'::jsonb);

  IF current_copro_id IS NOT NULL
     AND has_special_scope
     AND changes_special_scope
     AND NOT public.copro_has_active_addon(current_copro_id, 'charges_speciales') THEN
    RAISE EXCEPTION 'L''option payante "Charges spéciales" doit être activée pour enregistrer une résolution avec clé spéciale.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_charges_speciales_addon_for_resolutions ON public.resolutions;
CREATE TRIGGER ensure_charges_speciales_addon_for_resolutions
  BEFORE INSERT OR UPDATE ON public.resolutions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_charges_speciales_addon_for_resolutions();

CREATE OR REPLACE FUNCTION public.ensure_charges_speciales_addon_for_appels()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  has_special_scope boolean;
  changes_special_scope boolean;
BEGIN
  has_special_scope := public.jsonb_uses_special_charge_scope(public.try_parse_jsonb(NEW.description));
  changes_special_scope := TG_OP = 'INSERT'
    OR COALESCE(NEW.description, '') <> COALESCE(OLD.description, '');

  IF has_special_scope
     AND changes_special_scope
     AND NOT public.copro_has_active_addon(NEW.copropriete_id, 'charges_speciales') THEN
    RAISE EXCEPTION 'L''option payante "Charges spéciales" doit être activée pour créer un appel de fonds avec répartition spéciale.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_charges_speciales_addon_for_appels ON public.appels_de_fonds;
CREATE TRIGGER ensure_charges_speciales_addon_for_appels
  BEFORE INSERT OR UPDATE ON public.appels_de_fonds
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_charges_speciales_addon_for_appels();
