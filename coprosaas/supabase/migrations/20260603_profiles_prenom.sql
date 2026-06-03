-- ============================================================
-- Migration : Colonne profiles.prenom
--
-- Problème : le prénom est extrait via full_name.split(' ')[0]
-- ce qui retourne le nom de famille pour les utilisateurs dont
-- full_name commence par leur nom (convention "NOM Prénom").
--
-- Solution : stocker le prénom séparément dans profiles,
-- renseigné depuis raw_user_meta_data->>'prenom' (stocké à
-- l'inscription via formData.prenom).
-- ============================================================

-- 1. Ajouter la colonne (nullable pour compatibilité)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS prenom TEXT;

COMMENT ON COLUMN profiles.prenom IS
  'Prénom du syndic (stocké séparément pour éviter les ambiguïtés avec full_name).';

-- 2. Backfill depuis auth.users.raw_user_meta_data->>'prenom'
--    Priorité : user_metadata.prenom > first word of full_name
UPDATE profiles p
SET prenom = COALESCE(
  NULLIF(TRIM((u.raw_user_meta_data->>'prenom')::text), ''),
  NULLIF(TRIM(SPLIT_PART(p.full_name, ' ', 1)), '')
)
FROM auth.users u
WHERE u.id = p.id
  AND p.prenom IS NULL;

-- 3. Mettre à jour handle_new_user pour inclure prenom dès l'inscription
--    (remplace la version existante en ajoutant prenom dans l'INSERT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, prenom, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'prenom',
      SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1)
    )), ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'syndic')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      prenom    = COALESCE(EXCLUDED.prenom,    profiles.prenom),
      role      = COALESCE(EXCLUDED.role,      profiles.role);
  RETURN NEW;
END;
$$;
