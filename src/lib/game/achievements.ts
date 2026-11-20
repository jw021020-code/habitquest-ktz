import {
  EQUIPMENT_CATALOG,
  EquipmentItem,
  getItemRarity,
  ItemRarity,
  RARITY_META,
} from './items';
import { CheckInState } from './checkin';
import { StudyEntry } from '@/components/StudyLogCard';
import { WorkoutEntry } from '@/components/WorkoutLogCard';

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
  checkin?: CheckInState;
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
  lastClaimedBossStage: 0,
};

export type AchievementCategory =
  | 'study'
  | 'questions'
  | 'run'
  | 'workout'
  | 'discipline'
  | 'career';

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'study', label: 'Estudo' },
  { id: 'questions', label: 'Questões' },
  { id: 'run', label: 'Corrida' },
  { id: 'workout', label: 'Treinos' },
  { id: 'discipline', label: 'Missões' },
  { id: 'career', label: 'Carreira' },
];

export interface AchievementCheckContext {
  level: number;
  metrics: HeroMetrics;
  studyMinutes: number;
  questionsDone: number;
  runKm: number;
  workoutsCount: number;
  comboCount: number;
  questsCompleted: number;
  checkInStreak: number;
}

export function buildAchievementContext(
  level: number,
  metrics: HeroMetrics,
  studyEntries: StudyEntry[] = [],
  workoutEntries: WorkoutEntry[] = []
): AchievementCheckContext {
  const studyMinutes = studyEntries.reduce((acc, s) => acc + Math.max(0, s.minutes || 0), 0);
  const questionsDone = studyEntries.reduce(
    (acc, s) => acc + (s.didQuestions ? Math.max(0, s.questionsDone || 0) : 0),
    0
  );
  const runKm =
    Math.round(
      workoutEntries.reduce(
        (acc, w) => acc + (w.cardio ? Math.max(0, Number(w.km) || 0) : 0),
        0
      ) * 10
    ) / 10;
  const workoutsCount = workoutEntries.reduce(
    (acc, w) => acc + (w.cardio ? 1 : 0) + (w.musculacao ? 1 : 0),
    0
  );
  const comboCount = workoutEntries.filter((w) => w.cardio && w.musculacao).length;
  const questsCompleted = metrics.quests?.totalQuestsCompleted ?? 0;
  const checkInStreak = metrics.checkin?.streak ?? 0;

  return {
    level,
    metrics,
    studyMinutes,
    questionsDone,
    runKm,
    workoutsCount,
    comboCount,
    questsCompleted,
    checkInStreak,
  };
}

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  icon: string;
  target: number;
  getCurrent: (ctx: AchievementCheckContext) => number;
  formatProgress: (ctx: AchievementCheckContext) => string;
  check: (ctx: AchievementCheckContext) => boolean;
}

function fmtHours(minutes: number, targetMinutes: number): string {
  const curH = Math.round((Math.min(minutes, targetMinutes) / 60) * 10) / 10;
  const tgtH = Math.round(targetMinutes / 60);
  return `${curH % 1 === 0 ? curH.toFixed(0) : curH.toFixed(1).replace('.', ',')}h / ${tgtH}h`;
}

function fmtKm(km: number, targetKm: number): string {
  const cur = Math.round(Math.min(km, targetKm) * 10) / 10;
  return `${cur % 1 === 0 ? cur.toFixed(0) : cur.toFixed(1).replace('.', ',')} / ${targetKm} km`;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // 1. Carga Horária Teórica
  {
    id: 'study_10h',
    category: 'study',
    title: 'Edital Aberto',
    description: 'Acumule 10 horas líquidas de estudo teórico.',
    icon: '📘',
    target: 600,
    getCurrent: (c) => c.studyMinutes,
    formatProgress: (c) => fmtHours(c.studyMinutes, 600),
    check: (c) => c.studyMinutes >= 600,
  },
  {
    id: 'study_50h',
    category: 'study',
    title: 'Base Constitucional',
    description: 'Acumule 50 horas líquidas de estudo teórico.',
    icon: '⚖️',
    target: 3000,
    getCurrent: (c) => c.studyMinutes,
    formatProgress: (c) => fmtHours(c.studyMinutes, 3000),
    check: (c) => c.studyMinutes >= 3000,
  },
  {
    id: 'study_100h',
    category: 'study',
    title: 'Blindagem Jurídica',
    description: 'Acumule 100 horas líquidas de estudo teórico.',
    icon: '📚',
    target: 6000,
    getCurrent: (c) => c.studyMinutes,
    formatProgress: (c) => fmtHours(c.studyMinutes, 6000),
    check: (c) => c.studyMinutes >= 6000,
  },
  {
    id: 'study_250h',
    category: 'study',
    title: 'Veterano do CTB',
    description: 'Acumule 250 horas líquidas de estudo teórico.',
    icon: '🚦',
    target: 15000,
    getCurrent: (c) => c.studyMinutes,
    formatProgress: (c) => fmtHours(c.studyMinutes, 15000),
    check: (c) => c.studyMinutes >= 15000,
  },
  {
    id: 'study_500h',
    category: 'study',
    title: 'Conhecimento de Aprovado',
    description: 'Acumule 500 horas líquidas de estudo teórico.',
    icon: '🎓',
    target: 30000,
    getCurrent: (c) => c.studyMinutes,
    formatProgress: (c) => fmtHours(c.studyMinutes, 30000),
    check: (c) => c.studyMinutes >= 30000,
  },

  // 2. Domínio de Banca (Questões)
  {
    id: 'q_100',
    category: 'questions',
    title: 'Primeira Bateria',
    description: 'Resolva 100 questões de concurso.',
    icon: '✏️',
    target: 100,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 100)} / 100`,
    check: (c) => c.questionsDone >= 100,
  },
  {
    id: 'q_500',
    category: 'questions',
    title: 'Certo ou Errado',
    description: 'Resolva 500 questões de concurso.',
    icon: '📝',
    target: 500,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 500)} / 500`,
    check: (c) => c.questionsDone >= 500,
  },
  {
    id: 'q_1500',
    category: 'questions',
    title: 'Terror do Cebraspe',
    description: 'Resolva 1.500 questões de concurso.',
    icon: '🎯',
    target: 1500,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 1500)} / 1.500`,
    check: (c) => c.questionsDone >= 1500,
  },
  {
    id: 'q_5000',
    category: 'questions',
    title: 'Gabarito Vivo',
    description: 'Resolva 5.000 questões de concurso.',
    icon: '🧠',
    target: 5000,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 5000)} / 5.000`,
    check: (c) => c.questionsDone >= 5000,
  },
  {
    id: 'q_10000',
    category: 'questions',
    title: 'Lenda das Bancas',
    description: 'Resolva 10.000 questões de concurso.',
    icon: '👑',
    target: 10000,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 10000)} / 10.000`,
    check: (c) => c.questionsDone >= 10000,
  },

  // 3. Pista do TAF (KM Corridos)
  {
    id: 'km_3',
    category: 'run',
    title: 'Teste de 12 Minutos',
    description: 'Corra seus primeiros 3 km acumulados (acima dos 2,4 km do TAF).',
    icon: '👟',
    target: 3,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 3),
    check: (c) => c.runKm >= 3,
  },
  {
    id: 'km_25',
    category: 'run',
    title: 'Fôlego de Pista',
    description: 'Acumule 25 km corridos no cárdio.',
    icon: '🏃',
    target: 25,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 25),
    check: (c) => c.runKm >= 25,
  },
  {
    id: 'km_75',
    category: 'run',
    title: 'Patrulheiro de Estrada',
    description: 'Acumule 75 km corridos no cárdio.',
    icon: '🛣️',
    target: 75,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 75),
    check: (c) => c.runKm >= 75,
  },
  {
    id: 'km_200',
    category: 'run',
    title: 'Motor V8',
    description: 'Acumule 200 km corridos no cárdio.',
    icon: '⚡',
    target: 200,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 200),
    check: (c) => c.runKm >= 200,
  },
  {
    id: 'km_500',
    category: 'run',
    title: 'Ultramaratonista PRF',
    description: 'Acumule 500 km corridos no cárdio.',
    icon: '🏅',
    target: 500,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 500),
    check: (c) => c.runKm >= 500,
  },

  // 4. Condicionamento Policial (Treinos & Combos)
  {
    id: 'wk_5',
    category: 'workout',
    title: 'Fim do Sedentarismo',
    description: 'Realize 5 treinos físicos.',
    icon: '💪',
    target: 5,
    getCurrent: (c) => c.workoutsCount,
    formatProgress: (c) => `${Math.min(c.workoutsCount, 5)} / 5`,
    check: (c) => c.workoutsCount >= 5,
  },
  {
    id: 'wk_20',
    category: 'workout',
    title: 'Rotina de Academia',
    description: 'Realize 20 treinos físicos.',
    icon: '🏋️',
    target: 20,
    getCurrent: (c) => c.workoutsCount,
    formatProgress: (c) => `${Math.min(c.workoutsCount, 20)} / 20`,
    check: (c) => c.workoutsCount >= 20,
  },
  {
    id: 'wk_50',
    category: 'workout',
    title: 'Pronto para o TAF',
    description: 'Realize 50 treinos físicos.',
    icon: '🔥',
    target: 50,
    getCurrent: (c) => c.workoutsCount,
    formatProgress: (c) => `${Math.min(c.workoutsCount, 50)} / 50`,
    check: (c) => c.workoutsCount >= 50,
  },
  {
    id: 'wk_100',
    category: 'workout',
    title: 'Físico Operacional',
    description: 'Realize 100 treinos físicos.',
    icon: '🦾',
    target: 100,
    getCurrent: (c) => c.workoutsCount,
    formatProgress: (c) => `${Math.min(c.workoutsCount, 100)} / 100`,
    check: (c) => c.workoutsCount >= 100,
  },
  {
    id: 'combo_15',
    category: 'workout',
    title: 'Treino Duplo Operacional',
    description: 'Realize 15 treinos Combo (Cárdio + Musculação).',
    icon: '⚔️',
    target: 15,
    getCurrent: (c) => c.comboCount,
    formatProgress: (c) => `${Math.min(c.comboCount, 15)} / 15`,
    check: (c) => c.comboCount >= 15,
  },

  // 5. Disciplina & Missões PRF
  {
    id: 'quest_5',
    category: 'discipline',
    title: 'Missão Cumprida',
    description: 'Conclua 5 Missões PRF.',
    icon: '📜',
    target: 5,
    getCurrent: (c) => c.questsCompleted,
    formatProgress: (c) => `${Math.min(c.questsCompleted, 5)} / 5`,
    check: (c) => c.questsCompleted >= 5,
  },
  {
    id: 'quest_25',
    category: 'discipline',
    title: 'Operador de Elite',
    description: 'Conclua 25 Missões PRF.',
    icon: '🎖️',
    target: 25,
    getCurrent: (c) => c.questsCompleted,
    formatProgress: (c) => `${Math.min(c.questsCompleted, 25)} / 25`,
    check: (c) => c.questsCompleted >= 25,
  },
  {
    id: 'quest_75',
    category: 'discipline',
    title: 'Disciplina de Ferro',
    description: 'Conclua 75 Missões PRF.',
    icon: '🏆',
    target: 75,
    getCurrent: (c) => c.questsCompleted,
    formatProgress: (c) => `${Math.min(c.questsCompleted, 75)} / 75`,
    check: (c) => c.questsCompleted >= 75,
  },
  {
    id: 'streak_7',
    category: 'discipline',
    title: 'Constância Inabalável',
    description: 'Alcance uma sequência de 7 dias no Check-in Diário.',
    icon: '📅',
    target: 7,
    getCurrent: (c) => c.checkInStreak,
    formatProgress: (c) => `${Math.min(c.checkInStreak, 7)} / 7 dias`,
    check: (c) => c.checkInStreak >= 7,
  },

  // 6. Carreira & Clã KTZ
  {
    id: 'lv_5',
    category: 'career',
    title: 'Especialização Definida',
    description: 'Alcance o Nível 5 e escolha sua classe.',
    icon: '⭐',
    target: 5,
    getCurrent: (c) => c.level,
    formatProgress: (c) => `Nv. ${Math.min(c.level, 5)} / 5`,
    check: (c) => c.level >= 5,
  },
  {
    id: 'lv_20',
    category: 'career',
    title: 'Agente de Patrulha',
    description: 'Alcance o Nível 20.',
    icon: '🚓',
    target: 20,
    getCurrent: (c) => c.level,
    formatProgress: (c) => `Nv. ${Math.min(c.level, 20)} / 20`,
    check: (c) => c.level >= 20,
  },
  {
    id: 'lv_50',
    category: 'career',
    title: 'Inspetor PRF',
    description: 'Alcance o Nível 50.',
    icon: '🦅',
    target: 50,
    getCurrent: (c) => c.level,
    formatProgress: (c) => `Nv. ${Math.min(c.level, 50)} / 50`,
    check: (c) => c.level >= 50,
  },
  {
    id: 'boss_10',
    category: 'career',
    title: 'Vanguarda da KTZ',
    description: 'Derrote 10 Bosses junto ao clã KTZ.',
    icon: '🛡️',
    target: 10,
    getCurrent: (c) => c.metrics.bossesDefeated,
    formatProgress: (c) => `${Math.min(c.metrics.bossesDefeated, 10)} / 10`,
    check: (c) => c.metrics.bossesDefeated >= 10,
  },
];

export type ArmoireReward =
  | { kind: 'equipment'; item: EquipmentItem; rarity: ItemRarity; label: string }
  | { kind: 'egg'; label: string }
  | { kind: 'potion'; label: string };

/**
 * Sorteia recompensa do Armoire Encantado (SEM OURO e SEM XP):
 * - 60% chance de Equipamento inédito ponderado por Raridade
 *   (Comum 50% · Incomum 28% · Raro 14% · Épico 6% · Lendário 2%)
 * - 40% chance de Recurso (50% Ovo, 50% Poção de Chocar)
 */
export function rollArmoireReward(ownedIds: string[] = []): ArmoireReward {
  const ownedSet = new Set(ownedIds);
  const unownedPool = EQUIPMENT_CATALOG.filter((item) => !ownedSet.has(item.id));

  if (unownedPool.length > 0 && Math.random() < 0.6) {
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

  return Math.random() < 0.5
    ? { kind: 'egg', label: '1x Ovo' }
    : { kind: 'potion', label: '1x Poção de Chocar' };
}

/**
 * Sorteia um equipamento inédito seguindo uma tabela de pesos de raridade.
 */
export function rollEquipmentFromWeights(
  ownedIds: string[] = [],
  weights: Partial<Record<ItemRarity, number>>
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  const ownedSet = new Set(ownedIds);
  const unownedPool = EQUIPMENT_CATALOG.filter((item) => !ownedSet.has(item.id));
  if (unownedPool.length === 0) return null;

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

  let availableRarities = (Object.keys(weights) as ItemRarity[]).filter(
    (r) => (weights[r] ?? 0) > 0 && byRarity[r].length > 0
  );
  if (availableRarities.length === 0) {
    availableRarities = (Object.keys(byRarity) as ItemRarity[]).filter(
      (r) => byRarity[r].length > 0
    );
  }

  const totalWeight = availableRarities.reduce(
    (acc, r) => acc + (weights[r] ?? RARITY_META[r].weight),
    0
  );
  let roll = Math.random() * totalWeight;
  let chosenRarity: ItemRarity = availableRarities[0];
  for (const r of availableRarities) {
    roll -= weights[r] ?? RARITY_META[r].weight;
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

/**
 * Sorteia um equipamento inédito garantido para o Baú de Honra PRF do Mês:
 * Raro 45% · Épico 40% · Lendário 15%.
 */
export function rollGuaranteedEquipment(
  ownedIds: string[] = []
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  return rollEquipmentFromWeights(ownedIds, { rare: 45, epic: 40, legendary: 15 });
}

/** Drop bônus (15%) ao concluir Missão Semanal PRF: Raro 75% · Épico 22% · Lendário 3%. */
export function rollWeeklyQuestEquipmentDrop(
  ownedIds: string[] = []
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  if (Math.random() > 0.15) return null;
  return rollEquipmentFromWeights(ownedIds, { rare: 75, epic: 22, legendary: 3 });
}

/** Drop de equipamento ao derrotar um Boss da KTZ (escala com o estágio do Boss). */
export function rollBossEquipmentDrop(
  ownedIds: string[] = [],
  bossStage = 1
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  const dropChance = bossStage >= 61 ? 0.65 : bossStage >= 26 ? 0.5 : 0.35;
  if (Math.random() > dropChance) return null;
  const weights: Partial<Record<ItemRarity, number>> =
    bossStage >= 61
      ? { rare: 40, epic: 45, legendary: 15 }
      : bossStage >= 26
      ? { rare: 55, epic: 35, legendary: 10 }
      : { rare: 70, epic: 25, legendary: 5 };
  return rollEquipmentFromWeights(ownedIds, weights);
}
