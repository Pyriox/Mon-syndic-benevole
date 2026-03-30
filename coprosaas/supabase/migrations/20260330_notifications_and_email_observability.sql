-- ============================================================
-- Notifications persistantes + Observabilite email + Preuves
-- ============================================================

-- -----------------------------------------------------------------
-- 1) Centre de notifications in-app persistant
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  copropriete_id uuid NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'danger')),
  title text NOT NULL,
  body text NULL,
  href text NOT NULL DEFAULT '/dashboard',
  action_label text NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_notifications_user_read_created_idx
  ON app_notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS app_notifications_copro_created_idx
  ON app_notifications (copropriete_id, created_at DESC);

ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_notifications'
      AND policyname = 'app_notifications_select_own'
  ) THEN
    CREATE POLICY app_notifications_select_own
      ON app_notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_notifications'
      AND policyname = 'app_notifications_update_own'
  ) THEN
    CREATE POLICY app_notifications_update_own
      ON app_notifications FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Ecriture reservee au service role (pas de policy INSERT/DELETE publique)

COMMENT ON TABLE app_notifications IS 'Centre de notifications in-app persistant (historique, lu/non lu, actionnable).';

-- -----------------------------------------------------------------
-- 2) Observabilite et preuves de delivrabilite email
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'resend',
  provider_message_id text NULL UNIQUE,
  template_key text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL CHECK (
    status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')
  ),

  recipient_email text NOT NULL,
  recipient_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  copropriete_id uuid NULL REFERENCES coproprietes(id) ON DELETE CASCADE,
  ag_id uuid NULL REFERENCES assemblees_generales(id) ON DELETE SET NULL,
  appel_de_fonds_id uuid NULL REFERENCES appels_de_fonds(id) ON DELETE SET NULL,

  subject text NULL,
  legal_event_type text NULL,
  legal_reference text NULL,

  sent_at timestamptz NULL,
  delivered_at timestamptz NULL,
  opened_at timestamptz NULL,
  clicked_at timestamptz NULL,
  bounced_at timestamptz NULL,
  complained_at timestamptz NULL,
  failed_at timestamptz NULL,

  bounce_reason text NULL,
  complaint_reason text NULL,
  last_error text NULL,

  retry_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz NULL,
  retry_last_attempt_at timestamptz NULL,
  reminder_unopened_at timestamptz NULL,

  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES email_deliveries(id) ON DELETE CASCADE,
  provider_event text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS email_deliveries_status_retry_idx
  ON email_deliveries (status, next_retry_at);

CREATE INDEX IF NOT EXISTS email_deliveries_ag_template_idx
  ON email_deliveries (ag_id, template_key, created_at DESC);

CREATE INDEX IF NOT EXISTS email_deliveries_copro_created_idx
  ON email_deliveries (copropriete_id, created_at DESC);

CREATE INDEX IF NOT EXISTS email_deliveries_recipient_created_idx
  ON email_deliveries (recipient_email, created_at DESC);

CREATE INDEX IF NOT EXISTS email_delivery_events_delivery_occured_idx
  ON email_delivery_events (delivery_id, occurred_at DESC);

ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_events ENABLE ROW LEVEL SECURITY;

-- Acces lecture pour le syndic de la copropriete concernee
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_deliveries'
      AND policyname = 'email_deliveries_select_syndic'
  ) THEN
    CREATE POLICY email_deliveries_select_syndic
      ON email_deliveries FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM coproprietes c
          WHERE c.id = email_deliveries.copropriete_id
            AND c.syndic_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_delivery_events'
      AND policyname = 'email_delivery_events_select_syndic'
  ) THEN
    CREATE POLICY email_delivery_events_select_syndic
      ON email_delivery_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM email_deliveries d
          JOIN coproprietes c ON c.id = d.copropriete_id
          WHERE d.id = email_delivery_events.delivery_id
            AND c.syndic_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Ecriture reservee au service role

COMMENT ON TABLE email_deliveries IS 'Preuves d''envoi et de delivrabilite email (qui, quand, statut de remise).';
COMMENT ON TABLE email_delivery_events IS 'Journal des evenements provider (delivered/opened/bounced/etc.).';

-- -----------------------------------------------------------------
-- 3) Automatisation AG (jalons)
-- -----------------------------------------------------------------
ALTER TABLE assemblees_generales
  ADD COLUMN IF NOT EXISTS convocation_rappel_j14_at timestamptz,
  ADD COLUMN IF NOT EXISTS convocation_rappel_j7_at timestamptz,
  ADD COLUMN IF NOT EXISTS preuve_synthese_envoyee_at timestamptz;

CREATE INDEX IF NOT EXISTS ag_convocation_rappel_idx
  ON assemblees_generales (date_ag, convocation_envoyee_le, convocation_rappel_j14_at, convocation_rappel_j7_at);

-- Trigger updated_at pour email_deliveries
CREATE OR REPLACE FUNCTION set_email_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_deliveries_updated_at ON email_deliveries;
CREATE TRIGGER trg_email_deliveries_updated_at
BEFORE UPDATE ON email_deliveries
FOR EACH ROW
EXECUTE FUNCTION set_email_deliveries_updated_at();
