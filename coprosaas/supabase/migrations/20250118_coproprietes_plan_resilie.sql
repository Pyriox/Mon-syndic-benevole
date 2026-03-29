-- ============================================================
-- Migration : ajoute la valeur 'resilie' pour le champ plan
--             de la table coproprietes.
--
-- Valeurs du champ plan après cette migration :
--   NULL        → jamais souscrit, accès limité
--   'essai'     → période d'essai Stripe active (14 j)
--   'actif'     → abonnement payant actif
--   'inactif'   → n'a jamais souscrit ou remis à zéro par l'admin
--   'resilie'   → abonnement résilié ET période d'accès terminée
--                 (déclenché par le webhook customer.subscription.deleted)
--   'passe_du'  → paiement en retard
-- ============================================================

-- Aucune modification de schéma nécessaire : la colonne plan est de
-- type text sans contrainte CHECK. Cette migration documente le nouveau
-- statut 'resilie' et ne contient pas de changement rétroactif des données
-- existantes (les copies « inactif » antérieures à cette migration ne
-- peuvent pas être distinguées fiablement d'un reset admin).
SELECT 1;
