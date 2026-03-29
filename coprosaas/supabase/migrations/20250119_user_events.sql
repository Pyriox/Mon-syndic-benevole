-- ============================================================
-- Migration : journal d'activité par utilisateur (user_events)
--
-- Permet d'enregistrer les événements clés du cycle de vie
-- d'un compte et de les afficher dans le backoffice admin.
--
-- event_type possibles :
--   'account_confirmed'      → email confirmé par l'utilisateur
--   'trial_started'          → essai Stripe démarré
--   'subscription_created'   → abonnement payant activé
--   'subscription_cancelled' → abonnement résilié (subscription.deleted)
--   'payment_failed'         → paiement échoué (invoice.payment_failed)
--
-- Accessible uniquement via service_role (aucune policy publique).
-- ============================================================

CREATE TABLE IF NOT EXISTS user_events (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email  text        NOT NULL,
  event_type  text        NOT NULL,
  label       text        NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS user_events_email_created_idx
  ON user_events (user_email, created_at DESC);

-- RLS activé mais aucune policy publique → accessible uniquement via service_role
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
