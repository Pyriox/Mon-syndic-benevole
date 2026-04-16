-- Fix "Function Search Path Mutable" warnings from Supabase Security Advisor.
-- Each function gets an explicit SET search_path to prevent schema injection.

-- ── Support tickets ──────────────────────────────────────────────────────────

-- Simple trigger: no external table references, safe with empty search_path.
ALTER FUNCTION public.update_support_ticket_updated_at() SET search_path = '';

-- This function references support_tickets without schema prefix, so we must
-- recreate it with a fully-qualified table name instead of just ALTER FUNCTION.
CREATE OR REPLACE FUNCTION public.bump_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.support_tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

-- ── Email deliveries ─────────────────────────────────────────────────────────

ALTER FUNCTION public.set_email_deliveries_updated_at() SET search_path = '';

-- ── Copro addons & charges spéciales ─────────────────────────────────────────

-- All these functions already use fully-qualified public.* references.
ALTER FUNCTION public.set_copro_addons_updated_at() SET search_path = '';
ALTER FUNCTION public.copro_has_active_addon(uuid, text) SET search_path = '';
ALTER FUNCTION public.try_parse_jsonb(text) SET search_path = '';
ALTER FUNCTION public.jsonb_uses_special_charge_scope(jsonb) SET search_path = '';
ALTER FUNCTION public.ensure_charges_speciales_addon_for_lots() SET search_path = '';
ALTER FUNCTION public.ensure_charges_speciales_addon_for_depenses() SET search_path = '';
ALTER FUNCTION public.ensure_charges_speciales_addon_for_resolutions() SET search_path = '';
ALTER FUNCTION public.ensure_charges_speciales_addon_for_appels() SET search_path = '';

-- ── handle_new_user ───────────────────────────────────────────────────────────
-- This function was created directly in Supabase (not tracked locally).
-- We use SET search_path = 'public' to keep existing unqualified references
-- working while eliminating the mutable search_path warning.
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
