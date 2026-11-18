import { EQUIPMENT_CATALOG, EquipmentItem } from './items';

export interface HeroMetrics {
  tasksCompleted: number;
  bossesDefeated: number;
  criticalHits: number;
  totalGoldEarned: number;
  armoireOpened: number;
}

export const DEFAULT_METRICS: HeroMetrics = {
  tasksCompleted: 0,
  bossesDefeated: 0,
  criticalHits: 0,
  totalGoldEarned: 0,
  armoireOpened: 0,
};

export interface AchievementCheckContext {
  level: number;
  petsCount: number;
  metrics: HeroMetrics;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (ctx: AchievementCheckContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_task',
    title: 'Primeiro Passo',
    description: 'Registre seu primeiro estudo ou treino.',
    icon: '✅',
    check: (c) => c.metrics.tasksCompleted >= 1,
  },
  {
    id: 'unstoppable',
    title: 'Imparável',
    description: 'Faça 25 registros no total.',
    icon: '🔥',
    check: (c) => c.metrics.tasksCompleted >= 25,
  },
  {
    id: 'first_boss',
    title: 'Matador de Monstros',
    description: 'Derrote seu primeiro Boss.',
    icon: '⚔️',
    check: (c) => c.metrics.bossesDefeated >= 1,
  },
  {
    id: 'guild_legend',
    title: 'Lenda da KTZ',
    description: 'Derrote 5 Bosses.',
    icon: '🏆',
    check: (c) => c.metrics.bossesDefeated >= 5,
  },
  {
    id: 'lucky_crit',
    title: 'Golpe de Sorte',
    description: 'Acerte um golpe crítico.',
    icon: '💥',
    check: (c) => c.metrics.criticalHits >= 1,
  },
  {
    id: 'pet_tamer',
    title: 'Domador',
    description: 'Tenha 3 ou mais mascotes no Estábulo.',
    icon: '🐾',
    check: (c) => c.petsCount >= 3,
  },
  {
    id: 'veteran',
    title: 'Veterano',
    description: 'Alcance o Nível 5 com seu herói.',
    icon: '⭐',
    check: (c) => c.level >= 5,
  },
  {
    id: 'treasure_hunter',
    title: 'Caçador de Tesouros',
    description: 'Abra o Armoire Encantado 3 vezes.',
    icon: '🎁',
    check: (c) => c.metrics.armoireOpened >= 3,
  },
];

export type ArmoireReward =
  | { kind: 'equipment'; item: EquipmentItem; label: string }
  | { kind: 'xp'; amount: number; label: string }
  | { kind: 'egg'; label: string }
  | { kind: 'potion'; label: string };

/**
 * Sorteia recompensa do Armoire Encantado (50% chance de equipamento inédito,
 * priorizando a coleção oficial Armoire; 50% XP, Ovo ou Poção).
 */
export function rollArmoireReward(ownedIds: string[] = []): ArmoireReward {
  const ownedSet = new Set(ownedIds);
  const unownedArmoire = EQUIPMENT_CATALOG.filter(
    (item) => item.category === 'armoire' && !ownedSet.has(item.id)
  );
  const unownedPool =
    unownedArmoire.length > 0
      ? unownedArmoire
      : EQUIPMENT_CATALOG.filter((item) => !ownedSet.has(item.id));

  const r = Math.random();
  if (unownedPool.length > 0 && r < 0.5) {
    const picked = unownedPool[Math.floor(Math.random() * unownedPool.length)];
    return {
      kind: 'equipment',
      item: picked,
      label: `Equipamento: ${picked.name}`,
    };
  }

  const sub = Math.random();
  if (sub < 0.4) {
    return { kind: 'xp', amount: 25, label: '+25 XP Encantado' };
  }
  if (sub < 0.7) {
    return { kind: 'egg', label: 'Ovo' };
  }
  return { kind: 'potion', label: 'Poção de Chocar' };
}
