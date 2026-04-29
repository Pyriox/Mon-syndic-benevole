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
  JOIN public.coproprietes c ON c.syndic_id = au.id
  WHERE ue2.copropriete_id IS NULL
    AND ue2.event_type IN (
      'copropriete_updated',
      'appel_fonds_created', 'appel_fonds_status_changed', 'appel_fonds_deleted',
      'ag_created', 'ag_status_changed',
      'coproprietaire_added', 'coproprietaire_updated', 'coproprietaire_deleted',
      'lot_added', 'lot_updated', 'lot_deleted',
      'document_added', 'document_updated', 'document_deleted',
      'paiement_confirme', 'paiement_annule'
    )
  GROUP BY ue2.id, c.id
  -- N'agir que si l'utilisateur n'a qu'une seule copropriété
  -- (évite toute attribution erronée sur les comptes multi-copros)
  HAVING COUNT(c.id) OVER (PARTITION BY ue2.user_email) = 1
) sub
WHERE ue.id = sub.event_id;
