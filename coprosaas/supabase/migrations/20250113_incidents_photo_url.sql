-- Migration : ajout de la colonne photo_url sur incidents
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS photo_url TEXT;
