import { getDayKey } from './quests';

export interface CheckInState {
  lastClaimDayKey: string | null;
  streak: number;
  totalCheckIns: number;
}

export const DEFAULT_CHECKIN_STATE: CheckInState = {
  lastClaimDayKey: null,
  streak: 0,
  totalCheckIns: 0,
};

export interface CheckInRewardPreview {
  streak: number;
  streakMult: number;
  xp: number;
  gold: number;
  staRestore: number;
  mpRestore: number;
  milestoneBonus: 'none' | 'egg_or_potion' | 'egg_and_potion' | 'armoire';
  milestoneLabel: string | null;
}

/** Retorna a chave YYYY-MM-DD do dia anterior a um YYYY-MM-DD (em UTC calendário). */
function getPreviousDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function canClaimDailyCheckIn(
  state: CheckInState | undefined,
  now: Date = new Date()
): boolean {
  const todayKey = getDayKey(now);
  return state?.lastClaimDayKey !== todayKey;
}

/**
 * Calcula qual será o streak caso o jogador faça o check-in hoje,
 * ou mantém o streak atual caso já tenha feito check-in hoje.
 */
export function getProjectedStreak(
  state: CheckInState | undefined,
  now: Date = new Date()
): number {
  const todayKey = getDayKey(now);
  if (!state || !state.lastClaimDayKey) return 1;
  if (state.lastClaimDayKey === todayKey) return Math.max(1, state.streak);
  const yesterdayKey = getPreviousDayKey(todayKey);
  if (state.lastClaimDayKey === yesterdayKey) {
    return Math.max(1, state.streak) + 1;
  }
  return 1;
}

/**
 * Calcula a recompensa escalável por Nível + Sequência (1.0x até 1.6x).
 * - Ouro: round((12 + level * 2.5) * streakMult)
 * - XP: round((20 + level * 6 + level^1.45 * 1.2) * streakMult)
 * - Restauração: +15% Max STA e +15% Max MP
 * - Marcos de sequência: Dia 3 (Ovo/Poção), Dia 5 (Ovo + Poção), Dia 7, 14, 21... (Baú do Armoire Grátis)
 */
export function computeCheckInReward(
  level: number,
  maxHp: number,
  maxMp: number,
  streak: number
): CheckInRewardPreview {
  const safeLevel = Math.max(1, level);
  const safeStreak = Math.max(1, streak);
  const streakMult = 1 + Math.min(6, safeStreak - 1) * 0.1;

  const gold = Math.round((12 + safeLevel * 2.5) * streakMult);
  const xp = Math.round(
    (20 + safeLevel * 6 + Math.pow(safeLevel, 1.45) * 1.2) * streakMult
  );
  const staRestore = Math.max(5, Math.round(maxHp * 0.15));
  const mpRestore = Math.max(4, Math.round(maxMp * 0.15));

  const cycleDay = ((safeStreak - 1) % 7) + 1;
  let milestoneBonus: CheckInRewardPreview['milestoneBonus'] = 'none';
  let milestoneLabel: string | null = null;

  if (cycleDay === 3) {
    milestoneBonus = 'egg_or_potion';
    milestoneLabel = '🥚 +1 Ovo ou Poção de Chocar';
  } else if (cycleDay === 5) {
    milestoneBonus = 'egg_and_potion';
    milestoneLabel = '🥚 +1 Ovo e 🧪 +1 Poção de Chocar';
  } else if (cycleDay === 7) {
    milestoneBonus = 'armoire';
    milestoneLabel = '🎁 1 Baú do Armoire Encantado Grátis';
  }

  return {
    streak: safeStreak,
    streakMult,
    xp,
    gold,
    staRestore,
    mpRestore,
    milestoneBonus,
    milestoneLabel,
  };
}
