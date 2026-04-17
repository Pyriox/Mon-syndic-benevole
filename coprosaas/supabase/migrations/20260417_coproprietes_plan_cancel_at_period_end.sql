-- Ajoute le champ plan_cancel_at_period_end sur coproprietes
-- pour indiquer qu'un abonnement actif ne se renouvellera pas automatiquement.
-- Ce champ est synchronisé depuis Stripe via le webhook customer.subscription.updated.

ALTER TABLE coproprietes
  ADD COLUMN IF NOT EXISTS plan_cancel_at_period_end boolean NOT NULL DEFAULT false;
