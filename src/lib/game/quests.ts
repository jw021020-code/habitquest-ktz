import { StudyEntry } from '@/components/StudyLogCard';
import { WorkoutEntry } from '@/components/WorkoutLogCard';

export type QuestCycle = 'daily' | 'weekly' | 'monthly';
export type QuestPillar = 'study_hours' | 'questions' | 'run_km' | 'workout';

export interface QuestReward {
  xp: number;
  gold: number;
  eggOrPotionChance?: number; // 0..1 (Diária: 0.25)
  guaranteedEggOrPotion?: boolean; // Semanal: true
  eggs?: number; // Mensal: 1
  potions?: number; // Mensal: 1
}

export interface QuestDefinition {
  id: string;
  cycle: QuestCycle;
  pillar: QuestPillar;
  title: string;
  description: string;
  icon: string;
  /** Meta numérica na unidade da métrica (minutos para estudo, unid para questões/treinos, km para corrida) */
  target: number;
  /** Unidade de exibição */
  unit: 'horas' | 'questões' | 'km' | 'treinos';
  reward: QuestReward;
}

export interface QuestsState {
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
}

export interface PeriodTotals {
  studyMinutes: number;
  questionsDone: number;
  runKm: number;
  workoutsCount: number;
}

export interface QuestProgressItem {
  def: QuestDefinition;
  current: number;
  target: number;
  pct: number;
  completed: boolean;
  claimed: boolean;
  displayCurrent: string;
  displayTarget: string;
}

export const MONTHLY_BONUS_REWARD = {
  xp: 1000,
  gold: 500,
};

export const DAILY_QUESTS_POOL: QuestDefinition[] = [
  {
    id: 'daily_study_hours',
    cycle: 'daily',
    pillar: 'study_hours',
    title: 'Ritmo de Aprovação: Horas de Estudo',
    description: 'Acumule 3 horas (180 min) de estudo teórico hoje.',
    icon: '📚',
    target: 180,
    unit: 'horas',
    reward: { xp: 90, gold: 45, eggOrPotionChance: 0.25 },
  },
  {
    id: 'daily_questions',
    cycle: 'daily',
    pillar: 'questions',
    title: 'Bateria Diária Cebraspe: Questões',
    description: 'Resolva 50 questões de concurso hoje.',
    icon: '✍️',
    target: 50,
    unit: 'questões',
    reward: { xp: 90, gold: 45, eggOrPotionChance: 0.25 },
  },
  {
    id: 'daily_run_km',
    cycle: 'daily',
    pillar: 'run_km',
    title: 'Pista do TAF: Corrida do Dia',
    description: 'Corra 3 km no cárdio hoje (acima da marca de 2,4 km do TAF).',
    icon: '🏃',
    target: 3,
    unit: 'km',
    reward: { xp: 90, gold: 45, eggOrPotionChance: 0.25 },
  },
  {
    id: 'daily_workout',
    cycle: 'daily',
    pillar: 'workout',
    title: 'Condicionamento Policial: Treino do Dia',
    description: 'Realize 1 treino físico hoje (Cárdio e/ou Musculação).',
    icon: '💪',
    target: 1,
    unit: 'treinos',
    reward: { xp: 90, gold: 45, eggOrPotionChance: 0.25 },
  },
];

export const WEEKLY_QUESTS_POOL: QuestDefinition[] = [
  {
    id: 'weekly_study_hours',
    cycle: 'weekly',
    pillar: 'study_hours',
    title: 'Carga Horária de Elite (Semanal)',
    description: 'Acumule 20 horas (1.200 min) de estudo teórico nesta semana.',
    icon: '📚',
    target: 1200,
    unit: 'horas',
    reward: { xp: 350, gold: 180, guaranteedEggOrPotion: true },
  },
  {
    id: 'weekly_questions',
    cycle: 'weekly',
    pillar: 'questions',
    title: 'Massacre de Bancas (Semanal)',
    description: 'Resolva 300 questões de concurso nesta semana.',
    icon: '✍️',
    target: 300,
    unit: 'questões',
    reward: { xp: 350, gold: 180, guaranteedEggOrPotion: true },
  },
  {
    id: 'weekly_run_km',
    cycle: 'weekly',
    pillar: 'run_km',
    title: 'Fôlego de Patrulheiro (Semanal)',
    description: 'Corra 15 km acumulados ao longo desta semana.',
    icon: '🏃',
    target: 15,
    unit: 'km',
    reward: { xp: 350, gold: 180, guaranteedEggOrPotion: true },
  },
  {
    id: 'weekly_workout',
    cycle: 'weekly',
    pillar: 'workout',
    title: 'Disciplina Física TAF (Semanal)',
    description: 'Realize 4 treinos físicos nesta semana.',
    icon: '💪',
    target: 4,
    unit: 'treinos',
    reward: { xp: 350, gold: 180, guaranteedEggOrPotion: true },
  },
];

export const MONTHLY_QUESTS_POOL: QuestDefinition[] = [
  {
    id: 'monthly_study_hours',
    cycle: 'monthly',
    pillar: 'study_hours',
    title: '1. Base Teórica de Aprovado (Mensal)',
    description: 'Meta Mensal PRF: acumule 80 horas de estudo teórico no mês.',
    icon: '📚',
    target: 4800,
    unit: 'horas',
    reward: { xp: 1000, gold: 500, eggs: 1, potions: 1 },
  },
  {
    id: 'monthly_questions',
    cycle: 'monthly',
    pillar: 'questions',
    title: '2. Domínio Cebraspe (Mensal)',
    description: 'Meta Mensal PRF: resolva 1.200 questões no mês.',
    icon: '✍️',
    target: 1200,
    unit: 'questões',
    reward: { xp: 1000, gold: 500, eggs: 1, potions: 1 },
  },
  {
    id: 'monthly_run_km',
    cycle: 'monthly',
    pillar: 'run_km',
    title: '3. Resistência Aeróbica TAF (Mensal)',
    description: 'Meta Mensal PRF: corra 60 km acumulados no mês.',
    icon: '🏃',
    target: 60,
    unit: 'km',
    reward: { xp: 1000, gold: 500, eggs: 1, potions: 1 },
  },
  {
    id: 'monthly_workout',
    cycle: 'monthly',
    pillar: 'workout',
    title: '4. Blindagem Física PRF (Mensal)',
    description: 'Meta Mensal PRF: realize 16 treinos físicos no mês.',
    icon: '💪',
    target: 16,
    unit: 'treinos',
    reward: { xp: 1000, gold: 500, eggs: 1, potions: 1 },
  },
];

const ALL_QUESTS_MAP = new Map<string, QuestDefinition>(
  [...DAILY_QUESTS_POOL, ...WEEKLY_QUESTS_POOL, ...MONTHLY_QUESTS_POOL].map((q) => [q.id, q])
);

export function getQuestById(id: string): QuestDefinition | undefined {
  return ALL_QUESTS_MAP.get(id);
}

/** Retorna YYYY-MM-DD no fuso de Brasília (America/Sao_Paulo). */
export function getDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Retorna YYYY-Www (Semana ISO começando na segunda-feira, fuso America/Sao_Paulo). */
export function getWeekKey(date: Date = new Date()): string {
  const dayKey = getDayKey(date);
  const [y, m, d] = dayKey.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  const dayNum = utcDate.getUTCDay() || 7; // 1 (Seg) .. 7 (Dom)
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Retorna YYYY-MM no fuso de Brasília. */
export function getMonthKey(date: Date = new Date()): string {
  return getDayKey(date).slice(0, 7);
}

function pickRandomIds(pool: QuestDefinition[], count: number): string[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count).map((q) => q.id);
}

export function createInitialQuestsState(now: Date = new Date()): QuestsState {
  return {
    dailyKey: getDayKey(now),
    dailyQuestIds: pickRandomIds(DAILY_QUESTS_POOL, 1),
    dailyClaimedIds: [],
    weeklyKey: getWeekKey(now),
    weeklyQuestIds: pickRandomIds(WEEKLY_QUESTS_POOL, 2),
    weeklyClaimedIds: [],
    monthlyKey: getMonthKey(now),
    monthlyClaimedIds: [],
    monthlyBonusClaimed: false,
    totalQuestsCompleted: 0,
  };
}

/** Garante que as missões sorteadas correspondam ao dia/semana/mês atuais. */
export function syncQuestsPeriod(
  current: QuestsState | undefined,
  now: Date = new Date()
): QuestsState {
  if (!current) return createInitialQuestsState(now);

  const dayKey = getDayKey(now);
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);

  const dailyChanged = current.dailyKey !== dayKey || !current.dailyQuestIds?.length;
  const weeklyChanged = current.weeklyKey !== weekKey || !current.weeklyQuestIds?.length;
  const monthlyChanged = current.monthlyKey !== monthKey;

  if (!dailyChanged && !weeklyChanged && !monthlyChanged) {
    return current;
  }

  return {
    dailyKey: dayKey,
    dailyQuestIds: dailyChanged ? pickRandomIds(DAILY_QUESTS_POOL, 1) : current.dailyQuestIds,
    dailyClaimedIds: dailyChanged ? [] : current.dailyClaimedIds ?? [],
    weeklyKey: weekKey,
    weeklyQuestIds: weeklyChanged ? pickRandomIds(WEEKLY_QUESTS_POOL, 2) : current.weeklyQuestIds,
    weeklyClaimedIds: weeklyChanged ? [] : current.weeklyClaimedIds ?? [],
    monthlyKey: monthKey,
    monthlyClaimedIds: monthlyChanged ? [] : current.monthlyClaimedIds ?? [],
    monthlyBonusClaimed: monthlyChanged ? false : Boolean(current.monthlyBonusClaimed),
    totalQuestsCompleted: current.totalQuestsCompleted ?? 0,
  };
}

function getEntryPeriodKeys(loggedAt?: string): {
  dayKey: string;
  weekKey: string;
  monthKey: string;
} | null {
  if (!loggedAt) return null;
  const d = new Date(loggedAt);
  if (Number.isNaN(d.getTime())) return null;
  return {
    dayKey: getDayKey(d),
    weekKey: getWeekKey(d),
    monthKey: getMonthKey(d),
  };
}

export function computePeriodTotals(
  studyEntries: StudyEntry[],
  workoutEntries: WorkoutEntry[],
  now: Date = new Date()
): { daily: PeriodTotals; weekly: PeriodTotals; monthly: PeriodTotals } {
  const curDay = getDayKey(now);
  const curWeek = getWeekKey(now);
  const curMonth = getMonthKey(now);

  const empty = (): PeriodTotals => ({
    studyMinutes: 0,
    questionsDone: 0,
    runKm: 0,
    workoutsCount: 0,
  });

  const daily = empty();
  const weekly = empty();
  const monthly = empty();

  for (const s of studyEntries) {
    const keys = getEntryPeriodKeys(s.loggedAt);
    if (!keys) continue;
    const mins = Math.max(0, s.minutes || 0);
    const qs = s.didQuestions ? Math.max(0, s.questionsDone || 0) : 0;

    if (keys.dayKey === curDay) {
      daily.studyMinutes += mins;
      daily.questionsDone += qs;
    }
    if (keys.weekKey === curWeek) {
      weekly.studyMinutes += mins;
      weekly.questionsDone += qs;
    }
    if (keys.monthKey === curMonth) {
      monthly.studyMinutes += mins;
      monthly.questionsDone += qs;
    }
  }

  for (const w of workoutEntries) {
    const keys = getEntryPeriodKeys(w.loggedAt);
    if (!keys) continue;
    const km = w.cardio ? Math.max(0, Number(w.km) || 0) : 0;
    const count = w.cardio || w.musculacao ? 1 : 0;

    if (keys.dayKey === curDay) {
      daily.runKm += km;
      daily.workoutsCount += count;
    }
    if (keys.weekKey === curWeek) {
      weekly.runKm += km;
      weekly.workoutsCount += count;
    }
    if (keys.monthKey === curMonth) {
      monthly.runKm += km;
      monthly.workoutsCount += count;
    }
  }

  return { daily, weekly, monthly };
}

function formatMetricValue(value: number, unit: QuestDefinition['unit']): string {
  if (unit === 'horas') {
    const hours = value / 60;
    const rounded = Math.round(hours * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1).replace('.', ',')}h`;
  }
  if (unit === 'km') {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1).replace('.', ',')} km`;
  }
  return `${Math.floor(value)}`;
}

function getRawValueForPillar(totals: PeriodTotals, pillar: QuestPillar): number {
  switch (pillar) {
    case 'study_hours':
      return totals.studyMinutes;
    case 'questions':
      return totals.questionsDone;
    case 'run_km':
      return Math.round(totals.runKm * 100) / 100;
    case 'workout':
      return totals.workoutsCount;
  }
}

export function buildQuestProgressList(
  questIds: string[],
  claimedIds: string[],
  totals: PeriodTotals
): QuestProgressItem[] {
  const claimedSet = new Set(claimedIds);
  const items: QuestProgressItem[] = [];

  for (const id of questIds) {
    const def = getQuestById(id);
    if (!def) continue;
    const raw = getRawValueForPillar(totals, def.pillar);
    const pct = Math.max(0, Math.min(100, Math.round((raw / def.target) * 100)));
    const completed = raw >= def.target;
    const claimed = claimedSet.has(def.id);

    items.push({
      def,
      current: raw,
      target: def.target,
      pct,
      completed,
      claimed,
      displayCurrent: formatMetricValue(Math.min(raw, def.target), def.unit),
      displayTarget: formatMetricValue(def.target, def.unit),
    });
  }

  return items;
}
