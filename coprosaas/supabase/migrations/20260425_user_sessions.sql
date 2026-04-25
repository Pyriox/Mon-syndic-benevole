-- ============================================================
-- Migration : sessions d'utilisation interne (user_sessions)
--
-- Objectif :
--   Mesurer la durée d'utilisation réelle, le nombre de sessions,
--   et relier chaque événement à la session dans laquelle il s'est
--   produit — sans dépendre de GA4.
--
-- Une "session" = période d'activité continue.
-- Elle se termine automatiquement après 30 min d'inactivité.
-- ============================================================

-- ── Table principale ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at       timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  ended_at         timestamptz,
  page_count       integer     NOT NULL DEFAULT 1
);

-- Sessions ouvertes (fin de session NULL) par utilisateur, tri récent
CREATE INDEX IF NOT EXISTS user_sessions_open_idx
  ON public.user_sessions (user_id, last_activity_at DESC)
  WHERE ended_at IS NULL;

-- Analyse historique par utilisateur
CREATE INDEX IF NOT EXISTS user_sessions_user_started_idx
  ON public.user_sessions (user_id, started_at DESC);

-- RLS activé, accessible uniquement via service_role
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_sessions IS
  'Sessions d''utilisation interne. Une session se ferme après 30 min d''inactivité.';
COMMENT ON COLUMN public.user_sessions.page_count IS
  'Nombre de pings reçus dans cette session (proxy du nombre de pages visitées).';

-- ── Relier user_events à la session ──────────────────────────
ALTER TABLE public.user_events
  ADD COLUMN IF NOT EXISTS session_id uuid
    REFERENCES public.user_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_events_session_idx
  ON public.user_events (session_id);

-- ── Fonction atomique : trouver ou créer une session ─────────
--
-- Comportement :
--   1. Si une session ouverte existe et que le dernier ping
--      remonte à moins de p_inactivity_gap → on la prolonge.
--   2. Si la session est expirée → on la ferme et on en crée une.
--   3. Si aucune session → on en crée une.
--
-- Retourne l'UUID de la session active.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_user_session(
  p_user_id        uuid,
  p_inactivity_gap interval DEFAULT '30 minutes'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id      uuid;
  v_last_activity   timestamptz;
BEGIN
  -- Verrouillage ligne pour éviter les sessions fantômes en cas de pings simultanés
  SELECT id, last_activity_at
    INTO v_session_id, v_last_activity
    FROM user_sessions
   WHERE user_id = p_user_id
     AND ended_at IS NULL
   ORDER BY last_activity_at DESC
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  -- Session active → prolonger
  IF v_session_id IS NOT NULL AND (now() - v_last_activity) < p_inactivity_gap THEN
    UPDATE user_sessions
       SET last_activity_at = now(),
           page_count       = page_count + 1
     WHERE id = v_session_id;
    RETURN v_session_id;
  END IF;

  -- Session expirée → la fermer proprement
  IF v_session_id IS NOT NULL THEN
    UPDATE user_sessions
       SET ended_at = v_last_activity + p_inactivity_gap
     WHERE id = v_session_id;
  END IF;

  -- Nouvelle session
  INSERT INTO user_sessions (user_id)
  VALUES (p_user_id)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

COMMENT ON FUNCTION public.upsert_user_session IS
  'Prolonge la session ouverte de l''utilisateur ou en crée une nouvelle si expirée. Retourne le session_id actif.';
