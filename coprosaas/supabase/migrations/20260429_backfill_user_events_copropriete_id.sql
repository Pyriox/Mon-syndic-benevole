-- ============================================================
-- Backfill : renseigne copropriete_id sur les événements
--            d'activité copropriété antérieurs à la migration.
--
-- Stratégie :
--   1. Les events contenant metadata->>'coproId' (UUID valide) sont
--      directement mis à jour avec cette valeur.
--   2. Pour les events sans coproId dans metadata, on tente de
--      retrouver la copropriété via user_email = syndic_id
--      (uniquement si l'utilisateur n'a qu'une seule copropriété).
--
-- Idempotent : ne touche que les lignes où copropriete_id IS NULL.
-- ============================================================

-- Étape 1 : events avec coproId dans metadata (UUID valide)
UPDATE public.user_events ue
SET copropriete_id = (ue.metadata->>'coproId')::uuid
WHERE ue.copropriete_id IS NULL
  AND ue.event_type IN (
    'copropriete_created', 'copropriete_updated',
    'appel_fonds_created', 'appel_fonds_status_changed', 'appel_fonds_deleted',
    'ag_created', 'ag_status_changed',
    'coproprietaire_added', 'coproprietaire_updated', 'coproprietaire_deleted',
    'lot_added', 'lot_updated', 'lot_deleted',
    'document_added', 'document_updated', 'document_deleted',
    'paiement_confirme', 'paiement_annule'
  )
  AND ue.metadata->>'coproId' IS NOT NULL
  AND (ue.metadata->>'coproId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  -- Vérification que la copropriété existe réellement
  AND EXISTS (
    SELECT 1 FROM public.coproprietes c WHERE c.id = (ue.metadata->>'coproId')::uuid
  );

-- Étape 2 : events encore sans copropriete_id, pour les syndics
--           ayant une seule copropriété (cas fréquent en early stage)
UPDATE public.user_events ue
SET copropriete_id = sub.copropriete_id
FROM (
  SELECT
    ue2.id AS event_id,
    c.id   AS copropriete_id
  FROM public.user_events ue2
  JOIN auth.users au ON au.email = ue2.user_email
  -- Seulement les utilisateurs ayant exactement une copropriété
  JOIN public.coproprietes c ON c.syndic_id = au.id
  WHERE ue2.copropriete_id IS NULL
    AND ue2.event_type IN (
      'copropriete_updated',
      'appel_fonds_created', 'appel_fonds_status_changed', 'appel_fonds_deleted',
      'ag_created', 'ag_status_changed',
      'coproprietaire_added', 'coproprietaire_updated', 'coproprietaire_deleted',
      'lot_added', 'lot_updated', 'lot_deleted',
      'document_added', 'document_updated', 'document_deleted',
      'paiement_confirme', 'paiement_annule',
      'depense_created', 'depense_updated', 'depense_deleted'
    )
    -- N'agir que si l'utilisateur n'a qu'une seule copropriété
    -- (évite toute attribution erronée sur les comptes multi-copros)
    AND (
      SELECT COUNT(*)
      FROM public.coproprietes c2
      WHERE c2.syndic_id = au.id
    ) = 1
) sub
WHERE ue.id = sub.event_id;

-- Étape 3 : ag_created — matcher via le titre de l'AG et la proximité temporelle (± 5 min)
-- Gère les utilisateurs multi-copropriétés en joinant sur assemblees_generales
UPDATE public.user_events ue
SET copropriete_id = ag.copropriete_id
FROM public.assemblees_generales ag
WHERE ue.copropriete_id IS NULL
  AND ue.event_type = 'ag_created'
  AND ue.label = 'AG créée — ' || ag.titre
  AND ABS(EXTRACT(EPOCH FROM (ue.created_at - ag.created_at))) < 300
  -- Vérification que le user est bien le syndic de cette copropriété
  AND EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.coproprietes c ON c.syndic_id = au.id
    WHERE au.email = ue.user_email
      AND c.id = ag.copropriete_id
  );

-- Étape 4 : appel_fonds_created — matcher via le titre et la proximité temporelle (± 10 min)
-- Le label est du type "N appel(s) de fonds créé(s) — {titre}"
UPDATE public.user_events ue
SET copropriete_id = adf.copropriete_id
FROM public.appels_de_fonds adf
WHERE ue.copropriete_id IS NULL
  AND ue.event_type = 'appel_fonds_created'
  AND ue.label LIKE '% — ' || adf.titre
  AND ABS(EXTRACT(EPOCH FROM (ue.created_at - adf.created_at))) < 600
  AND EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.coproprietes c ON c.syndic_id = au.id
    WHERE au.email = ue.user_email
      AND c.id = adf.copropriete_id
  );

-- Étape 5 : appel_fonds_status_changed — matcher via metadata->>'appelId'
UPDATE public.user_events ue
SET copropriete_id = adf.copropriete_id
FROM public.appels_de_fonds adf
WHERE ue.copropriete_id IS NULL
  AND ue.event_type = 'appel_fonds_status_changed'
  AND ue.metadata->>'appelId' IS NOT NULL
  AND adf.id = (ue.metadata->>'appelId')::uuid;

-- Étape 6 : depense_created/updated/deleted — matcher via le titre et la proximité temporelle (± 10 min)
-- Pour les utilisateurs multi-copropriétés non couverts par l'étape 2
UPDATE public.user_events ue
SET copropriete_id = d.copropriete_id
FROM public.depenses d
WHERE ue.copropriete_id IS NULL
  AND ue.event_type IN ('depense_created', 'depense_updated', 'depense_deleted')
  AND ue.label LIKE '% — ' || d.titre || ' %'
  AND ABS(EXTRACT(EPOCH FROM (ue.created_at - d.created_at))) < 600
  AND EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.coproprietes c ON c.syndic_id = au.id
    WHERE au.email = ue.user_email
      AND c.id = d.copropriete_id
  );

