-- Date de fin de mandat du syndic désigné en AG (Art. 25 / Art. 25-1)
-- Nullable : uniquement renseigné pour les résolutions de type designation_syndic
ALTER TABLE public.resolutions
  ADD COLUMN IF NOT EXISTS date_fin_mandat date;
