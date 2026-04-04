-- ============================================================
-- Différencie les incidents imprévus des travaux planifiés
-- ============================================================

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS nature TEXT NOT NULL DEFAULT 'incident';

UPDATE incidents
SET nature = 'incident'
WHERE nature IS NULL;

ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_nature_check;
ALTER TABLE incidents
  ADD CONSTRAINT incidents_nature_check
  CHECK (nature IN ('incident', 'travaux'));
