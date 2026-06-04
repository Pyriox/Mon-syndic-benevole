-- Migration : ajout de la colonne unsubscribe_marketing sur profiles
-- Nécessaire pour respecter l'obligation légale de désabonnement des e-mails
-- commerciaux (LCEN art. L.34-5, RGPD art. 7 & 21).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS unsubscribe_marketing BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.unsubscribe_marketing IS
  'Si true, l''utilisateur a demandé à ne plus recevoir les e-mails marketing / rétention (onboarding, churn, checkout abandon, cancel renewal). Ne concerne pas les e-mails transactionnels ni les notifications critiques.';

-- Index pour les crons qui filtrent les destinataires
CREATE INDEX IF NOT EXISTS idx_profiles_unsubscribe_marketing
  ON profiles (unsubscribe_marketing)
  WHERE unsubscribe_marketing = true;
