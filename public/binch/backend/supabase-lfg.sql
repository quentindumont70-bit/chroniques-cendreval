-- La Binch · LFG partagé — schéma initial Supabase
-- Exécuter UNE SEULE FOIS dans Supabase > SQL Editor.
-- Ce script n'insère pas de données de démonstration.
--
-- SÉCURITÉ : les annonces sont consultables par tout visiteur du portail qui
-- obtient automatiquement une session anonyme. Ce n'est PAS encore un salon
-- privé limité aux membres de la guilde. N'y publiez aucune donnée sensible.
-- Pour restreindre l'accès à la guilde, ajouter ultérieurement une vraie
-- appartenance vérifiée (Discord OAuth/guild ID ou invitations côté serveur).

create extension if not exists pgcrypto;

create table if not exists public.binch_lfg_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_name text not null check (char_length(character_name) between 2 and 40),
  activity text not null check (char_length(activity) between 2 and 90),
  role text not null check (role in ('Tank','Soin','DPS','Flexible')),
  slots integer not null check (slots between 1 and 40),
  starts_at timestamptz,
  note text not null default '' check (char_length(note) <= 350),
  is_closed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.binch_lfg_reactions (
  post_id uuid not null references public.binch_lfg_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  character_name text not null check (char_length(character_name) between 2 and 40),
  kind text not null check (kind in ('yes','maybe','no')),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists binch_lfg_posts_recent on public.binch_lfg_posts (created_at desc);
create index if not exists binch_lfg_reactions_post on public.binch_lfg_reactions (post_id);

alter table public.binch_lfg_posts enable row level security;
alter table public.binch_lfg_reactions enable row level security;

-- Supprimer les permissions initiales par défaut et n'exposer que
-- les actions nécessaires aux sessions authentifiées (y compris anonymes).
revoke all on public.binch_lfg_posts from public, anon, authenticated;
revoke all on public.binch_lfg_reactions from public, anon, authenticated;
grant select, insert, update, delete on public.binch_lfg_posts to authenticated;
grant select, insert, update, delete on public.binch_lfg_reactions to authenticated;

drop policy if exists binch_lfg_posts_select on public.binch_lfg_posts;
create policy binch_lfg_posts_select on public.binch_lfg_posts
  for select to authenticated using (true);
drop policy if exists binch_lfg_posts_insert on public.binch_lfg_posts;
create policy binch_lfg_posts_insert on public.binch_lfg_posts
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);
drop policy if exists binch_lfg_posts_update on public.binch_lfg_posts;
create policy binch_lfg_posts_update on public.binch_lfg_posts
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
drop policy if exists binch_lfg_posts_delete on public.binch_lfg_posts;
create policy binch_lfg_posts_delete on public.binch_lfg_posts
  for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists binch_lfg_reactions_select on public.binch_lfg_reactions;
create policy binch_lfg_reactions_select on public.binch_lfg_reactions
  for select to authenticated using (true);
drop policy if exists binch_lfg_reactions_insert on public.binch_lfg_reactions;
create policy binch_lfg_reactions_insert on public.binch_lfg_reactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists binch_lfg_reactions_update on public.binch_lfg_reactions;
create policy binch_lfg_reactions_update on public.binch_lfg_reactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists binch_lfg_reactions_delete on public.binch_lfg_reactions;
create policy binch_lfg_reactions_delete on public.binch_lfg_reactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Atténuation des abus de comptes anonymes : limite d'annonces quotidiennes
-- et nombre d'annonces ouvertes par session, avec compteur vérifié en SQL.
create or replace function public.binch_lfg_limit_posts()
returns trigger language plpgsql set search_path = ''
as $$
declare
  today_count integer;
  open_count integer;
begin
  select count(*) into today_count from public.binch_lfg_posts
  where owner_id = new.owner_id and created_at >= now() - interval '24 hours';
  select count(*) into open_count from public.binch_lfg_posts
  where owner_id = new.owner_id and is_closed = false;
  if today_count >= 12 or open_count >= 6 then
    raise exception 'Limite atteinte : 12 annonces/24h et 6 annonces ouvertes maximum';
  end if;
  return new;
end;
$$;
drop trigger if exists binch_lfg_before_insert on public.binch_lfg_posts;
create trigger binch_lfg_before_insert
before insert on public.binch_lfg_posts
for each row execute function public.binch_lfg_limit_posts();

-- NOTE : la limite par session n'empêche pas les abus via création
-- répétée de sessions anonymes. Avant diffusion large, activer la
-- protection anti-bot/CAPTCHA et modération serveur dans Supabase.
