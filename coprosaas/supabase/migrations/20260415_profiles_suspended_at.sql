-- Migration : suspension de compte (soft-disable)
-- Ajoute suspended_at sur profiles pour garder une trace de la suspension.
-- La désactivation effective est gérée via ban_duration de Supabase Auth.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN profiles.suspended_at IS
  'Horodatage de la suspension du compte par un admin. NULL = compte actif.';
