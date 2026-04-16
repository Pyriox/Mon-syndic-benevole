-- ============================================================
-- Index sur les clés étrangères non couvertes (unindexed_foreign_keys).
-- On cible les colonnes utilisées dans des JOINs fréquents, les
-- politiques RLS, et les requêtes critiques. Les colonnes d'audit
-- (created_by, uploaded_by, declare_par) sont exclues volontairement
-- car elles ne sont pas sur le chemin critique.
-- ============================================================

-- ── coproprietes ──────────────────────────────────────────────
-- Utilisé dans TOUTES les politiques RLS (syndic_id = auth.uid()).
CREATE INDEX IF NOT EXISTS coproprietes_syndic_id_idx
  ON public.coproprietes (syndic_id);

-- ── assemblees_generales ──────────────────────────────────────
-- JOIN et WHERE copropriete_id dans toutes les requêtes AG.
CREATE INDEX IF NOT EXISTS assemblees_generales_copropriete_id_idx
  ON public.assemblees_generales (copropriete_id);

-- ── coproprietaires ───────────────────────────────────────────
-- user_id : utilisé dans get_user_copropriete_ids() (cœur des RLS).
-- L'index composite (copropriete_id, user_id) existant ne couvre pas
-- les lookups sur user_id seul.
CREATE INDEX IF NOT EXISTS coproprietaires_user_id_idx
  ON public.coproprietaires (user_id);

-- lot_id : JOIN lots ↔ coproprietaires.
CREATE INDEX IF NOT EXISTS coproprietaires_lot_id_idx
  ON public.coproprietaires (lot_id);

-- ── lots ──────────────────────────────────────────────────────
-- coproprietaire_id : lookup du lot principal d'un copropriétaire.
CREATE INDEX IF NOT EXISTS lots_coproprietaire_id_idx
  ON public.lots (coproprietaire_id);

-- ── resolutions ───────────────────────────────────────────────
-- ag_id : toutes les requêtes résolutions passent par ce filtre.
CREATE INDEX IF NOT EXISTS resolutions_ag_id_idx
  ON public.resolutions (ag_id);

-- ── repartitions_depenses ─────────────────────────────────────
-- Trois FK utilisées dans les JOINs de répartition.
CREATE INDEX IF NOT EXISTS repartitions_depenses_depense_id_idx
  ON public.repartitions_depenses (depense_id);

CREATE INDEX IF NOT EXISTS repartitions_depenses_coproprietaire_id_idx
  ON public.repartitions_depenses (coproprietaire_id);

CREATE INDEX IF NOT EXISTS repartitions_depenses_lot_id_idx
  ON public.repartitions_depenses (lot_id);

-- ── regularisation_lignes ─────────────────────────────────────
-- coproprietaire_id : lookup solde par copropriétaire.
CREATE INDEX IF NOT EXISTS regularisation_lignes_coproprietaire_id_idx
  ON public.regularisation_lignes (coproprietaire_id);

-- ── lignes_appels_de_fonds ────────────────────────────────────
-- lot_id : JOIN lignes ↔ lots pour affichage des appels par lot.
-- L'index composite (appel_de_fonds_id, paye) existant ne couvre pas lot_id seul.
CREATE INDEX IF NOT EXISTS lignes_appels_lot_id_idx
  ON public.lignes_appels_de_fonds (lot_id);

-- ── appels_de_fonds ───────────────────────────────────────────
-- ag_resolution_id : lien entre appel et résolution d'AG.
CREATE INDEX IF NOT EXISTS appels_de_fonds_ag_resolution_id_idx
  ON public.appels_de_fonds (ag_resolution_id);

-- ── ag_presences ──────────────────────────────────────────────
-- coproprietaire_id : lookup présences par copropriétaire.
CREATE INDEX IF NOT EXISTS ag_presences_coproprietaire_id_idx
  ON public.ag_presences (coproprietaire_id);

-- ── votes_coproprietaires ─────────────────────────────────────
-- coproprietaire_id : lookup votes par copropriétaire.
CREATE INDEX IF NOT EXISTS votes_coproprietaires_coproprietaire_id_idx
  ON public.votes_coproprietaires (coproprietaire_id);

-- ── invitations ───────────────────────────────────────────────
-- copropriete_id : filtrage des invitations par copropriété.
CREATE INDEX IF NOT EXISTS invitations_copropriete_id_idx
  ON public.invitations (copropriete_id);

-- ── documents ─────────────────────────────────────────────────
-- dossier_id : l'index composite (copropriete_id, dossier_id) existant
-- ne couvre pas les lookups FK standalone (ON DELETE CASCADE).
CREATE INDEX IF NOT EXISTS documents_dossier_id_idx
  ON public.documents (dossier_id);

-- ── document_dossiers ─────────────────────────────────────────
-- parent_id : navigation arborescente des dossiers.
-- L'index composite (syndic_id, parent_id, nom) ne couvre pas parent_id seul.
CREATE INDEX IF NOT EXISTS document_dossiers_parent_id_idx
  ON public.document_dossiers (parent_id);

-- ── email_deliveries ──────────────────────────────────────────
-- recipient_user_id : lookup emails par utilisateur dans l'observabilité.
CREATE INDEX IF NOT EXISTS email_deliveries_recipient_user_id_idx
  ON public.email_deliveries (recipient_user_id);

-- appel_de_fonds_id : JOIN email_deliveries ↔ appels_de_fonds.
CREATE INDEX IF NOT EXISTS email_deliveries_appel_de_fonds_id_idx
  ON public.email_deliveries (appel_de_fonds_id);

-- ── ag_presences ──────────────────────────────────────────────
-- represente_par_id : lookup pour savoir qui représente qui en AG.
CREATE INDEX IF NOT EXISTS ag_presences_represente_par_id_idx
  ON public.ag_presences (represente_par_id);

-- ── invitations ───────────────────────────────────────────────
-- lot_id : lien invitation ↔ lot assigné.
CREATE INDEX IF NOT EXISTS invitations_lot_id_idx
  ON public.invitations (lot_id);
