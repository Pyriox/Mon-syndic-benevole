-- ============================================================
-- Migration : ajout colonne copropriete_id dans user_events
--
-- Permet de distinguer les événements liés à une copropriété
-- (appels, AG, lots, documents, paiements…) des événements
-- purement utilisateur (compte, facturation, admin).
-- ============================================================

ALTER TABLE public.user_events
  ADD COLUMN IF NOT EXISTS copropriete_id UUID REFERENCES public.coproprietes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_events_copropriete_id_idx
  ON public.user_events (copropriete_id)
  WHERE copropriete_id IS NOT NULL;
