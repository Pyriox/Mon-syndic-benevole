-- =============================================================
-- Backfill coproprietaire_balance_events
-- Pour les appels de fonds publiés et les paiements reçus
-- antérieurs à la mise en place du journal (20260411).
--
-- Stratégie :
--   1. Rassembler les deltas non tracés (appel_publication + payment_received)
--   2. Les ordonner chronologiquement par copropriétaire
--   3. Calculer balance_before / balance_after en remontant
--      depuis le solde actuel (déjà correct — on insère uniquement les événements)
-- =============================================================

WITH untracked_appel AS (
  SELECT
    l.id                                                            AS ligne_id,
    l.coproprietaire_id,
    a.id                                                            AS appel_id,
    a.copropriete_id,
    ROUND((l.montant_du - COALESCE(l.regularisation_ajustement, 0))::numeric, 2) AS delta,
    'Publication d''appel de fonds — ' || a.titre                  AS label,
    'appel_publication'::text                                       AS source_type,
    a.id                                                            AS source_id,
    COALESCE(a.date_echeance::timestamptz, a.created_at)            AS sort_ts,
    COALESCE(a.date_echeance, a.created_at::date)                   AS event_date,
    a.created_at,
    CASE
      WHEN a.type_appel = 'fonds_travaux'       THEN 'fonds_travaux'
      WHEN COALESCE(a.montant_fonds_travaux, 0) > 0 THEN 'mixte'
      ELSE 'principal'
    END::text                                                       AS account_type,
    jsonb_build_object(
      'appelId', a.id,
      'ligneId', l.id,
      'montantDu', l.montant_du,
      'regularisationAjustement', COALESCE(l.regularisation_ajustement, 0),
      'backfilled', true
    )                                                               AS metadata
  FROM public.lignes_appels_de_fonds l
  JOIN public.appels_de_fonds         a ON a.id = l.appel_de_fonds_id
  WHERE a.statut IN ('publie', 'cloture')
    AND NOT EXISTS (
      SELECT 1
      FROM   public.coproprietaire_balance_events e
      WHERE  e.coproprietaire_id = l.coproprietaire_id
        AND  e.source_id         = a.id
        AND  e.source_type       = 'appel_publication'
    )
),

untracked_payment AS (
  SELECT
    l.id                                                            AS ligne_id,
    l.coproprietaire_id,
    a.id                                                            AS appel_id,
    a.copropriete_id,
    -ROUND(l.montant_du::numeric, 2)                               AS delta,
    'Paiement reçu — ' || a.titre                                  AS label,
    'payment_received'::text                                        AS source_type,
    a.id                                                            AS source_id,
    COALESCE(l.date_paiement::timestamptz, a.created_at)            AS sort_ts,
    COALESCE(l.date_paiement, a.created_at::date)                   AS event_date,
    a.created_at,
    CASE
      WHEN a.type_appel = 'fonds_travaux'       THEN 'fonds_travaux'
      WHEN COALESCE(a.montant_fonds_travaux, 0) > 0 THEN 'mixte'
      ELSE 'principal'
    END::text                                                       AS account_type,
    jsonb_build_object(
      'appelId', a.id,
      'ligneId', l.id,
      'montantDu', l.montant_du,
      'datePaiement', l.date_paiement,
      'backfilled', true
    )                                                               AS metadata
  FROM public.lignes_appels_de_fonds l
  JOIN public.appels_de_fonds         a ON a.id = l.appel_de_fonds_id
  WHERE l.paye = true
    AND NOT EXISTS (
      SELECT 1
      FROM   public.coproprietaire_balance_events e
      WHERE  e.coproprietaire_id = l.coproprietaire_id
        AND  e.source_id         = a.id
        AND  e.source_type       = 'payment_received'
    )
),

all_untracked AS (
  SELECT * FROM untracked_appel
  UNION ALL
  SELECT * FROM untracked_payment
),

-- Pour chaque événement non tracé, on reconstruit balance_before/after.
-- Formule (démonstration) :
--   pre_balance     = solde_actuel - sum(tous les deltas non tracés du copropriétaire)
--   balance_after   = pre_balance + cumul_des_deltas_jusqu_à_cet_événement_inclus
--   balance_before  = balance_after - delta
-- → le dernier événement aura balance_after = solde_actuel  ✓
ordered AS (
  SELECT
    u.*,
    cp.solde                                                        AS current_solde,
    -- somme totale des deltas non tracés pour ce copropriétaire
    SUM(u.delta) OVER (
      PARTITION BY u.coproprietaire_id
    )                                                               AS total_untracked_delta,
    -- cumul croissant (du plus ancien au plus récent)
    SUM(u.delta) OVER (
      PARTITION BY u.coproprietaire_id
      ORDER BY u.sort_ts ASC, u.source_type DESC, u.ligne_id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )                                                               AS cumulative_delta
  FROM all_untracked u
  JOIN public.coproprietaires cp ON cp.id = u.coproprietaire_id
)

INSERT INTO public.coproprietaire_balance_events (
  copropriete_id,
  coproprietaire_id,
  event_date,
  source_type,
  account_type,
  label,
  reason,
  amount,
  balance_before,
  balance_after,
  source_id,
  metadata,
  created_at
)
SELECT
  copropriete_id,
  coproprietaire_id,
  event_date,
  source_type,
  account_type,
  label,
  'Reconstitué automatiquement (historique antérieur au journal de soldes)'::text AS reason,
  delta                                                                            AS amount,
  -- balance_before = pre_balance + cumul - delta
  ROUND((current_solde - total_untracked_delta) + cumulative_delta - delta, 2)   AS balance_before,
  -- balance_after  = pre_balance + cumul
  ROUND((current_solde - total_untracked_delta) + cumulative_delta,         2)   AS balance_after,
  source_id,
  metadata,
  sort_ts                                                                          AS created_at
FROM ordered
ORDER BY coproprietaire_id, sort_ts ASC;
