-- Champs spécifiques aux résolutions de type "travaux"
-- montant_travaux : montant total estimé/voté des travaux (€)
-- devis_url       : chemin dans le bucket storage (documents) du devis joint (optionnel)
ALTER TABLE public.resolutions
  ADD COLUMN IF NOT EXISTS montant_travaux numeric,
  ADD COLUMN IF NOT EXISTS devis_url text;
