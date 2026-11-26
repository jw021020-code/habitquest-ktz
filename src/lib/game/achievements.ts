import {
  EQUIPMENT_CATALOG,
  EquipmentItem,
  getItemRarity,
  ItemRarity,
  RARITY_META,
} from './items';
import { CheckInState } from './checkin';
import { getCardioEquivalentKm } from './cardio';
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
  currentBossAssist?: number;
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
    recentDailyQuestIds?: string[];
    pendingMonthlyChest?: { monthKey: string; tier: 1 | 2 | 3 | 4 | 5 } | null;
  };
  checkin?: CheckInState;
  seasonSeen?: string;
  claimedCompensations?: string[];
  dailySkillCasts?: { dayKey: string; counts: Record<string, number> };
}

export const DEFAULT_METRICS: HeroMetrics = {
  tasksCompleted: 0,
  bossesDefeated: 0,
  criticalHits: 0,
  totalGoldEarned: 0,
  armoireOpened: 0,
  currentBossStage: 1,
  currentBossDamage: 0,
  currentBossAssist: 0,
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
  essaysDone: number;
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
  const essaysDone = studyEntries.reduce(
    (acc, s) => acc + (s.didEssay ? Math.max(0, s.essaysDone || 0) : 0),
    0
  );
  const runKm =
    Math.round(
      workoutEntries.reduce((acc, w) => acc + getCardioEquivalentKm(w), 0) * 10
    ) / 10;
  const workoutsCount = workoutEntries.reduce(
    (acc, w) => acc + (w.cardio ? 1 : 0) + (w.musculacao ? 1 : 0),
    0
  );
  const comboDayKeys = new Set<string>();
  const cardioDays = new Set<string>();
  const muscDays = new Set<string>();
  for (const w of workoutEntries) {
    const dayKey = w.loggedAt
      ? new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(w.loggedAt))
      : w.id;
    if (w.cardio && w.musculacao) {
      comboDayKeys.add(dayKey);
    } else if (w.cardio) {
      cardioDays.add(dayKey);
    } else if (w.musculacao) {
      muscDays.add(dayKey);
    }
  }
  for (const d of cardioDays) {
    if (muscDays.has(d)) comboDayKeys.add(d);
  }
  const comboCount = comboDayKeys.size;
  const questsCompleted = metrics.quests?.totalQuestsCompleted ?? 0;
  const checkInStreak = metrics.checkin?.streak ?? 0;

  return {
    level,
    metrics,
    studyMinutes,
    questionsDone,
    essaysDone,
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
    title: 'Primeiros Passos',
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
    title: 'Base Teórica',
    description: 'Acumule 50 horas líquidas de estudo teórico.',
    icon: '📖',
    target: 3000,
    getCurrent: (c) => c.studyMinutes,
    formatProgress: (c) => fmtHours(c.studyMinutes, 3000),
    check: (c) => c.studyMinutes >= 3000,
  },
  {
    id: 'study_100h',
    category: 'study',
    title: 'Mente Afiada',
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
    title: 'Erudito Dedicado',
    description: 'Acumule 250 horas líquidas de estudo teórico.',
    icon: '🏛️',
    target: 15000,
    getCurrent: (c) => c.studyMinutes,
    formatProgress: (c) => fmtHours(c.studyMinutes, 15000),
    check: (c) => c.studyMinutes >= 15000,
  },
  {
    id: 'study_500h',
    category: 'study',
    title: 'Mestre do Conhecimento',
    description: 'Acumule 500 horas líquidas de estudo teórico.',
    icon: '🎓',
    target: 30000,
    getCurrent: (c) => c.studyMinutes,
    formatProgress: (c) => fmtHours(c.studyMinutes, 30000),
    check: (c) => c.studyMinutes >= 30000,
  },
  {
    id: 'essay_1',
    category: 'study',
    title: 'Primeira Redação',
    description: 'Escreva sua primeira redação.',
    icon: '✍️',
    target: 1,
    getCurrent: (c) => c.essaysDone,
    formatProgress: (c) => `${Math.min(c.essaysDone, 1)} / 1`,
    check: (c) => c.essaysDone >= 1,
  },
  {
    id: 'essay_20',
    category: 'study',
    title: 'Redação Nota Máxima',
    description: 'Complete 20 redações.',
    icon: '📄',
    target: 20,
    getCurrent: (c) => c.essaysDone,
    formatProgress: (c) => `${Math.min(c.essaysDone, 20)} / 20`,
    check: (c) => c.essaysDone >= 20,
  },

  // 2. Domínio de Questões
  {
    id: 'q_100',
    category: 'questions',
    title: 'Primeira Bateria',
    description: 'Resolva 100 questões.',
    icon: '✏️',
    target: 100,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 100)} / 100`,
    check: (c) => c.questionsDone >= 100,
  },
  {
    id: 'q_500',
    category: 'questions',
    title: 'Ritmo de Prova',
    description: 'Resolva 500 questões.',
    icon: '📝',
    target: 500,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 500)} / 500`,
    check: (c) => c.questionsDone >= 500,
  },
  {
    id: 'q_1500',
    category: 'questions',
    title: 'Caçador de Gabaritos',
    description: 'Resolva 1.500 questões.',
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
    description: 'Resolva 5.000 questões.',
    icon: '🧠',
    target: 5000,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 5000)} / 5.000`,
    check: (c) => c.questionsDone >= 5000,
  },
  {
    id: 'q_10000',
    category: 'questions',
    title: 'Lenda das Provas',
    description: 'Resolva 10.000 questões.',
    icon: '👑',
    target: 10000,
    getCurrent: (c) => c.questionsDone,
    formatProgress: (c) => `${Math.min(c.questionsDone, 10000)} / 10.000`,
    check: (c) => c.questionsDone >= 10000,
  },

  // 3. Cárdio & Corrida (KM Percorridos)
  {
    id: 'km_3',
    category: 'run',
    title: 'Primeira Corrida',
    description: 'Percorra seus primeiros 3 km acumulados no cárdio.',
    icon: '👟',
    target: 3,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 3),
    check: (c) => c.runKm >= 3,
  },
  {
    id: 'km_25',
    category: 'run',
    title: 'Fôlego em Dia',
    description: 'Acumule 25 km no cárdio.',
    icon: '🏃',
    target: 25,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 25),
    check: (c) => c.runKm >= 25,
  },
  {
    id: 'km_75',
    category: 'run',
    title: 'Corredor de Longa Distância',
    description: 'Acumule 75 km no cárdio.',
    icon: '🛣️',
    target: 75,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 75),
    check: (c) => c.runKm >= 75,
  },
  {
    id: 'km_200',
    category: 'run',
    title: 'Resistência Máxima',
    description: 'Acumule 200 km no cárdio.',
    icon: '⚡',
    target: 200,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 200),
    check: (c) => c.runKm >= 200,
  },
  {
    id: 'km_500',
    category: 'run',
    title: 'Ultramaratonista',
    description: 'Acumule 500 km no cárdio.',
    icon: '🏅',
    target: 500,
    getCurrent: (c) => c.runKm,
    formatProgress: (c) => fmtKm(c.runKm, 500),
    check: (c) => c.runKm >= 500,
  },

  // 4. Condicionamento Físico (Treinos & Combos)
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
    title: 'Rotina Saudável',
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
    title: 'Corpo Blindado',
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
    title: 'Atleta Consistente',
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
    title: 'Treino Duplo de Elite',
    description: 'Realize 15 treinos Combo (Cárdio + Musculação).',
    icon: '⚔️',
    target: 15,
    getCurrent: (c) => c.comboCount,
    formatProgress: (c) => `${Math.min(c.comboCount, 15)} / 15`,
    check: (c) => c.comboCount >= 15,
  },

  // 5. Disciplina & Missões
  {
    id: 'quest_5',
    category: 'discipline',
    title: 'Missão Cumprida',
    description: 'Conclua 5 Missões.',
    icon: '📜',
    target: 5,
    getCurrent: (c) => c.questsCompleted,
    formatProgress: (c) => `${Math.min(c.questsCompleted, 5)} / 5`,
    check: (c) => c.questsCompleted >= 5,
  },
  {
    id: 'quest_25',
    category: 'discipline',
    title: 'Veterano de Missões',
    description: 'Conclua 25 Missões.',
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
    description: 'Conclua 75 Missões.',
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

  // 6. Evolução & Clã KTZ
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
    title: 'Aventureiro Experiente',
    description: 'Alcance o Nível 20.',
    icon: '⚔️',
    target: 20,
    getCurrent: (c) => c.level,
    formatProgress: (c) => `Nv. ${Math.min(c.level, 20)} / 20`,
    check: (c) => c.level >= 20,
  },
  {
    id: 'lv_50',
    category: 'career',
    title: 'Lenda da KTZ',
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
  | { kind: 'stable_pack'; eggs: number; potions: number; label: string };

/**
 * Sorteia recompensa do Armoire Encantado (SEM OURO e SEM XP):
 * - 75% chance de Equipamento inédito ponderado por Raridade
 *   (Comum 50% · Incomum 28% · Raro 14% · Épico 6% · Lendário 2%)
 * - 25% chance de Pacote de Estábulo (1x Ovo + 1x Poção de Chocar)
 */
export function rollArmoireReward(ownedIds: string[] = []): ArmoireReward {
  const ownedSet = new Set(ownedIds);
  const unownedPool = EQUIPMENT_CATALOG.filter((item) => !ownedSet.has(item.id));

  if (unownedPool.length > 0 && Math.random() < 0.75) {
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

  return {
    kind: 'stable_pack',
    eggs: 1,
    potions: 1,
    label: '1x Ovo + 1x Poção de Chocar',
  };
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
 * Sorteia um equipamento inédito para o Baú de Honra Mensal conforme o grau (1..5):
 * 1 Comum (75% Comum / 25% Incomum)
 * 2 Incomum (65% Incomum / 35% Raro)
 * 3 Raro (65% Raro / 30% Épico / 5% Lendário)
 * 4 Épico (80% Épico / 20% Lendário)
 * 5 Lendário (100% LENDÁRIO GARANTIDO!)
 */
export function rollMonthlyChestEquipment(
  tier: 1 | 2 | 3 | 4 | 5,
  ownedIds: string[] = []
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  const weightsByTier: Record<1 | 2 | 3 | 4 | 5, Partial<Record<ItemRarity, number>>> = {
    1: { common: 75, uncommon: 25 },
    2: { uncommon: 65, rare: 35 },
    3: { rare: 65, epic: 30, legendary: 5 },
    4: { epic: 80, legendary: 20 },
    5: { legendary: 100 },
  };
  return rollEquipmentFromWeights(ownedIds, weightsByTier[tier]);
}

export function rollGuaranteedEquipment(
  ownedIds: string[] = []
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  return rollMonthlyChestEquipment(5, ownedIds);
}

/**
 * Equipamento garantido de compensação proporcional aos Bosses perdidos:
 * 4 bosses perdidos (FousekOnly): Raro 45% · Épico 40% · Lendário 15%
 * 3 bosses perdidos (zxmcz): Raro 55% · Épico 35% · Lendário 10%
 */
export function rollCompensationEquipment(
  missedBosses: 3 | 4,
  ownedIds: string[] = []
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  const weights: Partial<Record<ItemRarity, number>> =
    missedBosses === 4
      ? { rare: 45, epic: 40, legendary: 15 }
      : { rare: 55, epic: 35, legendary: 10 };
  return rollEquipmentFromWeights(ownedIds, weights);
}

/** Drop bônus (15%) ao concluir Missão Semanal: Raro 75% · Épico 22% · Lendário 3%. */
export function rollWeeklyQuestEquipmentDrop(
  ownedIds: string[] = []
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  if (Math.random() > 0.15) return null;
  return rollEquipmentFromWeights(ownedIds, { rare: 75, epic: 22, legendary: 3 });
}

/** Drop de equipamento ao derrotar um Boss da KTZ (escala com o estágio do Boss e a faixa de contribuição). */
export function rollBossEquipmentDrop(
  ownedIds: string[] = [],
  bossStage = 1,
  equipMode: 'none' | 'support' | 'frontline' | 'vanguard' | 'mvp' = 'frontline'
): { item: EquipmentItem; rarity: ItemRarity; label: string } | null {
  if (equipMode === 'none') return null;

  const baseChance = bossStage >= 61 ? 1.0 : bossStage >= 26 ? 0.75 : 0.55;
  const chanceMult =
    equipMode === 'support' ? 0.6 : equipMode === 'vanguard' ? 1.3 : equipMode === 'mvp' ? 2.0 : 1.0;
  const finalChance = equipMode === 'mvp' ? 1.0 : Math.min(1.0, baseChance * chanceMult);
  if (Math.random() > finalChance) return null;

  let weights: Partial<Record<ItemRarity, number>>;
  if (equipMode === 'mvp') {
    weights = bossStage >= 26 ? { rare: 10, epic: 55, legendary: 35 } : { rare: 20, epic: 55, legendary: 25 };
  } else if (equipMode === 'vanguard') {
    weights = bossStage >= 26 ? { rare: 30, epic: 48, legendary: 22 } : { rare: 45, epic: 40, legendary: 15 };
  } else {
    weights =
      bossStage >= 61
        ? { rare: 30, epic: 48, legendary: 22 }
        : bossStage >= 26
          ? { rare: 45, epic: 40, legendary: 15 }
          : { rare: 60, epic: 32, legendary: 8 };
  }
  return rollEquipmentFromWeights(ownedIds, weights);
}
