-- ============================================================
-- Migration : colonne client_read sur support_messages
-- Permet de savoir si le client a lu les réponses de l'admin
-- ============================================================

ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS client_read boolean NOT NULL DEFAULT false;

-- Les messages déjà écrits par le client sont considérés comme lus
UPDATE support_messages SET client_read = true WHERE author = 'client';

COMMENT ON COLUMN support_messages.client_read IS
  'true si le client a lu ce message. Toujours true pour author=client.';
