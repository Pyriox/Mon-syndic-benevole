-- Ajoute le champ "complément d'adresse" (facultatif) à la table coproprietaires
ALTER TABLE coproprietaires
  ADD COLUMN IF NOT EXISTS complement_adresse text;
