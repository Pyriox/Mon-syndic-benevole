-- ============================================================
-- Migration : système de tickets support
-- Tables : support_tickets, support_messages
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email  text NOT NULL,
  user_name   text NOT NULL,
  subject     text NOT NULL,
  status      text NOT NULL DEFAULT 'ouvert'
              CHECK (status IN ('ouvert', 'en_cours', 'resolu')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author     text NOT NULL CHECK (author IN ('client', 'admin')),
  content    text NOT NULL CHECK (char_length(content) <= 10000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Index ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx  ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx   ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_updated_idx  ON support_tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS support_messages_ticket_idx  ON support_messages(ticket_id, created_at);

-- ── Trigger updated_at ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_support_ticket_updated_at ON support_tickets;
CREATE TRIGGER trigger_support_ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_support_ticket_updated_at();

-- Trigger pour bumper updated_at sur le ticket quand un message est ajouté
CREATE OR REPLACE FUNCTION bump_ticket_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE support_tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_bump_ticket_on_message ON support_messages;
CREATE TRIGGER trigger_bump_ticket_on_message
  AFTER INSERT ON support_messages
  FOR EACH ROW EXECUTE FUNCTION bump_ticket_updated_at();

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE support_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Utilisateurs authentifiés : voient uniquement leurs tickets
CREATE POLICY support_tickets_select_own ON support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Utilisateurs : peuvent créer un ticket (user_id forcé = auth.uid() ici)
CREATE POLICY support_tickets_insert_own ON support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Messages : lecture des messages de ses propres tickets
CREATE POLICY support_messages_select_own ON support_messages
  FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

-- Messages : le client peut écrire dans ses tickets (author forcé côté API)
CREATE POLICY support_messages_insert_client ON support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author = 'client'
    AND ticket_id IN (
      SELECT id FROM support_tickets WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE support_tickets IS 'Tickets de support créés depuis la page Aide & Contact';
COMMENT ON TABLE support_messages IS 'Messages d''une conversation de ticket support';
