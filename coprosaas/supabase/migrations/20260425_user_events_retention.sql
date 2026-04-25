-- ============================================================
-- Migration : politique de rétention pour user_events
--
-- Événements purgés après 12 mois (opérationnels, volume élevé) :
--   copropriete_*, appel_fonds_*, ag_*, coproprietaire_*, lot_*,
--   document_*, ticket_created
--
-- Événements conservés indéfiniment (audit / billing) :
--   billing  : trial_started, subscription_created, subscription_cancelled,
--              payment_succeeded, payment_failed
--   account  : account_confirmed, user_registered, password_reset_requested,
--              login_success, login_failed, email_confirmation_resent
--   admin    : admin_*
-- ============================================================

-- Index partiel pour accélérer les purges périodiques
CREATE INDEX IF NOT EXISTS user_events_created_event_type_idx
  ON public.user_events (created_at, event_type);

-- Fonction appelée par le cron de purge (via /api/cron/purge-user-events)
CREATE OR REPLACE FUNCTION public.purge_old_activity_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.user_events
  WHERE created_at < now() - INTERVAL '12 months'
    AND event_type IN (
      'copropriete_created', 'copropriete_updated',
      'appel_fonds_created', 'appel_fonds_status_changed', 'appel_fonds_deleted',
      'ag_created', 'ag_status_changed',
      'coproprietaire_added', 'coproprietaire_updated', 'coproprietaire_deleted',
      'lot_added', 'lot_updated', 'lot_deleted',
      'document_added', 'document_updated', 'document_deleted',
      'ticket_created'
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Purge initiale
SELECT public.purge_old_activity_events();
