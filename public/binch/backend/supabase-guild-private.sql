-- La Binch : guilde privée, version de préparation (non déployée).
-- Exécuter dans Supabase SQL Editor après création d'un projet Supabase.
-- IMPORTANT : comptes email/OAuth NON anonymes, règles RLS SQL réelles.
-- Aucun identifiant, clé secrète ou code d'invitation dans le dépôt public.
create extension if not exists pgcrypto;
create table if not exists public.binch_guilds(
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 3 and 80),
 owner_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table if not exists public.binch_guild_members(
 guild_id uuid not null references public.binch_guilds(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 character_name text not null check(char_length(character_name) between 2 and 40),
 role text not null default 'member' check(role in ('gm','officer','member')),
 joined_at timestamptz not null default now(),
 primary key(guild_id,user_id)
);
create table if not exists public.binch_guild_invites(
 id uuid primary key default gen_random_uuid(),
 guild_id uuid not null references public.binch_guilds(id) on delete cascade,
 code_hash text not null unique,
 created_by uuid not null references auth.users(id),
 expires_at timestamptz not null,
 uses_left integer not null check(uses_left between 0 and 100)
);
create table if not exists public.binch_guild_requests(
 id uuid primary key default gen_random_uuid(),
 guild_id uuid not null references public.binch_guilds(id) on delete cascade,
 created_by uuid not null references auth.users(id),
 title text not null check(char_length(title) between 2 and 90),
 quantity integer not null check(quantity between 1 and 99999),
 deadline timestamptz,
 priority text not null default 'normal' check(priority in ('normal','high','urgent')),
 note text not null default '' check(char_length(note)<=350),
 state text not null default 'open' check(state in ('open','closed')),
 created_at timestamptz not null default now()
);
create table if not exists public.binch_guild_promises(
 id uuid primary key default gen_random_uuid(),
 guild_id uuid not null references public.binch_guilds(id) on delete cascade,
 request_id uuid references public.binch_guild_requests(id) on delete set null,
 owner_id uuid not null references auth.users(id),
 item text not null check(char_length(item) between 2 and 90),
 quantity integer not null check(quantity between 1 and 99999),
 status text not null default 'promised' check(status in ('promised','ready','deposited','received')),
 note text not null default '' check(char_length(note)<=240),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists binch_guild_members_user on public.binch_guild_members(user_id);
create index if not exists binch_guild_requests_group on public.binch_guild_requests(guild_id,created_at desc);
create index if not exists binch_guild_promises_group on public.binch_guild_promises(guild_id,created_at desc);
create index if not exists binch_guild_invites_group on public.binch_guild_invites(guild_id,expires_at);

-- Helpers security-definer avoid self-recursing RLS on membership.
create or replace function public.binch_is_member(g uuid)
returns boolean language sql stable security definer set search_path=''
as $$select exists(select 1 from public.binch_guild_members m where m.guild_id=g and m.user_id=(select auth.uid()))$$;
create or replace function public.binch_is_officer(g uuid)
returns boolean language sql stable security definer set search_path=''
as $$select exists(select 1 from public.binch_guild_members m where m.guild_id=g and m.user_id=(select auth.uid()) and m.role in ('gm','officer'))$$;
revoke all on function public.binch_is_member(uuid) from public;
revoke all on function public.binch_is_officer(uuid) from public;
grant execute on function public.binch_is_member(uuid) to authenticated;
grant execute on function public.binch_is_officer(uuid) to authenticated;

alter table public.binch_guilds enable row level security;
alter table public.binch_guild_members enable row level security;
alter table public.binch_guild_invites enable row level security;
alter table public.binch_guild_requests enable row level security;
alter table public.binch_guild_promises enable row level security;
revoke all on public.binch_guilds,public.binch_guild_members,public.binch_guild_invites,public.binch_guild_requests,public.binch_guild_promises from public,anon,authenticated;
grant select on public.binch_guilds,public.binch_guild_members,public.binch_guild_requests,public.binch_guild_promises to authenticated;
grant insert,update,delete on public.binch_guild_requests,public.binch_guild_promises to authenticated;
drop policy if exists binch_guilds_member_read on public.binch_guilds;
create policy binch_guilds_member_read on public.binch_guilds for select to authenticated using(public.binch_is_member(id));
drop policy if exists binch_members_member_read on public.binch_guild_members;
create policy binch_members_member_read on public.binch_guild_members for select to authenticated using(public.binch_is_member(guild_id));
drop policy if exists binch_requests_read on public.binch_guild_requests;
create policy binch_requests_read on public.binch_guild_requests for select to authenticated using(public.binch_is_member(guild_id));
drop policy if exists binch_requests_create on public.binch_guild_requests;
create policy binch_requests_create on public.binch_guild_requests for insert to authenticated
with check(public.binch_is_member(guild_id) and created_by=(select auth.uid()));
drop policy if exists binch_requests_update on public.binch_guild_requests;
create policy binch_requests_update on public.binch_guild_requests for update to authenticated
using(public.binch_is_officer(guild_id) or created_by=(select auth.uid()))
with check(public.binch_is_officer(guild_id) or created_by=(select auth.uid()));
drop policy if exists binch_requests_delete on public.binch_guild_requests;
create policy binch_requests_delete on public.binch_guild_requests for delete to authenticated using(public.binch_is_officer(guild_id));
drop policy if exists binch_promises_read on public.binch_guild_promises;
create policy binch_promises_read on public.binch_guild_promises for select to authenticated using(public.binch_is_member(guild_id));
drop policy if exists binch_promises_create on public.binch_guild_promises;
create policy binch_promises_create on public.binch_guild_promises for insert to authenticated
with check(public.binch_is_member(guild_id) and owner_id=(select auth.uid()) and
 (request_id is null or exists(select 1 from public.binch_guild_requests r where r.id=request_id and r.guild_id=binch_guild_promises.guild_id)));
-- Direct row updates are intentionally forbidden: only controlled RPC can confirm receipts.
drop policy if exists binch_promises_delete on public.binch_guild_promises;
create policy binch_promises_delete on public.binch_guild_promises for delete to authenticated using(owner_id=(select auth.uid()) and status<>'received');

create or replace function public.binch_create_guild(p_name text,p_character text)
returns uuid language plpgsql security definer set search_path='' as $$
declare g uuid;
begin
 if (select auth.uid()) is null or coalesce((select auth.jwt())->>'is_anonymous','false')='true' then raise exception 'Compte authentifié permanent requis';end if;
 if char_length(trim(p_name)) not between 3 and 80 or char_length(trim(p_character)) not between 2 and 40 then raise exception 'Nom invalide';end if;
 insert into public.binch_guilds(name,owner_id) values(trim(p_name),auth.uid()) returning id into g;
 insert into public.binch_guild_members(guild_id,user_id,character_name,role) values(g,auth.uid(),trim(p_character),'gm');
 return g;
end;$$;
create or replace function public.binch_issue_invite(p_guild uuid)
returns text language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 if not public.binch_is_officer(p_guild) then raise exception 'GM ou officier requis';end if;
 secret=encode(gen_random_bytes(24),'hex');
 insert into public.binch_guild_invites(guild_id,code_hash,created_by,expires_at,uses_left)
 values(p_guild,encode(digest(secret,'sha256'),'hex'),auth.uid(),now()+interval '48 hours',10);
 return secret;
end;$$;
create or replace function public.binch_join_guild(p_code text,p_character text)
returns uuid language plpgsql security definer set search_path='' as $$
declare inv record;
begin
 if (select auth.uid()) is null or coalesce((select auth.jwt())->>'is_anonymous','false')='true' then raise exception 'Compte authentifié permanent requis';end if;
 if char_length(trim(p_character)) not between 2 and 40 or length(p_code)<>48 then raise exception 'Invitation invalide';end if;
 select * into inv from public.binch_guild_invites where code_hash=encode(digest(p_code,'sha256'),'hex') and expires_at>now() and uses_left>0 for update;
 if not found then raise exception 'Invitation expirée ou inconnue';end if;
 insert into public.binch_guild_members(guild_id,user_id,character_name,role) values(inv.guild_id,auth.uid(),trim(p_character),'member')
 on conflict (guild_id,user_id) do nothing;
 update public.binch_guild_invites set uses_left=uses_left-1 where id=inv.id;
 return inv.guild_id;
end;$$;
create or replace function public.binch_set_member_role(p_guild uuid,p_user uuid,p_role text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_role not in ('officer','member') then raise exception 'Role non autorisé';end if;
 if not exists(select 1 from public.binch_guild_members where guild_id=p_guild and user_id=auth.uid() and role='gm') then raise exception 'GM requis';end if;
 update public.binch_guild_members set role=p_role where guild_id=p_guild and user_id=p_user and role<>'gm';
 if not found then raise exception 'Membre non trouvé';end if;
end;$$;
create or replace function public.binch_set_promise_status(p_id uuid,p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare entry record;
begin
 if p_status not in ('promised','ready','deposited','received') then raise exception 'Statut invalide';end if;
 select * into entry from public.binch_guild_promises where id=p_id for update;
 if not found or not public.binch_is_member(entry.guild_id) then raise exception 'Engagement introuvable';end if;
 if p_status='received' and not public.binch_is_officer(entry.guild_id) then raise exception 'Confirmation réservée aux officiers';end if;
 if entry.owner_id<>auth.uid() and not public.binch_is_officer(entry.guild_id) then raise exception 'Action non autorisée';end if;
 update public.binch_guild_promises set status=p_status,updated_at=now() where id=p_id;
end;$$;
revoke all on function public.binch_create_guild(text,text),public.binch_issue_invite(uuid),public.binch_join_guild(text,text),public.binch_set_member_role(uuid,uuid,text),public.binch_set_promise_status(uuid,text) from public;
grant execute on function public.binch_create_guild(text,text),public.binch_issue_invite(uuid),public.binch_join_guild(text,text),public.binch_set_member_role(uuid,uuid,text),public.binch_set_promise_status(uuid,text) to authenticated;

-- RLS protège les données même si le client JavaScript est modifié.
-- Ne PAS utiliser service_role dans le navigateur.
-- Ce script ne crée pas de serveur ni de compte. Aucune synchronisation réelle avant configuration.
