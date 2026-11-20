-- Script de Hard Reset de Temporada 1.0.0 — KTZ - Know The Zero
-- Reseta todas as contas existentes para Nível 1, Aprendiz, 0 Ouro, 0 Itens, 0 Pets, 0 Quests e Boss #1

-- 1. Reseta o Boss da KTZ para o Estágio #1
update public.parties
set
  boss_stage = 1,
  boss_id = 'dustbunnies',
  boss_name = 'Coelhos de cotão selvagens',
  boss_sprite = '/sprites/quest_dustbunnies.png',
  boss_hp = 300,
  boss_max_hp = 300,
  boss_attack = 13,
  reward_gold = 36,
  reward_xp = 95
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
  xp_to_next = 350,
  gold = 0,
  is_sleeping = false,
  rebirths = 0,
  allocated_stats = '{"str":0,"int":0,"con":0,"per":0}'::jsonb,
  buffs = '{"str":0,"int":0,"con":0,"per":0}'::jsonb,
  equipped = '{}'::jsonb,
  costume = '{}'::jsonb,
  use_costume = false,
  inventory = '[]'::jsonb,
  stable = '{"eggs":0,"potions":0,"pets":{}}'::jsonb,
  metrics = '{"tasksCompleted":0,"bossesDefeated":0,"criticalHits":0,"totalGoldEarned":0,"armoireOpened":0,"currentBossStage":1,"currentBossDamage":0,"totalBossDamage":0,"lastClaimedBossStage":0}'::jsonb,
  study_entries = '[]'::jsonb,
  workout_entries = '[]'::jsonb,
  party_id = (select id from public.parties where name = 'KTZ - Know The Zero' limit 1);

-- 3. Limpa o histórico antigo e registra o início oficial da Temporada 1.0.0
delete from public.party_messages;

insert into public.party_messages (party_id, username, kind, content)
select id, 'Sistema', 'system', '🚀 Temporada 1.0.0 iniciada! Todos os membros começaram no Nível 1 como Aprendizes na KTZ - Know The Zero. Bons estudos rumo à PRF!'
from public.parties
where name = 'KTZ - Know The Zero';
