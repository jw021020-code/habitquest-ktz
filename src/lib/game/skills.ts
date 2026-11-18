import { Attributes, PlayableHeroClass } from './items';
import bossesCatalogRaw from './bosses-catalog.json';

export type BossCategory =
  | 'unlockable'
  | 'pet'
  | 'hatchingPotion'
  | 'timeTravelers'
  | 'gold'
  | 'world';

export type SkillKind = 'damage' | 'heal' | 'gold' | 'buff' | 'stance';

export type PartySkillEffect =
  | 'heal_all'
  | 'mana_all'
  | 'buff_con'
  | 'buff_str'
  | 'buff_per'
  | 'boss_vulnerable'
  | 'boss_weaken';

export interface ClassSkill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  kind: SkillKind;
  isGroup?: boolean;
  partyEffect?: PartySkillEffect;
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

export const CLASS_INFO: Record<
  PlayableHeroClass,
  { label: string; subtitle: string; primaryAttr: string; badgeClass: string }
> = {
  apprentice: {
    label: 'Aprendiz',
    subtitle: 'Classe Inicial',
    primaryAttr: 'Geral',
    badgeClass: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
  },
  healer: {
    label: 'Escudeiro',
    subtitle: 'Tank & Suporte',
    primaryAttr: 'CON',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  warrior: {
    label: 'Espadachim',
    subtitle: 'Lutador / Dano Bruto',
    primaryAttr: 'STR',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  rogue: {
    label: 'Batedor',
    subtitle: 'Agilidade & Saque',
    primaryAttr: 'PER',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  wizard: {
    label: 'Noviço Arcano',
    subtitle: 'Magia & Mana',
    primaryAttr: 'INT',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
};

export const CLASS_SKILLS: Record<PlayableHeroClass, ClassSkill[]> = {
  apprentice: [
    {
      id: 'improvised_strike',
      name: 'Golpe Improvisado',
      description: 'Ataque básico leve no Boss (escalado por STR/INT, -30% contra-ataque).',
      mpCost: 8,
      kind: 'damage',
    },
    {
      id: 'quick_breath',
      name: 'Fôlego Rápido',
      description: 'Recupera uma pequena quantia de Estamina.',
      mpCost: 10,
      kind: 'heal',
    },
  ],
  healer: [
    {
      id: 'shield_bash',
      name: 'Golpe de Escudo',
      description: 'Causa dano firme (CON + STR) e reduz em 50% o contra-ataque recebido.',
      mpCost: 10,
      kind: 'damage',
    },
    {
      id: 'guild_wall',
      name: 'Muralha da Guilda',
      description: 'Restaura Estamina sua e de todos os membros da KTZ (CON).',
      mpCost: 16,
      kind: 'heal',
      isGroup: true,
      partyEffect: 'heal_all',
    },
    {
      id: 'defensive_stance',
      name: 'Postura Defensiva',
      description: 'Reduz em 50% a perda de Estamina nas suas próximas 3 ações.',
      mpCost: 14,
      kind: 'stance',
    },
    {
      id: 'guild_bastion',
      name: 'Bastião da Guilda',
      description: 'Concede +15% CON (mín. +8) para toda a KTZ até o Boss atual cair.',
      mpCost: 20,
      kind: 'buff',
      isGroup: true,
      partyEffect: 'buff_con',
    },
  ],
  warrior: [
    {
      id: 'heavy_slash',
      name: 'Corte Pesado',
      description: 'Golpe físico bruto que causa dano alto direto no Boss (STR).',
      mpCost: 12,
      kind: 'damage',
    },
    {
      id: 'sure_strike',
      name: 'Golpe Certeiro',
      description: 'Garante Crítico (1.75x) no próximo ataque ou registro, ignorando Exaustão.',
      mpCost: 16,
      kind: 'stance',
    },
    {
      id: 'guard_break',
      name: 'Quebra-Guarda',
      description: 'Causa dano e deixa o Boss Vulnerável (+20% dano de toda a KTZ).',
      mpCost: 18,
      kind: 'damage',
      isGroup: true,
      partyEffect: 'boss_vulnerable',
    },
    {
      id: 'war_cry',
      name: 'Grito de Guerra',
      description: 'Concede +15% STR (mín. +8) para toda a KTZ até o Boss atual cair.',
      mpCost: 20,
      kind: 'buff',
      isGroup: true,
      partyEffect: 'buff_str',
    },
  ],
  rogue: [
    {
      id: 'agile_dash',
      name: 'Investida Ágil',
      description: 'Ataque veloz (PER) com 50% de chance de Esquiva (0 perda de Estamina).',
      mpCost: 10,
      kind: 'damage',
    },
    {
      id: 'opportunist_loot',
      name: 'Saque Oportunista',
      description: 'Ganha Ouro imediato e rola chance extra (PER) de encontrar Ovo ou Poção.',
      mpCost: 14,
      kind: 'gold',
    },
    {
      id: 'shadow_steps',
      name: 'Passos Sombrios',
      description: '+20% de chance de Crítico e -40% perda de Estamina nas próximas 3 ações.',
      mpCost: 14,
      kind: 'stance',
    },
    {
      id: 'mark_prey',
      name: 'Marcar Presa',
      description: 'Concede +15% PER (mín. +8) para toda a KTZ até o Boss atual cair.',
      mpCost: 20,
      kind: 'buff',
      isGroup: true,
      partyEffect: 'buff_per',
    },
  ],
  wizard: [
    {
      id: 'arcane_bolt',
      name: 'Raio Arcano',
      description: 'Dano mágico à distância (INT) com 25% menos contra-ataque.',
      mpCost: 12,
      kind: 'damage',
    },
    {
      id: 'ethereal_wave',
      name: 'Onda Etérea',
      description: 'Restaura Mana (MP) de todos os membros da KTZ (baseado em INT).',
      mpCost: 18,
      kind: 'buff',
      isGroup: true,
      partyEffect: 'mana_all',
    },
    {
      id: 'curse_weakness',
      name: 'Maldição da Fraqueza',
      description: 'Reduz o ataque do Boss atual em -25% para toda a KTZ.',
      mpCost: 16,
      kind: 'buff',
      isGroup: true,
      partyEffect: 'boss_weaken',
    },
    {
      id: 'focused_flame',
      name: 'Chama Concentrada',
      description: 'Magia pesada de alto custo que causa dano arcano explosivo (INT).',
      mpCost: 24,
      kind: 'damage',
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
