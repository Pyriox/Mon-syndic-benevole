-- Ajoute le champ rappel_brouillon_at à appels_de_fonds
-- Utilisé par le cron quotidien pour envoyer un rappel au syndic
-- si un appel de fonds reste en brouillon depuis plus de 3 jours.
-- Un seul rappel est envoyé par appel (idempotence via IS NULL).
ALTER TABLE appels_de_fonds
  ADD COLUMN IF NOT EXISTS rappel_brouillon_at timestamptz;
