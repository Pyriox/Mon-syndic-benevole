-- ============================================================
-- Clôture atomique d'un exercice de régularisation
-- Évite les états partiellement appliqués si une mise à jour échoue
-- ============================================================

CREATE OR REPLACE FUNCTION public.cloturer_regularisation_exercice(p_exercice_id uuid)
RETURNS TABLE (copropriete_id uuid, updated_rows integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_copropriete_id uuid;
BEGIN
  UPDATE exercices
  SET statut = 'cloture',
      cloture_at = COALESCE(cloture_at, now())
  WHERE id = p_exercice_id
    AND statut <> 'cloture'
  RETURNING exercices.copropriete_id
  INTO v_copropriete_id;

  IF v_copropriete_id IS NULL THEN
    RAISE EXCEPTION 'EXERCICE_ALREADY_CLOSED_OR_MISSING';
  END IF;

  UPDATE coproprietaires AS c
  SET solde = round((COALESCE(c.solde, 0)::numeric + balances.total_balance), 2)
  FROM (
    SELECT coproprietaire_id, COALESCE(SUM(balance), 0)::numeric AS total_balance
    FROM regularisation_lignes
    WHERE exercice_id = p_exercice_id
    GROUP BY coproprietaire_id
  ) AS balances
  WHERE c.id = balances.coproprietaire_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  copropriete_id = v_copropriete_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.cloturer_regularisation_exercice(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cloturer_regularisation_exercice(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cloturer_regularisation_exercice(uuid) TO service_role;
