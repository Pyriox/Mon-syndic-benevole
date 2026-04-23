-- ============================================================
-- Migration : rattacher user_events à auth.users via user_id
--
-- Objectifs :
-- - exclure proprement les admins par user_id dans les agrégats admin
-- - fiabiliser les événements métier même si l'email change
-- - conserver la compatibilité avec l'historique basé sur user_email
-- ============================================================

ALTER TABLE public.user_events
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_events_user_created_idx
  ON public.user_events (user_id, created_at DESC);

UPDATE public.user_events AS ue
SET user_id = au.id
FROM auth.users AS au
WHERE ue.user_id IS NULL
  AND lower(coalesce(au.email, '')) = lower(coalesce(ue.user_email, ''));

COMMENT ON COLUMN public.user_events.user_id IS
  'Utilisateur authentifié rattaché à l’événement quand il est connu. Utilisé pour fiabiliser les agrégats admin.';