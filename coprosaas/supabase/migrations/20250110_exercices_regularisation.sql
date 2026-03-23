-- ============================================================
-- Exercices comptables + Régularisation de charges
-- ============================================================

-- Table des exercices (une par année/copropriété)
create table if not exists exercices (
  id             uuid        primary key default gen_random_uuid(),
  copropriete_id uuid        not null references coproprietes(id) on delete cascade,
  annee          integer     not null,
  date_debut     date        not null,
  date_fin       date        not null,
  statut         text        not null default 'ouvert'
                             check (statut in ('ouvert', 'cloture')),
  ag_id          uuid,       -- AG d'approbation des comptes (optionnel)
  notes          text,
  created_by     uuid        references auth.users(id),
  created_at     timestamptz not null default now(),
  cloture_at     timestamptz,
  unique(copropriete_id, annee)
);

alter table exercices enable row level security;

create policy "exercices_syndic_all"
  on exercices for all
  using (
    copropriete_id in (
      select id from coproprietes where syndic_id = auth.uid()
    )
  );

create policy "exercices_copro_select"
  on exercices for select
  using (
    copropriete_id in (
      select copropriete_id from coproprietaires where user_id = auth.uid()
    )
  );

-- Table des lignes de régularisation (une par copropriétaire par exercice)
-- balance = dépenses réelles (quote-part) - provisions appelées + solde de reprise
--   > 0 → copropriétaire doit un complément (solde débiteur)
--   < 0 → copropriétaire est en crédit (trop-perçu)
create table if not exists regularisation_lignes (
  id                uuid        primary key default gen_random_uuid(),
  exercice_id       uuid        not null references exercices(id) on delete cascade,
  coproprietaire_id uuid        not null references coproprietaires(id) on delete cascade,
  montant_appele    numeric     not null default 0,   -- total provisions appelées dans l'exercice (hors fonds travaux)
  montant_reel      numeric     not null default 0,   -- quote-part des dépenses réelles (hors fonds travaux ALUR)
  solde_reprise     numeric     not null default 0,   -- solde issu de l'ancienne plateforme (1ère année) ou de l'exercice précédent
  balance           numeric     generated always as (montant_reel - montant_appele + solde_reprise) stored,
  mode              text        not null default 'en_attente'
                                check (mode in ('en_attente', 'imputation', 'remboursement')),
  created_at        timestamptz not null default now(),
  unique(exercice_id, coproprietaire_id)
);

alter table regularisation_lignes enable row level security;

create policy "regularisation_syndic_all"
  on regularisation_lignes for all
  using (
    exercice_id in (
      select e.id from exercices e
      join coproprietes c on c.id = e.copropriete_id
      where c.syndic_id = auth.uid()
    )
  );

create policy "regularisation_copro_select"
  on regularisation_lignes for select
  using (
    coproprietaire_id in (
      select id from coproprietaires where user_id = auth.uid()
    )
  );
