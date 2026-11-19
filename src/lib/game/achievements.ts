import {
  EQUIPMENT_CATALOG,
  EquipmentItem,
  getItemRarity,
  ItemRarity,
  RARITY_META,
} from './items';

export interface HeroMetrics {
  tasksCompleted: number;
  bossesDefeated: number;
  criticalHits: number;
  totalGoldEarned: number;
  armoireOpened: number;
  currentBossStage?: number;
  currentBossDamage?: number;
  totalBossDamage?: number;
  lastClaimedBossStage?: number;
  quests?: {
    dailyKey: string;
    dailyQuestIds: string[];
    dailyClaimedIds: string[];
    weeklyKey: string;
    weeklyQuestIds: string[];
    weeklyClaimedIds: string[];
    monthlyKey: string;
    monthlyClaimedIds: string[];
    monthlyBonusClaimed: boolean;
    totalQuestsCompleted: number;
  };
}

export const DEFAULT_METRICS: HeroMetrics = {
  tasksCompleted: 0,
  bossesDefeated: 0,
  criticalHits: 0,
  totalGoldEarned: 0,
  armoireOpened: 0,
  currentBossStage: 1,
  currentBossDamage: 0,
  totalBossDamage: 0,
  lastClaimedBossStage: 1,
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
  | { kind: 'equipment'; item: EquipmentItem; rarity: ItemRarity; label: string }
  | { kind: 'gold'; amount: number; label: string }
  | { kind: 'egg'; label: string }
  | { kind: 'potion'; label: string };

/**
 * Sorteia recompensa do Armoire Encantado (ZERO XP):
 * - 55% chance de Equipamento inédito ponderado por Raridade
 *   (Comum 50% · Incomum 28% · Raro 14% · Épico 6% · Lendário 2%)
 * - 45% chance de Recurso (40% Ovo, 40% Poção de Chocar, 20% Saco de Ouro)
 */
export function rollArmoireReward(ownedIds: string[] = []): ArmoireReward {
  const ownedSet = new Set(ownedIds);
  const unownedPool = EQUIPMENT_CATALOG.filter((item) => !ownedSet.has(item.id));

  if (unownedPool.length > 0 && Math.random() < 0.55) {
    const byRarity: Record<ItemRarity, EquipmentItem[]> = {
      common: [],
      uncommon: [],
      rare: [],
      epic: [],
      legendary: [],
    };
    for (const item of unownedPool) {
      byRarity[getItemRarity(item)].push(item);
    }

    const availableRarities = (Object.keys(byRarity) as ItemRarity[]).filter(
      (r) => byRarity[r].length > 0
    );
    const totalWeight = availableRarities.reduce(
      (acc, r) => acc + RARITY_META[r].weight,
      0
    );

    let roll = Math.random() * totalWeight;
    let chosenRarity: ItemRarity = availableRarities[0];
    for (const r of availableRarities) {
      roll -= RARITY_META[r].weight;
      if (roll <= 0) {
        chosenRarity = r;
        break;
      }
    }

    const bucket = byRarity[chosenRarity];
    const picked = bucket[Math.floor(Math.random() * bucket.length)];
    return {
      kind: 'equipment',
      item: picked,
      rarity: chosenRarity,
      label: `[${RARITY_META[chosenRarity].label}] ${picked.name}`,
    };
  }

  const sub = Math.random();
  if (sub < 0.4) {
    return { kind: 'egg', label: '1x Ovo' };
  }
  if (sub < 0.8) {
    return { kind: 'potion', label: '1x Poção de Chocar' };
  }
  const gp = 25 + Math.floor(Math.random() * 36); // 25..60 GP
  return { kind: 'gold', amount: gp, label: `+${gp} GP do Baú` };
}

/**
 * Sorteia um equipamento inédito garantido (Incomum, Raro, Épico ou Lendário)
 * para o Baú de Honra PRF do Mês.
 */
export function rollGuaranteedEquipment(
  ownedIds: string[] = []
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  const ownedSet = new Set(ownedIds);
  const unownedPool = EQUIPMENT_CATALOG.filter((item) => !ownedSet.has(item.id));
  if (unownedPool.length === 0) return null;

  const preferredRarities: ItemRarity[] = ['uncommon', 'rare', 'epic', 'legendary'];
  const byRarity: Record<ItemRarity, EquipmentItem[]> = {
    common: [],
    uncommon: [],
    rare: [],
    epic: [],
    legendary: [],
  };
  for (const item of unownedPool) {
    byRarity[getItemRarity(item)].push(item);
  }

  let availableRarities = preferredRarities.filter((r) => byRarity[r].length > 0);
  if (availableRarities.length === 0) {
    availableRarities = ['common'];
  }

  const totalWeight = availableRarities.reduce(
    (acc, r) => acc + RARITY_META[r].weight,
    0
  );
  let roll = Math.random() * totalWeight;
  let chosenRarity: ItemRarity = availableRarities[0];
  for (const r of availableRarities) {
    roll -= RARITY_META[r].weight;
    if (roll <= 0) {
      chosenRarity = r;
      break;
    }
  }

  const bucket = byRarity[chosenRarity];
  const picked = bucket[Math.floor(Math.random() * bucket.length)];
  return {
    item: picked,
    rarity: chosenRarity,
    label: `[${RARITY_META[chosenRarity].label}] ${picked.name}`,
  };
}
