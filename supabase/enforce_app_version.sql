-- Cadeado Server-Side de Versão Mínima do HabitQuest KTZ
-- Execute este script no SQL Editor do Supabase APÓS o deploy da v1.0.3 na Vercel.
-- Ele bloqueia qualquer gravação (INSERT/UPDATE) vinda de clientes em abas antigas.

create table if not exists public.app_config (
  id text primary key,
  min_client_info text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (id, min_client_info)
values ('global', 'habitquest-ktz/1.1.0')
on conflict (id) do update
set min_client_info = excluded.min_client_info,
    updated_at = now();

alter table public.app_config enable row level security;

drop policy if exists "Allow read app_config" on public.app_config;
create policy "Allow read app_config"
  on public.app_config
  for select
  to authenticated, anon
  using (true);

create or replace function public.enforce_min_app_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  req_headers json;
  client_info text;
  expected_info text;
begin
  -- Só bloqueia requisições vindas de usuários logados via API (auth.role() = 'authenticated');
  -- nunca bloqueia SQL manual no Dashboard do Supabase.
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  select min_client_info
    into expected_info
    from public.app_config
   where id = 'global';

  if expected_info is null then
    return new;
  end if;

  req_headers := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  client_info := coalesce(req_headers->>'x-client-info', '');

  if position(expected_info in client_info) = 0 then
    raise exception 'APP_OUTDATED: Versão desatualizada (%). Recarregue a página para atualizar para %.', client_info, expected_info;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_version_profiles on public.profiles;
create trigger trg_enforce_version_profiles
  before insert or update on public.profiles
  for each row execute function public.enforce_min_app_version();

drop trigger if exists trg_enforce_version_parties on public.parties;
create trigger trg_enforce_version_parties
  before insert or update on public.parties
  for each row execute function public.enforce_min_app_version();

drop trigger if exists trg_enforce_version_party_messages on public.party_messages;
create trigger trg_enforce_version_party_messages
  before insert or update on public.party_messages
  for each row execute function public.enforce_min_app_version();
