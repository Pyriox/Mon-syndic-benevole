-- ============================================================
-- Tracking des envois email sur les assemblées générales
-- Colonnes utilisées par les composants client pour mémoriser
-- la date du dernier envoi de convocation / PV.
-- Note : peuvent déjà exister dans le schéma initial — IF NOT EXISTS est sans effet.
-- ============================================================

ALTER TABLE assemblees_generales
  ADD COLUMN IF NOT EXISTS convocation_envoyee_le timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pv_envoye_le            timestamptz DEFAULT NULL;

COMMENT ON COLUMN assemblees_generales.convocation_envoyee_le IS 'Date du dernier envoi de la convocation par email (null = jamais envoyée)';
COMMENT ON COLUMN assemblees_generales.pv_envoye_le           IS 'Date du dernier envoi du PV par email (null = jamais envoyé)';
