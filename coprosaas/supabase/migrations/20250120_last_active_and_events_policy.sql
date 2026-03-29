-- ============================================================
-- Migration : last_active_at sur profiles + policy INSERT user_events
--
-- 1. last_active_at : date de dernière activité de l'utilisateur
--    (mis à jour à chaque chargement du dashboard, via after())
--
-- 2. Politique RLS INSERT sur user_events : permet aux utilisateurs
--    connectés d'insérer leurs propres événements (client-side actions)
--    depuis les composants React (copropriétaire ajouté, AG créée, etc.)
-- ============================================================

-- 1. Colonne last_active_at sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

COMMENT ON COLUMN profiles.last_active_at IS
  'Dernière activité connue de l''utilisateur (chargement du dashboard). Mis à jour non-bloquant via after().';

-- 2. Utilisateurs authentifiés peuvent insérer leurs propres events
CREATE POLICY "auth_users_insert_own_events"
  ON user_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_email = lower(auth.email()));
