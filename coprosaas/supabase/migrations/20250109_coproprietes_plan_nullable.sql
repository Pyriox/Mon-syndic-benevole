-- ============================================================
-- Migration : corrige les copropriétés avec plan='essai' sans abonnement Stripe
--
-- Contexte :
--   Le code admin (reset_subscription) mettait plan='essai' même quand
--   aucun abonnement Stripe n'était actif. Or isSubscribed('essai') = true,
--   ce qui accordait un accès complet sans paiement.
--
-- Valeurs attendues :
--   NULL / 'inactif' → accès limité (isSubscribed = false)
--   'essai'          → période d'essai Stripe active (isSubscribed = true)
--   'actif'          → abonnement payant actif (isSubscribed = true)
--   'passe_du'       → paiement en retard (isSubscribed = false)
-- ============================================================

-- Corriger les copropriétés marquées 'essai' sans abonnement Stripe actif
UPDATE coproprietes
SET plan = 'inactif'
WHERE plan = 'essai'
  AND stripe_subscription_id IS NULL;
