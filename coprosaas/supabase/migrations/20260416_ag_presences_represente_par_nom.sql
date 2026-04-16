-- Permet de saisir le nom d'un mandataire externe (non-copropriétaire)
-- Quand represente_par_nom est renseigné, represente_par_id est NULL (et vice-versa).
ALTER TABLE public.ag_presences
  ADD COLUMN IF NOT EXISTS represente_par_nom text;
