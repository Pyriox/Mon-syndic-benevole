-- ============================================================
-- Item 19 — Table RBAC admin_users
-- Remplace la vérification par ADMIN_EMAIL (env var) par une table DB.
-- Avantages : plusieurs admins possibles, rôles granulaires, révocation
-- instantanée sans redéploiement.
-- ============================================================

create table if not exists admin_users (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  role       text        not null check (role in ('super_admin', 'support')),
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- Un utilisateur peut lire sa propre ligne
-- (nécessaire pour le middleware qui utilise le client anon + cookies)
create policy "admin_users_self_read"
  on admin_users for select
  using (auth.uid() = user_id);

-- Insérer l'administrateur existant (idempotent)
insert into admin_users (user_id, role)
select id, 'super_admin'
from auth.users
where email = 'tpn.fabien@gmail.com'
on conflict (user_id) do nothing;
