-- ============================================================
-- Migration : anti-abus période d'essai
-- Ajoute trial_used sur profiles pour empêcher un utilisateur
-- de recréer des copropriétés pour bénéficier de multiples essais.
-- Marqué à true lors du premier checkout.session.completed.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN profiles.trial_used IS
  'True si cet utilisateur a déjà activé une période d''essai Stripe. Empêche les abus par recréation de copropriété.';
