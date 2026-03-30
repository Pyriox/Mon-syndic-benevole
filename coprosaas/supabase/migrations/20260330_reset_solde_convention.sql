-- ============================================================
-- Migration : Remise à zéro des soldes avec nouvelle convention
-- ============================================================
-- Ancienne convention : solde positif = paiements reçus (cumul)
-- Nouvelle convention : solde positif = copropriétaire DOIT de l'argent
--                       solde négatif = copropriétaire est en crédit
--
-- La formule correcte à l'instant T :
--   solde = somme des montant_du impayés (appels publiés/confirmés)
--         + solde résiduel des régularisations clôturées
-- ============================================================

UPDATE coproprietaires AS c
SET solde = (
  -- (1) Obligations impayées issues des appels de fonds actifs
  COALESCE((
    SELECT SUM(l.montant_du)
    FROM lignes_appels_de_fonds l
    JOIN appels_de_fonds a ON a.id = l.appel_de_fonds_id
    WHERE l.coproprietaire_id = c.id
      AND l.paye = false
      AND a.statut IN ('publie', 'confirme')
  ), 0)

  -- (2) Balance des régularisations clôturées non encore compensée
  --     balance > 0 = complément dû  (s'additionne)
  --     balance < 0 = trop-perçu     (se soustrait)
  + COALESCE((
    SELECT SUM(rl.balance)
    FROM regularisation_lignes rl
    JOIN exercices e ON e.id = rl.exercice_id
    WHERE rl.coproprietaire_id = c.id
      AND e.statut = 'cloture'
  ), 0)
);
