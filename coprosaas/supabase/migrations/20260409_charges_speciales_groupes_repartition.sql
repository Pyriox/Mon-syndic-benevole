-- Support simple des charges spéciales : bâtiments + groupes de répartition optionnels par lot
-- Objectif MVP : permettre un budget unique voté en AG, avec des sous-lignes
-- réparties soit en charges communes, soit sur un sous-ensemble de lots.

ALTER TABLE lots
  ADD COLUMN IF NOT EXISTS batiment text NULL;

ALTER TABLE lots
  ADD COLUMN IF NOT EXISTS groupes_repartition text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS lots_copropriete_batiment_idx
  ON lots (copropriete_id, batiment);

CREATE INDEX IF NOT EXISTS lots_groupes_repartition_gin_idx
  ON lots USING gin (groupes_repartition);

ALTER TABLE depenses
  ADD COLUMN IF NOT EXISTS repartition_type text NOT NULL DEFAULT 'generale';

ALTER TABLE depenses
  ADD COLUMN IF NOT EXISTS repartition_cible text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'depenses_repartition_type_check'
  ) THEN
    ALTER TABLE depenses
      ADD CONSTRAINT depenses_repartition_type_check
      CHECK (repartition_type IN ('generale', 'groupe'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS depenses_repartition_scope_idx
  ON depenses (copropriete_id, repartition_type, repartition_cible);
