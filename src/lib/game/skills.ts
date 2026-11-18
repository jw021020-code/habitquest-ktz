import { Attributes, PlayableHeroClass } from './items';

export interface ClassSkill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  kind: 'damage' | 'heal' | 'xp' | 'gold' | 'buff';
  buffDelta?: Partial<Attributes>;
}

export interface BossDefinition {
  id: string;
  name: string;
  sprite: string;
  maxHp: number;
  attack: number;
  rewardGold: number;
  rewardXp: number;
}

export const CLASS_UNLOCK_LEVEL = 5;

export const CLASS_INFO: Record<PlayableHeroClass, { label: string; badgeClass: string }> = {
  apprentice: {
    label: 'Aprendiz',
    badgeClass: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
  },
  warrior: { label: 'Guerreiro', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  wizard: { label: 'Mago', badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  rogue: { label: 'Ladino', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  healer: { label: 'Curandeiro', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
};

export const CLASS_SKILLS: Record<PlayableHeroClass, ClassSkill[]> = {
  apprentice: [],
  warrior: [
    {
      id: 'brutal_smash',
      name: 'Golpe Brutal',
      description: 'Causa dano alto ao Boss baseado em STR.',
      mpCost: 10,
      kind: 'damage',
    },
    {
      id: 'valorous_presence',
      name: 'Postura Férrea',
      description: '+5 STR e +5 CON até derrotar o Boss atual (máx. +15).',
      mpCost: 15,
      kind: 'buff',
      buffDelta: { str: 5, con: 5 },
    },
  ],
  wizard: [
    {
      id: 'burst_of_flames',
      name: 'Explosão Arcana',
      description: 'Causa dano mágico ao Boss baseado em INT.',
      mpCost: 10,
      kind: 'damage',
    },
    {
      id: 'ethereal_surge',
      name: 'Sabedoria',
      description: 'Concede XP bônus imediato baseado em INT.',
      mpCost: 15,
      kind: 'xp',
    },
  ],
  rogue: [
    {
      id: 'backstab',
      name: 'Ataque Furtivo',
      description: 'Causa dano ao Boss e rouba Ouro baseado em PER.',
      mpCost: 10,
      kind: 'damage',
    },
    {
      id: 'pickpocket',
      name: 'Mãos Leves',
      description: 'Ganha Ouro imediato baseado em PER.',
      mpCost: 12,
      kind: 'gold',
    },
  ],
  healer: [
    {
      id: 'healing_light',
      name: 'Luz Curativa',
      description: 'Restaura Estamina baseado em CON e INT.',
      mpCost: 12,
      kind: 'heal',
    },
    {
      id: 'protective_aura',
      name: 'Aura Protetora',
      description: '+8 CON até derrotar o Boss atual (máx. +16).',
      mpCost: 15,
      kind: 'buff',
      buffDelta: { con: 8 },
    },
  ],
};

export const BOSS_CATALOG: BossDefinition[] = [
  {
    id: 'dustbunnies',
    name: 'Coelho da Poeira',
    sprite: '/sprites/quest_dustbunnies.png',
    maxHp: 300,
    attack: 12,
    rewardGold: 35,
    rewardXp: 80,
  },
  {
    id: 'basilist',
    name: 'Basilisco das Tarefas',
    sprite: '/sprites/quest_basilist.png',
    maxHp: 450,
    attack: 15,
    rewardGold: 50,
    rewardXp: 120,
  },
  {
    id: 'vice1',
    name: 'Sombra do Vício I',
    sprite: '/sprites/quest_vice1.png',
    maxHp: 600,
    attack: 18,
    rewardGold: 75,
    rewardXp: 160,
  },
  {
    id: 'vice2',
    name: 'Sombra do Vício II',
    sprite: '/sprites/quest_vice2.png',
    maxHp: 800,
    attack: 22,
    rewardGold: 100,
    rewardXp: 220,
  },
  {
    id: 'vice3',
    name: 'Sombra do Vício III',
    sprite: '/sprites/quest_vice3.png',
    maxHp: 1000,
    attack: 25,
    rewardGold: 140,
    rewardXp: 300,
  },
  {
    id: 'atom1',
    name: 'Átomo Instável',
    sprite: '/sprites/quest_atom1.png',
    maxHp: 500,
    attack: 16,
    rewardGold: 65,
    rewardXp: 150,
  },
];

/**
 * Retorna o Boss progressivo para o estágio atual (1, 2, 3...).
 * Ao completar todos os 6 Bosses, reinicia o ciclo com HP e recompensas escalados.
 */
export function getProgressiveBoss(stage: number): BossDefinition {
  const safeStage = Math.max(1, stage);
  const idx = (safeStage - 1) % BOSS_CATALOG.length;
  const cycle = Math.floor((safeStage - 1) / BOSS_CATALOG.length);
  const base = BOSS_CATALOG[idx];
  const scale = 1 + cycle * 0.35;

  return {
    ...base,
    name: cycle > 0 ? `${base.name} (Ciclo ${cycle + 1})` : base.name,
    maxHp: Math.round(base.maxHp * scale),
    attack: Math.round(base.attack * (1 + cycle * 0.2)),
    rewardGold: Math.round(base.rewardGold * (1 + cycle * 0.25)),
    rewardXp: Math.round(base.rewardXp * (1 + cycle * 0.25)),
  };
}
