-- Script de Hard Reset de Temporada — KTZ - Know The Zero
-- Reseta todas as contas existentes para Nível 1, Aprendiz, 0 Ouro, 0 Itens, 0 Pets e Boss #1

-- 1. Reseta o Boss da KTZ para o Estágio #1
update public.parties
set
  boss_stage = 1,
  boss_id = 'dustbunnies',
  boss_name = 'Coelho da Poeira',
  boss_sprite = '/sprites/quest_dustbunnies.png',
  boss_hp = 300,
  boss_max_hp = 300,
  boss_attack = 12,
  reward_gold = 35,
  reward_xp = 80
where name = 'KTZ - Know The Zero';

-- 2. Reseta todos os perfis mantendo o nome e o vínculo com a KTZ
update public.profiles
set
  hero_class = 'apprentice',
  level = 1,
  hp = 50,
  max_hp = 50,
  mp = 30,
  max_mp = 32,
  xp = 0,
  xp_to_next = 100,
  gold = 0,
  rebirths = 0,
  allocated_stats = '{"str":0,"int":0,"con":0,"per":0}'::jsonb,
  buffs = '{"str":0,"int":0,"con":0,"per":0}'::jsonb,
  equipped = '{}'::jsonb,
  costume = '{}'::jsonb,
  use_costume = false,
  inventory = '[]'::jsonb,
  stable = '{"eggs":0,"potions":0,"foods":0,"pets":{},"mounts":{}}'::jsonb,
  metrics = '{"tasksCompleted":0,"bossesDefeated":0,"criticalHits":0,"totalGoldEarned":0,"armoireOpened":0}'::jsonb,
  study_entries = '[]'::jsonb,
  workout_entries = '[]'::jsonb,
  party_id = (select id from public.parties where name = 'KTZ - Know The Zero' limit 1);

-- 3. Limpa o histórico antigo e registra o início oficial da temporada
delete from public.party_messages;

insert into public.party_messages (party_id, username, kind, content)
select id, 'Sistema', 'system', '🚀 Temporada Oficial iniciada! Todos os membros começaram no Nível 1 como Aprendizes na KTZ - Know The Zero!'
from public.parties
where name = 'KTZ - Know The Zero';
