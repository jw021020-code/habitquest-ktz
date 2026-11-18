import { Attributes, PlayableHeroClass } from './items';
import { ClassSkill } from './skills';

export interface PlayerStats {
  level: number;
  /** Estamina atual (0 = Exausto) */
  hp: number;
  /** Estamina máxima */
  max_hp: number;
  mp: number;
  max_mp: number;
  xp: number;
  xp_to_next: number;
  gold: number;
  heroClass: PlayableHeroClass;
  buffs: Attributes;
  allocatedStats?: Attributes;
  rebirths?: number;
}

export interface RewardPreview {
  xp: number;
  gold: number;
  bossDamage: number;
  staminaLost: number;
}

export const ZERO_ATTRS: Attributes = { str: 0, int: 0, con: 0, per: 0 };

export function getUnallocatedStatPoints(level: number, allocated?: Attributes): number {
  const a = allocated ?? ZERO_ATTRS;
  const spent = a.str + a.int + a.con + a.per;
  return Math.max(0, level - 1 - spent);
}

function applyLevelUps(
  level: number,
  xp: number,
  xpToNext: number,
  hp: number,
  maxHp: number,
  mp: number,
  maxMp: number,
  attrs: Attributes
) {
  let nextLevel = level;
  let nextXp = xp;
  let nextXpToNext = xpToNext;
  let nextHp = hp;
  let nextMaxHp = maxHp;
  let nextMp = mp;
  let nextMaxMp = maxMp;
  let leveledUp = false;

  while (nextXp >= nextXpToNext) {
    nextXp -= nextXpToNext;
    nextLevel += 1;
    nextXpToNext = Math.round(nextXpToNext * 1.25);
    nextMaxHp += 5;
    nextHp = nextMaxHp;
    nextMaxMp = 30 + attrs.int * 2 + nextLevel * 2;
    nextMp = nextMaxMp;
    leveledUp = true;
  }

  return {
    level: nextLevel,
    xp: nextXp,
    xp_to_next: nextXpToNext,
    hp: nextHp,
    max_hp: nextMaxHp,
    mp: nextMp,
    max_mp: nextMaxMp,
    leveledUp,
  };
}

/**
 * Concede XP/Ouro de fontes externas (vitória de Boss, Armoire Encantado etc.)
 * garantindo sempre verificação de Level-Up, restauração opcional de 100% STA/MP
 * e reset de buffs temporários de combate.
 */
export function grantXpAndResources(
  stats: PlayerStats,
  attrs: Attributes,
  opts: {
    xp?: number;
    goldDelta?: number;
    fullRestore?: boolean;
    resetBuffs?: boolean;
  }
): { nextStats: PlayerStats; leveledUp: boolean } {
  const effectiveAttrs = opts.resetBuffs
    ? {
        str: Math.max(0, attrs.str - stats.buffs.str),
        int: Math.max(0, attrs.int - stats.buffs.int),
        con: Math.max(0, attrs.con - stats.buffs.con),
        per: Math.max(0, attrs.per - stats.buffs.per),
      }
    : attrs;

  const baseMaxMp = Math.max(stats.max_mp, 30 + effectiveAttrs.int * 2 + stats.level * 2);
  const startHp = opts.fullRestore ? stats.max_hp : stats.hp;
  const startMp = opts.fullRestore ? baseMaxMp : stats.mp;

  const progressed = applyLevelUps(
    stats.level,
    stats.xp + (opts.xp ?? 0),
    stats.xp_to_next,
    startHp,
    stats.max_hp,
    startMp,
    baseMaxMp,
    effectiveAttrs
  );

  return {
    nextStats: {
      ...stats,
      level: progressed.level,
      hp: opts.fullRestore ? progressed.max_hp : progressed.hp,
      max_hp: progressed.max_hp,
      mp: opts.fullRestore ? progressed.max_mp : progressed.mp,
      max_mp: progressed.max_mp,
      xp: progressed.xp,
      xp_to_next: progressed.xp_to_next,
      gold: Math.max(0, stats.gold + (opts.goldDelta ?? 0)),
      buffs: opts.resetBuffs ? { ...ZERO_ATTRS } : stats.buffs,
    },
    leveledUp: progressed.leveledUp,
  };
}

function computeBasePreview(
  stats: PlayerStats,
  baseXp: number,
  baseGold: number,
  baseBossDamage: number,
  attrs: Attributes,
  bossAttack: number
): RewardPreview {
  const exhaustMult = stats.hp <= 0 ? 0.7 : 1.0;
  const xp = Math.max(1, Math.round(baseXp * (1 + attrs.int * 0.02)));
  const gold = Math.max(1, Math.round(baseGold * (1 + attrs.per * 0.02) * exhaustMult));
  const bossDamage = Math.max(1, Math.round(baseBossDamage * (1 + attrs.str * 0.02) * exhaustMult));
  const conMitigation = Math.max(0.35, 1 - attrs.con * 0.02);
  const staminaLost = Math.max(2, Math.round(bossAttack * 0.45 * conMitigation));
  return { xp, gold, bossDamage, staminaLost };
}

/**
 * Prévia determinística (sem sorteio de crítico) para exibir em tempo real no card de Estudo.
 */
export function previewStudyReward(
  stats: PlayerStats,
  minutes: number,
  didQuestions: boolean,
  questionsDone: number,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12
): RewardPreview {
  const safeMinutes = Math.max(1, minutes || 1);
  const safeQuestions = didQuestions ? Math.max(0, questionsDone || 0) : 0;
  const timeFactor = Math.max(0.5, safeMinutes / 30);
  const questionBonus = safeQuestions * 0.08;
  const totalFactor = timeFactor + questionBonus;

  return computeBasePreview(
    stats,
    14 * totalFactor,
    5 * totalFactor,
    8 * totalFactor,
    attrs,
    bossAttack
  );
}

/**
 * Prévia determinística (sem sorteio de crítico) para exibir em tempo real no card de Treino.
 */
export function previewWorkoutReward(
  stats: PlayerStats,
  cardio: boolean,
  musculacao: boolean,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12
): RewardPreview {
  const count = (cardio ? 1 : 0) + (musculacao ? 1 : 0);
  if (count === 0) {
    return { xp: 0, gold: 0, bossDamage: 0, staminaLost: 0 };
  }
  const mult = count === 2 ? 2.2 : 1.0;
  return computeBasePreview(stats, 18 * mult, 7 * mult, 12 * mult, attrs, bossAttack);
}

function applyProgressReward(
  stats: PlayerStats,
  baseXp: number,
  baseGold: number,
  baseBossDamage: number,
  baseMp: number,
  attrs: Attributes,
  bossAttack: number
) {
  const isExhausted = stats.hp <= 0;
  // Exausto reduz apenas Ouro e Dano (-30%), NUNCA reduz XP
  const exhaustMult = isExhausted ? 0.7 : 1.0;

  const critChance = Math.min(0.35, 0.08 + (attrs.str + attrs.per) * 0.004);
  const isCritical = Math.random() < critChance;
  const critMult = isCritical ? 1.5 : 1.0;

  const gainedXp = Math.max(1, Math.round(baseXp * (1 + attrs.int * 0.02) * critMult));
  const gainedGold = Math.max(
    1,
    Math.round(baseGold * (1 + attrs.per * 0.02) * critMult * exhaustMult)
  );
  const bossDamage = Math.max(
    1,
    Math.round(baseBossDamage * (1 + attrs.str * 0.02) * critMult * exhaustMult)
  );
  const gainedMp = Math.max(1, Math.round(baseMp + attrs.int * 0.15));

  // Contra-ataque do Boss consome Estamina (reduzido por CON, nunca mata)
  const conMitigation = Math.max(0.35, 1 - attrs.con * 0.02);
  const staminaLost = Math.max(2, Math.round(bossAttack * 0.45 * conMitigation));
  const staminaAfterHit = Math.max(0, stats.hp - staminaLost);

  const maxMp = Math.max(stats.max_mp, 30 + attrs.int * 2 + stats.level * 2);
  const regeneratedMp = Math.min(maxMp, stats.mp + gainedMp);

  const progressed = applyLevelUps(
    stats.level,
    stats.xp + gainedXp,
    stats.xp_to_next,
    staminaAfterHit,
    stats.max_hp,
    regeneratedMp,
    maxMp,
    attrs
  );

  return {
    nextStats: {
      ...stats,
      level: progressed.level,
      hp: progressed.hp,
      max_hp: progressed.max_hp,
      mp: progressed.mp,
      max_mp: progressed.max_mp,
      xp: progressed.xp,
      xp_to_next: progressed.xp_to_next,
      gold: stats.gold + gainedGold,
    },
    deltaXp: gainedXp,
    deltaGold: gainedGold,
    deltaMp: progressed.mp - stats.mp,
    staminaLost,
    bossDamage,
    leveledUp: progressed.leveledUp,
    isCritical,
    becameExhausted: stats.hp > 0 && progressed.hp === 0,
  };
}

/**
 * Calcula recompensa RPG ao registrar Estudo Teórico (tempo em minutos + questões feitas).
 */
export function calculateStudyReward(
  stats: PlayerStats,
  minutes: number,
  didQuestions: boolean,
  questionsDone: number,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12
) {
  const safeMinutes = Math.max(1, minutes);
  const safeQuestions = didQuestions ? Math.max(0, questionsDone) : 0;

  const timeFactor = Math.max(0.5, safeMinutes / 30);
  const questionBonus = safeQuestions * 0.08;
  const totalFactor = timeFactor + questionBonus;

  return applyProgressReward(
    stats,
    14 * totalFactor,
    5 * totalFactor,
    8 * totalFactor,
    3 * Math.min(3, totalFactor),
    attrs,
    bossAttack
  );
}

/**
 * Calcula recompensa RPG ao registrar Treinamento Físico (Cárdio e/ou Musculação).
 */
export function calculateWorkoutReward(
  stats: PlayerStats,
  cardio: boolean,
  musculacao: boolean,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12
) {
  const count = (cardio ? 1 : 0) + (musculacao ? 1 : 0);
  const mult = count === 2 ? 2.2 : 1.0;

  return applyProgressReward(
    stats,
    18 * mult,
    7 * mult,
    12 * mult,
    4 * mult,
    attrs,
    bossAttack
  );
}

/**
 * Executa uma habilidade da classe gastando Mana (MP).
 */
export function applyClassSkill(
  stats: PlayerStats,
  skill: ClassSkill,
  attrs: Attributes,
  bossAttack = 12
): {
  ok: boolean;
  reason?: 'no_mp' | 'full_stamina' | 'buff_maxed';
  nextStats: PlayerStats;
  bossDamage: number;
  healedHp: number;
  gainedXp: number;
  gainedGold: number;
  staminaLost: number;
  leveledUp: boolean;
} {
  if (stats.mp < skill.mpCost) {
    return {
      ok: false,
      reason: 'no_mp',
      nextStats: stats,
      bossDamage: 0,
      healedHp: 0,
      gainedXp: 0,
      gainedGold: 0,
      staminaLost: 0,
      leveledUp: false,
    };
  }

  if (skill.kind === 'heal' && stats.hp >= stats.max_hp) {
    return {
      ok: false,
      reason: 'full_stamina',
      nextStats: stats,
      bossDamage: 0,
      healedHp: 0,
      gainedXp: 0,
      gainedGold: 0,
      staminaLost: 0,
      leveledUp: false,
    };
  }

  if (skill.kind === 'buff' && skill.buffDelta) {
    const cap = skill.id === 'protective_aura' ? 16 : 15;
    const nextStr = Math.min(cap, stats.buffs.str + (skill.buffDelta.str ?? 0));
    const nextInt = Math.min(cap, stats.buffs.int + (skill.buffDelta.int ?? 0));
    const nextCon = Math.min(cap, stats.buffs.con + (skill.buffDelta.con ?? 0));
    const nextPer = Math.min(cap, stats.buffs.per + (skill.buffDelta.per ?? 0));

    if (
      nextStr === stats.buffs.str &&
      nextInt === stats.buffs.int &&
      nextCon === stats.buffs.con &&
      nextPer === stats.buffs.per
    ) {
      return {
        ok: false,
        reason: 'buff_maxed',
        nextStats: stats,
        bossDamage: 0,
        healedHp: 0,
        gainedXp: 0,
        gainedGold: 0,
        staminaLost: 0,
        leveledUp: false,
      };
    }

    return {
      ok: true,
      nextStats: {
        ...stats,
        mp: stats.mp - skill.mpCost,
        buffs: {
          str: nextStr,
          int: nextInt,
          con: nextCon,
          per: nextPer,
        },
      },
      bossDamage: 0,
      healedHp: 0,
      gainedXp: 0,
      gainedGold: 0,
      staminaLost: 0,
      leveledUp: false,
    };
  }

  const exhaustMult = stats.hp <= 0 ? 0.7 : 1.0;

  let nextStats: PlayerStats = {
    ...stats,
    mp: stats.mp - skill.mpCost,
  };
  let bossDamage = 0;
  let healedHp = 0;
  let gainedXp = 0;
  let gainedGold = 0;
  let staminaLost = 0;
  let leveledUp = false;

  if (skill.kind === 'damage') {
    if (stats.heroClass === 'warrior') {
      bossDamage = Math.max(1, Math.round((22 + attrs.str * 2) * exhaustMult));
    } else if (stats.heroClass === 'wizard') {
      bossDamage = Math.max(1, Math.round((20 + attrs.int * 2) * exhaustMult));
    } else {
      bossDamage = Math.max(1, Math.round((16 + attrs.per * 2) * exhaustMult));
      gainedGold = Math.max(1, Math.round((4 + Math.floor(attrs.per * 0.5)) * exhaustMult));
      nextStats.gold += gainedGold;
    }
    const conMitigation = Math.max(0.35, 1 - attrs.con * 0.02);
    staminaLost = Math.max(2, Math.round(bossAttack * 0.45 * conMitigation));
    nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
  } else if (skill.kind === 'heal') {
    healedHp = Math.min(
      nextStats.max_hp - nextStats.hp,
      15 + attrs.con + Math.floor(attrs.int * 0.5)
    );
    nextStats.hp += healedHp;
  } else if (skill.kind === 'xp') {
    gainedXp = 25 + attrs.int * 2;
    const progressed = applyLevelUps(
      nextStats.level,
      nextStats.xp + gainedXp,
      nextStats.xp_to_next,
      nextStats.hp,
      nextStats.max_hp,
      nextStats.mp,
      nextStats.max_mp,
      attrs
    );
    nextStats = { ...nextStats, ...progressed };
    leveledUp = progressed.leveledUp;
  } else if (skill.kind === 'gold') {
    gainedGold = Math.max(1, Math.round((12 + attrs.per * 2) * exhaustMult));
    nextStats.gold += gainedGold;
  }

  return {
    ok: true,
    nextStats,
    bossDamage,
    healedHp,
    gainedXp,
    gainedGold,
    staminaLost,
    leveledUp,
  };
}
