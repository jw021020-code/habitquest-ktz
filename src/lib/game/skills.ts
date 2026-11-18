import { Attributes, PlayableHeroClass } from './items';
import bossesCatalogRaw from './bosses-catalog.json';

export type BossCategory =
  | 'unlockable'
  | 'pet'
  | 'hatchingPotion'
  | 'timeTravelers'
  | 'gold'
  | 'world';

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
  questTitle: string;
  lore: string;
  category: BossCategory;
  sprite: string;
  maxHp: number;
  attack: number;
  rewardGold: number;
  rewardXp: number;
  dropCount: number;
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

export const BOSS_CATALOG: BossDefinition[] = bossesCatalogRaw as BossDefinition[];

const BOSS_BY_ID = new Map<string, BossDefinition>(
  BOSS_CATALOG.map((b) => [b.id, b])
);

export function getBossById(id?: string): BossDefinition | undefined {
  if (!id) return undefined;
  return BOSS_BY_ID.get(id);
}

export function getBossAtIndexAndCycle(idx: number, cycle: number): BossDefinition {
  const safeIdx = ((idx % BOSS_CATALOG.length) + BOSS_CATALOG.length) % BOSS_CATALOG.length;
  const safeCycle = Math.max(0, cycle);
  const base = BOSS_CATALOG[safeIdx];
  const hpScale = 1 + safeCycle * 0.5;
  const atkScale = 1 + safeCycle * 0.2;
  const rewardScale = 1 + safeCycle * 0.35;

  return {
    ...base,
    name: safeCycle > 0 ? `${base.name} (Ciclo ${safeCycle + 1})` : base.name,
    maxHp: Math.round(base.maxHp * hpScale),
    attack: Math.round(base.attack * atkScale),
    rewardGold: Math.round(base.rewardGold * rewardScale),
    rewardXp: Math.round(base.rewardXp * rewardScale),
  };
}

/**
 * Retorna o Boss progressivo para o estágio atual (1..101 no Ciclo 1, depois Ciclo 2, etc.).
 */
export function getProgressiveBoss(stage: number): BossDefinition {
  const safeStage = Math.max(1, stage);
  const idx = (safeStage - 1) % BOSS_CATALOG.length;
  const cycle = Math.floor((safeStage - 1) / BOSS_CATALOG.length);
  return getBossAtIndexAndCycle(idx, cycle);
}
