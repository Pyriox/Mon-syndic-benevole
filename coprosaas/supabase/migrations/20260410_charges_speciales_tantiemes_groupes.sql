-- Clés spéciales indépendantes par lot
-- Exemple : 39/1000 en charges générales mais 117/1000 pour le groupe "Bâtiment B"

ALTER TABLE lots
  ADD COLUMN IF NOT EXISTS tantiemes_groupes jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN lots.tantiemes_groupes IS
  'Map JSON des clés spéciales indépendantes par groupe, ex: {"Bâtiment B": 117, "Ascenseur B": 45}';
