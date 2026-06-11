-- ============================================================
-- Migration : index pour le cron de suppression des comptes dormants
--
-- Le cron GET /api/cron/dormant-accounts interroge user_events par
-- event_type + user_email pour l'idempotence des avertissements.
-- Un index partiel sur ces deux colonnes optimise cette requête.
-- ============================================================

-- Index partiel : récupération rapide des événements dormance par email
CREATE INDEX IF NOT EXISTS idx_user_events_dormant_warning
  ON user_events (user_email, event_type)
  WHERE event_type IN ('dormant_account_warning_sent', 'dormant_account_deleted');

COMMENT ON INDEX idx_user_events_dormant_warning IS
  'Optimise le cron dormant-accounts : idempotence des avertissements et suppressions.';
