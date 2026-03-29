-- ============================================================
-- Migration : enrichissement de user_events
--
-- Ajoute deux colonnes optionnelles pour un suivi support précis :
--
--   metadata  (jsonb)  — données contextuelles libres (copropriete_id,
--                         montant, plan, nb, erreur…).  Ne casse aucun
--                         insert existant (DEFAULT null).
--   severity  (text)   — niveau d'importance : 'info' | 'warning' | 'error'
--                         DEFAULT 'info'. Utile pour filtrer en admin.
-- ============================================================

ALTER TABLE user_events
  ADD COLUMN IF NOT EXISTS metadata jsonb       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS severity text        NOT NULL DEFAULT 'info';

-- Contrainte légère : valeurs autorisées
ALTER TABLE user_events
  DROP CONSTRAINT IF EXISTS user_events_severity_check;

ALTER TABLE user_events
  ADD CONSTRAINT user_events_severity_check
    CHECK (severity IN ('info', 'warning', 'error'));

-- Index pour filtrage admin par sévérité
CREATE INDEX IF NOT EXISTS user_events_severity_idx
  ON user_events (severity);

COMMENT ON COLUMN user_events.metadata IS
  'Données contextuelles libres (copropriete_id, plan, montant, nb_lots, etc.) — JSONB.';
COMMENT ON COLUMN user_events.severity IS
  '''info'' par défaut. ''warning'' pour dégradations, ''error'' pour échecs bloquants.';
