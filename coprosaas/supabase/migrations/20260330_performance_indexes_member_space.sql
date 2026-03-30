-- Performance indexes for member space high-frequency queries
-- Safe to run multiple times with IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS incidents_copro_statut_date_idx
  ON incidents(copropriete_id, statut, date_declaration DESC);

CREATE INDEX IF NOT EXISTS depenses_copro_date_idx
  ON depenses(copropriete_id, date_depense DESC);

CREATE INDEX IF NOT EXISTS appels_de_fonds_copro_date_statut_idx
  ON appels_de_fonds(copropriete_id, date_echeance, statut);

CREATE INDEX IF NOT EXISTS lignes_appels_coproprietaire_paye_idx
  ON lignes_appels_de_fonds(coproprietaire_id, paye);

CREATE INDEX IF NOT EXISTS lignes_appels_appel_paye_idx
  ON lignes_appels_de_fonds(appel_de_fonds_id, paye);

CREATE INDEX IF NOT EXISTS coproprietaires_copro_user_idx
  ON coproprietaires(copropriete_id, user_id);

CREATE INDEX IF NOT EXISTS coproprietaires_copro_email_idx
  ON coproprietaires(copropriete_id, email);

CREATE INDEX IF NOT EXISTS documents_copro_dossier_created_idx
  ON documents(copropriete_id, dossier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS document_dossiers_syndic_parent_nom_idx
  ON document_dossiers(syndic_id, parent_id, nom);
