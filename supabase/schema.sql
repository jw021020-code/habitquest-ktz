-- Schema Oficial de Lançamento — HabitQuest: KTZ - Know The Zero (Supabase)

-- 1. Parties (Clã Global KTZ - Know The Zero + Boss Progressivo Cooperativo)
create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  invite_code text unique not null default 'KTZ000',
  leader_id uuid references auth.users(id) on delete set null,
  boss_stage integer not null default 1,
  boss_id text not null default 'dustbunnies',
  boss_name text not null default 'Coelho da Poeira',
  boss_sprite text not null default '/sprites/quest_dustbunnies.png',
  boss_hp integer not null default 300,
  boss_max_hp integer not null default 300,
  boss_attack integer not null default 12,
  reward_gold integer not null default 35,
  reward_xp integer not null default 80,
  created_at timestamptz not null default now()
);

-- Garante a criação imediata do clã único KTZ - Know The Zero
insert into public.parties (
  name, invite_code, boss_stage, boss_id, boss_name, boss_sprite, boss_hp, boss_max_hp, boss_attack, reward_gold, reward_xp
)
values (
  'KTZ - Know The Zero', 'KTZ000', 1, 'dustbunnies', 'Coelho da Poeira', '/sprites/quest_dustbunnies.png', 300, 300, 12, 35, 80
)
on conflict (name) do nothing;

-- 2. Profiles (Status RPG do Jogador — Inicia Nv.1, Aprendiz, 0 Ouro, 0 Itens, 0 Pets)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  hero_class text not null default 'apprentice',
  level integer not null default 1,
  hp integer not null default 50,
  max_hp integer not null default 50,
  mp integer not null default 30,
  max_mp integer not null default 32,
  xp integer not null default 0,
  xp_to_next integer not null default 100,
  gold integer not null default 0,
  is_sleeping boolean not null default false,
  rebirths integer not null default 0,
  allocated_stats jsonb not null default '{"str":0,"int":0,"con":0,"per":0}'::jsonb,
  buffs jsonb not null default '{"str":0,"int":0,"con":0,"per":0}'::jsonb,
  appearance jsonb not null default '{"skin":"f5a76e","bodySize":"broad","shirt":"blue","hairStyle":1,"hairBangs":1,"hairColor":"brown","hairBeard":0,"hairMustache":0,"background":"none"}'::jsonb,
  equipped jsonb not null default '{}'::jsonb,
  costume jsonb not null default '{}'::jsonb,
  use_costume boolean not null default false,
  inventory jsonb not null default '[]'::jsonb,
  stable jsonb not null default '{"eggs":0,"potions":0,"foods":0,"pets":{},"mounts":{}}'::jsonb,
  metrics jsonb not null default '{"tasksCompleted":0,"bossesDefeated":0,"criticalHits":0,"totalGoldEarned":0,"armoireOpened":0}'::jsonb,
  study_entries jsonb not null default '[]'::jsonb,
  workout_entries jsonb not null default '[]'::jsonb,
  party_id uuid references public.parties(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Party Messages (Histórico de Ações e Chat da KTZ em Tempo Real)
create table if not exists public.party_messages (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  username text not null,
  kind text not null default 'chat' check (kind in ('chat', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_party_messages_party on public.party_messages(party_id, created_at desc);

-- 4. Trigger Automática: Cria perfil Nv.1 Aprendiz e coloca DIRETO no clã KTZ - Know The Zero
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_party_id uuid;
  v_username text;
begin
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1),
    'Aprendiz'
  );

  -- Garante que o clã KTZ - Know The Zero exista e obtém seu ID
  insert into public.parties (name, invite_code)
  values ('KTZ - Know The Zero', 'KTZ000')
  on conflict (name) do nothing;

  select id into v_party_id
  from public.parties
  where name = 'KTZ - Know The Zero'
  limit 1;

  -- Cria o perfil zerado (Nv.1, Aprendiz, 0 Ouro, 0 Itens, 0 Pets) já vinculado à KTZ
  insert into public.profiles (id, username, hero_class, party_id)
  values (new.id, v_username, 'apprentice', v_party_id)
  on conflict (id) do update set party_id = coalesce(public.profiles.party_id, excluded.party_id);

  -- Registra entrada automática no Histórico da KTZ
  if v_party_id is not null then
    insert into public.party_messages (party_id, user_id, username, kind, content)
    values (
      v_party_id,
      new.id,
      'Sistema',
      'system',
      '🎉 ' || v_username || ' entrou no clã KTZ - Know The Zero como Aprendiz!'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.party_messages enable row level security;

-- Policies: Profiles
drop policy if exists "Perfis visíveis para usuários autenticados" on public.profiles;
create policy "Perfis visíveis para usuários autenticados"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Usuário insere o próprio perfil" on public.profiles;
create policy "Usuário insere o próprio perfil"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Usuário edita apenas o próprio perfil" on public.profiles;
create policy "Usuário edita apenas o próprio perfil"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Policies: Parties
drop policy if exists "Parties visíveis para usuários autenticados" on public.parties;
create policy "Parties visíveis para usuários autenticados"
  on public.parties for select to authenticated using (true);

drop policy if exists "Usuários autenticados podem criar party" on public.parties;
create policy "Usuários autenticados podem criar party"
  on public.parties for insert to authenticated with check (true);

drop policy if exists "Membros da party podem atualizar estado do boss" on public.parties;
create policy "Membros da party podem atualizar estado do boss"
  on public.parties for update to authenticated using (true);

-- Policies: Party Messages
drop policy if exists "Membros leem mensagens da própria party" on public.party_messages;
create policy "Membros leem mensagens da própria party"
  on public.party_messages for select to authenticated using (true);

drop policy if exists "Membros enviam mensagens na própria party" on public.party_messages;
create policy "Membros enviam mensagens na própria party"
  on public.party_messages for insert to authenticated with check (true);

-- 6. Habilitar Realtime (idempotente)
alter table public.parties replica identity full;
alter table public.profiles replica identity full;
alter table public.party_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'party_messages'
  ) then
    alter publication supabase_realtime add table public.party_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'parties'
  ) then
    alter publication supabase_realtime add table public.parties;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
