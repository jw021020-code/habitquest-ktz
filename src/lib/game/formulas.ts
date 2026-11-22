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
  /** Cargas de redução de dano de Estamina (-50%) da Postura Defensiva (Escudeiro) */
  guardCharges?: number;
  /** Crítico garantido (1.75x) e ignora Exaustão no próximo ataque (Espadachim) */
  critGuarantee?: boolean;
  /** Cargas de +20% crítico e -40% perda de Estamina de Passos Sombrios (Batedor) */
  shadowCharges?: number;
}

export interface BossCombatModifiers {
  vulnerable?: boolean; // +20% dano recebido pelo Boss
  weakened?: boolean; // -25% ataque do Boss
}

export interface RewardPreview {
  xp: number;
  gold: number;
  bossDamage: number;
  staminaLost: number;
}

export const ZERO_ATTRS: Attributes = { str: 0, int: 0, con: 0, per: 0 };

/**
 * Curva polinomial equilibrada de XP para o próximo nível:
 * Nível 1->2 = 350 | Nível 5->6 = 1.054 | Nível 10->11 = 2.339 | Nível 50->51 = 28.819
 */
export function getXpToNextLevel(level: number): number {
  const safe = Math.max(1, level);
  return 350 + (safe - 1) * 140 + Math.pow(safe - 1, 2) * 9;
}

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
  let nextXpToNext = getXpToNextLevel(level);
  let nextHp = hp;
  let nextMaxHp = maxHp;
  let nextMp = mp;
  let nextMaxMp = maxMp;
  let leveledUp = false;

  while (nextXp >= nextXpToNext) {
    nextXp -= nextXpToNext;
    nextLevel += 1;
    nextXpToNext = getXpToNextLevel(nextLevel);
    nextMaxHp += 5;
    nextHp = Math.min(nextMaxHp, nextHp + Math.round(nextMaxHp * 0.4));
    nextMaxMp = 30 + attrs.int * 2 + nextLevel * 2;
    nextMp = Math.min(nextMaxMp, nextMp + Math.round(nextMaxMp * 0.25));
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
 * Concede XP/Ouro de fontes permitidas (vitória de Boss, estudos/treinos, ouro de baú)
 * garantindo verificação de Level-Up, restauração opcional de STA/MP
 * e reset de buffs temporários de combate.
 */
export function grantXpAndResources(
  stats: PlayerStats,
  attrs: Attributes,
  opts: {
    xp?: number;
    goldDelta?: number;
    fullRestore?: boolean;
    bossVictoryRestore?: boolean;
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
  const startHp = opts.fullRestore
    ? stats.max_hp
    : opts.bossVictoryRestore
    ? Math.min(stats.max_hp, stats.hp + Math.round(stats.max_hp * 0.25))
    : stats.hp;
  const startMp = opts.fullRestore
    ? baseMaxMp
    : opts.bossVictoryRestore
    ? Math.min(baseMaxMp, stats.mp + Math.round(baseMaxMp * 0.15))
    : stats.mp;

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
      guardCharges: opts.resetBuffs ? 0 : stats.guardCharges,
      critGuarantee: opts.resetBuffs ? false : stats.critGuarantee,
      shadowCharges: opts.resetBuffs ? 0 : stats.shadowCharges,
    },
    leveledUp: progressed.leveledUp,
  };
}

function computeStaminaLoss(
  bossAttack: number,
  attrs: Attributes,
  stats: PlayerStats,
  bossMods?: BossCombatModifiers,
  extraMitigationMult = 1.0
): number {
  const conMitigation = Math.max(0.35, 1 - attrs.con * 0.02);
  const bossWeakMult = bossMods?.weakened ? 0.75 : 1.0;
  const guardMult = (stats.guardCharges ?? 0) > 0 ? 0.5 : 1.0;
  const shadowMult = (stats.shadowCharges ?? 0) > 0 ? 0.6 : 1.0;
  return Math.max(
    1,
    Math.round(
      bossAttack * 0.85 * conMitigation * bossWeakMult * guardMult * shadowMult * extraMitigationMult
    )
  );
}

export function getLevelScale(level: number): number {
  return 1 + Math.min(3.5, Math.max(0, level - 1) * 0.055);
}

export function getQuestScale(level: number): number {
  return 1 + Math.min(2.0, Math.max(0, level - 1) * 0.03);
}

/**
 * Calcula o Nível de Referência da Guilda usando a média dos Top 3 membros mais altos.
 */
export function getGuildReferenceLevel(memberLevels: number[]): number {
  const valid = memberLevels.filter((l) => Number.isFinite(l) && l >= 1).sort((a, b) => b - a);
  if (valid.length === 0) return 1;
  const top = valid.slice(0, 3);
  const avg = top.reduce((acc, l) => acc + l, 0) / top.length;
  return Math.max(1, Math.round(avg));
}

/**
 * Impulso da Guilda (Catch-Up de XP):
 * Jogadores 2+ níveis abaixo da referência da KTZ ganham +12% XP por nível de atraso (até +100% / 2.0x)
 * exclusivamente em Estudos e Treinos Físicos.
 */
export function getCatchUpInfo(
  playerLevel: number,
  referenceLevel: number
): { diff: number; bonusPercent: number; multiplier: number } {
  const diff = Math.max(0, referenceLevel - playerLevel);
  if (diff < 2) {
    return { diff, bonusPercent: 0, multiplier: 1.0 };
  }
  const multiplier = Math.min(2.0, Math.round((1.0 + diff * 0.12) * 100) / 100);
  const bonusPercent = Math.round((multiplier - 1) * 100);
  return { diff, bonusPercent, multiplier };
}

function computeBasePreview(
  stats: PlayerStats,
  baseXp: number,
  baseGold: number,
  baseBossDamage: number,
  attrs: Attributes,
  bossAttack: number,
  bossMods?: BossCombatModifiers,
  effortScale = 1.0,
  catchUpMult = 1.0
): RewardPreview {
  if (baseXp <= 0) {
    return { xp: 0, gold: 0, bossDamage: 0, staminaLost: 0 };
  }
  const exhaustMult = stats.hp <= 0 && !stats.critGuarantee ? 0.7 : 1.0;
  const vulnMult = bossMods?.vulnerable ? 1.2 : 1.0;
  const levelScale = getLevelScale(stats.level);
  // XP é 100% neutro de classe/atributos (INT e Crítico não alteram XP)
  const xp = Math.max(1, Math.round(baseXp * levelScale * Math.max(1, catchUpMult)));
  const gold = Math.max(1, Math.round(baseGold * (1 + attrs.per * 0.02) * exhaustMult));
  const bossDamage = Math.max(
    1,
    Math.round(
      baseBossDamage *
        (1 + attrs.str * 0.02 + attrs.int * 0.012) *
        exhaustMult *
        vulnMult *
        levelScale
    )
  );
  const staminaLost = computeStaminaLoss(bossAttack, attrs, stats, bossMods, effortScale);
  return { xp, gold, bossDamage, staminaLost };
}

/**
 * Prévia determinística para exibir em tempo real no card de Estudo.
 * Linearidade pura: minutos=0 é permitido quando houver questões ou redação.
 */
export function previewStudyReward(
  stats: PlayerStats,
  minutes: number,
  didQuestions: boolean,
  questionsDone: number,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12,
  bossMods?: BossCombatModifiers,
  didEssay = false,
  essaysDone = 0,
  catchUpMult = 1.0
): RewardPreview {
  const safeMinutes = Math.max(0, minutes || 0);
  const safeQuestions = didQuestions ? Math.max(0, questionsDone || 0) : 0;
  const safeEssays = didEssay ? Math.max(0, essaysDone || 0) : 0;
  const totalFactor = safeMinutes / 30 + safeQuestions * 0.08 + safeEssays * 2.0;

  if (totalFactor <= 0) {
    return { xp: 0, gold: 0, bossDamage: 0, staminaLost: 0 };
  }

  const effortScale = Math.min(2.0, Math.max(0.15, totalFactor / 2.0));

  return computeBasePreview(
    stats,
    26 * totalFactor,
    6 * totalFactor,
    10 * totalFactor,
    attrs,
    bossAttack,
    bossMods,
    effortScale,
    catchUpMult
  );
}

/**
 * Prévia determinística para exibir em tempo real no card de Treino.
 * kmEq já vem convertido pela modalidade (Corrida 1x, Caminhada 0.5x, Bike 0.333x, HIIT 0.12/min).
 */
export function previewWorkoutReward(
  stats: PlayerStats,
  cardio: boolean,
  musculacao: boolean,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12,
  bossMods?: BossCombatModifiers,
  kmEq = 0,
  hasDualDailyBonus = false,
  catchUpMult = 1.0
): RewardPreview {
  if (!cardio && !musculacao) {
    return { xp: 0, gold: 0, bossDamage: 0, staminaLost: 0 };
  }
  const safeKmEq = cardio ? Math.min(15, Math.max(0, Number(kmEq) || 0)) : 0;
  if (cardio && !musculacao && safeKmEq <= 0) {
    return { xp: 0, gold: 0, bossDamage: 0, staminaLost: 0 };
  }

  const baseXp = (musculacao ? 55 : 0) + (cardio ? 28 * safeKmEq : 0) + (hasDualDailyBonus ? 25 : 0);
  const baseGold = (musculacao ? 8 : 0) + (cardio ? 4 * safeKmEq : 0) + (hasDualDailyBonus ? 6 : 0);
  const baseDmg = (musculacao ? 14 : 0) + (cardio ? 8 * safeKmEq : 0) + (hasDualDailyBonus ? 10 : 0);
  const effortScale =
    cardio && !musculacao ? Math.min(2.0, Math.max(0.2, safeKmEq / 3.0)) : 1.0;

  return computeBasePreview(
    stats,
    baseXp,
    baseGold,
    baseDmg,
    attrs,
    bossAttack,
    bossMods,
    effortScale,
    catchUpMult
  );
}

function applyProgressReward(
  stats: PlayerStats,
  baseXp: number,
  baseGold: number,
  baseBossDamage: number,
  baseMp: number,
  attrs: Attributes,
  bossAttack: number,
  bossMods?: BossCombatModifiers,
  effortScale = 1.0,
  effortFactor = 1.5,
  catchUpMult = 1.0
) {
  const guaranteedCrit = Boolean(stats.critGuarantee);
  const isExhausted = stats.hp <= 0 && !guaranteedCrit;
  const exhaustMult = isExhausted ? 0.7 : 1.0;
  const vulnMult = bossMods?.vulnerable ? 1.2 : 1.0;
  const levelScale = getLevelScale(stats.level);

  const shadowBonusCrit = (stats.shadowCharges ?? 0) > 0 ? 0.2 : 0;
  const critChance = Math.min(0.55, 0.08 + (attrs.str + attrs.per) * 0.004 + shadowBonusCrit);
  const isCritical = guaranteedCrit || Math.random() < critChance;
  const critMult = guaranteedCrit ? 1.75 : isCritical ? 1.5 : 1.0;

  // XP é 100% neutro de classe (sem bônus de INT nem de Crítico), com Impulso Catch-Up quando aplicável
  const gainedXp = Math.max(1, Math.round(baseXp * levelScale * Math.max(1, catchUpMult)));
  const gainedGold = Math.max(
    1,
    Math.round(baseGold * (1 + attrs.per * 0.02) * critMult * exhaustMult)
  );
  const bossDamage = Math.max(
    1,
    Math.round(
      baseBossDamage *
        (1 + attrs.str * 0.02 + attrs.int * 0.012) *
        levelScale *
        critMult *
        exhaustMult *
        vulnMult
    )
  );
  const gainedMp = Math.max(1, Math.round(baseMp + attrs.int * 0.2 * Math.min(1.5, effortScale)));

  const staminaLost = computeStaminaLoss(bossAttack, attrs, stats, bossMods, effortScale);
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
      guardCharges: Math.max(0, (stats.guardCharges ?? 0) - 1),
      shadowCharges: Math.max(0, (stats.shadowCharges ?? 0) - 1),
      critGuarantee: false,
    },
    deltaXp: gainedXp,
    deltaGold: gainedGold,
    deltaMp: progressed.mp - stats.mp,
    staminaLost,
    bossDamage,
    leveledUp: progressed.leveledUp,
    isCritical,
    becameExhausted: stats.hp > 0 && progressed.hp === 0,
    effortFactor,
  };
}

export function calculateStudyReward(
  stats: PlayerStats,
  minutes: number,
  didQuestions: boolean,
  questionsDone: number,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12,
  bossMods?: BossCombatModifiers,
  didEssay = false,
  essaysDone = 0,
  catchUpMult = 1.0
) {
  const safeMinutes = Math.max(0, minutes || 0);
  const safeQuestions = didQuestions ? Math.max(0, questionsDone || 0) : 0;
  const safeEssays = didEssay ? Math.max(0, essaysDone || 0) : 0;
  const totalFactor = safeMinutes / 30 + safeQuestions * 0.08 + safeEssays * 2.0;
  const effortScale = Math.min(2.0, Math.max(0.15, totalFactor / 2.0));

  return applyProgressReward(
    stats,
    26 * totalFactor,
    6 * totalFactor,
    10 * totalFactor,
    4 * Math.min(3, totalFactor),
    attrs,
    bossAttack,
    bossMods,
    effortScale,
    totalFactor,
    catchUpMult
  );
}

export function calculateWorkoutReward(
  stats: PlayerStats,
  cardio: boolean,
  musculacao: boolean,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12,
  bossMods?: BossCombatModifiers,
  kmEq = 0,
  hasDualDailyBonus = false,
  catchUpMult = 1.0
) {
  const safeKmEq = cardio ? Math.min(15, Math.max(0, Number(kmEq) || 0)) : 0;
  const baseXp = (musculacao ? 55 : 0) + (cardio ? 28 * safeKmEq : 0) + (hasDualDailyBonus ? 25 : 0);
  const baseGold = (musculacao ? 8 : 0) + (cardio ? 4 * safeKmEq : 0) + (hasDualDailyBonus ? 6 : 0);
  const baseDmg = (musculacao ? 14 : 0) + (cardio ? 8 * safeKmEq : 0) + (hasDualDailyBonus ? 10 : 0);
  const baseMp =
    (musculacao ? 5 : 0) +
    (cardio ? Math.min(10, Math.max(2, safeKmEq * 1.5)) : 0) +
    (hasDualDailyBonus ? 2 : 0);
  const effortScale =
    cardio && !musculacao ? Math.min(2.0, Math.max(0.2, safeKmEq / 3.0)) : 1.0;

  return applyProgressReward(
    stats,
    baseXp,
    baseGold,
    baseDmg,
    baseMp,
    attrs,
    bossAttack,
    bossMods,
    effortScale,
    1.5,
    catchUpMult
  );
}

export interface SkillCastResult {
  ok: boolean;
  reason?: 'no_mp' | 'full_stamina' | 'buff_maxed';
  nextStats: PlayerStats;
  bossDamage: number;
  healedHp: number;
  gainedGold: number;
  staminaLost: number;
  dodged?: boolean;
  bonusDropRoll?: boolean;
  groupHealAmount?: number;
  groupManaAmount?: number;
  groupBuffDelta?: Partial<Attributes>;
  appliedBossVulnerable?: boolean;
  appliedBossWeakened?: boolean;
}

/**
 * Executa qualquer uma das 18 habilidades (ZERO XP concedido por skills).
 */
export function applyClassSkill(
  stats: PlayerStats,
  skill: ClassSkill,
  attrs: Attributes,
  bossAttack = 12,
  bossMods?: BossCombatModifiers
): SkillCastResult {
  if (stats.mp < skill.mpCost) {
    return {
      ok: false,
      reason: 'no_mp',
      nextStats: stats,
      bossDamage: 0,
      healedHp: 0,
      gainedGold: 0,
      staminaLost: 0,
    };
  }

  if (skill.id === 'quick_breath' && stats.hp >= stats.max_hp) {
    return {
      ok: false,
      reason: 'full_stamina',
      nextStats: stats,
      bossDamage: 0,
      healedHp: 0,
      gainedGold: 0,
      staminaLost: 0,
    };
  }

  const guaranteedCrit = Boolean(stats.critGuarantee);
  const exhaustMult = stats.hp <= 0 && !guaranteedCrit ? 0.7 : 1.0;
  const vulnMult = bossMods?.vulnerable ? 1.2 : 1.0;
  const critMult = guaranteedCrit ? 1.75 : 1.0;

  let nextStats: PlayerStats = {
    ...stats,
    mp: stats.mp - skill.mpCost,
  };
  let bossDamage = 0;
  let healedHp = 0;
  let gainedGold = 0;
  let staminaLost = 0;
  let dodged = false;
  let bonusDropRoll = false;
  let groupHealAmount = 0;
  let groupManaAmount = 0;
  let groupBuffDelta: Partial<Attributes> | undefined;
  let appliedBossVulnerable = false;
  let appliedBossWeakened = false;

  switch (skill.id) {
    // --- APRENDIZ ---
    case 'improvised_strike': {
      bossDamage = Math.max(
        1,
        Math.round((8 + attrs.str * 0.6 + attrs.int * 0.3) * exhaustMult * vulnMult * critMult)
      );
      staminaLost = computeStaminaLoss(bossAttack, attrs, nextStats, bossMods, 0.9);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      break;
    }
    case 'quick_breath': {
      healedHp = Math.min(nextStats.max_hp - nextStats.hp, Math.round(8 + attrs.con * 0.5));
      nextStats.hp += healedHp;
      break;
    }

    // --- ESCUDEIRO (CON / TANK) ---
    case 'shield_bash': {
      bossDamage = Math.max(
        1,
        Math.round((12 + attrs.con * 1.1 + attrs.str * 0.5) * exhaustMult * vulnMult * critMult)
      );
      staminaLost = computeStaminaLoss(bossAttack, attrs, nextStats, bossMods, 0.5);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      break;
    }
    case 'guild_wall': {
      const amount = Math.round(14 + attrs.con * 0.9);
      healedHp = Math.min(nextStats.max_hp - nextStats.hp, amount);
      nextStats.hp += healedHp;
      groupHealAmount = amount;
      break;
    }
    case 'defensive_stance': {
      nextStats.guardCharges = 3;
      break;
    }
    case 'guild_bastion': {
      const bonus = Math.max(8, Math.round(attrs.con * 0.15));
      const cap = 40;
      const nextCon = Math.min(cap, nextStats.buffs.con + bonus);
      if (nextCon === nextStats.buffs.con) {
        return {
          ok: false,
          reason: 'buff_maxed',
          nextStats: stats,
          bossDamage: 0,
          healedHp: 0,
          gainedGold: 0,
          staminaLost: 0,
        };
      }
      nextStats.buffs = { ...nextStats.buffs, con: nextCon };
      groupBuffDelta = { con: bonus };
      break;
    }

    // --- ESPADACHIM (STR / DANO BRUTO) ---
    case 'heavy_slash': {
      bossDamage = Math.max(
        1,
        Math.round((16 + attrs.str * 1.5) * exhaustMult * vulnMult * critMult)
      );
      staminaLost = computeStaminaLoss(bossAttack, attrs, nextStats, bossMods);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      break;
    }
    case 'sure_strike': {
      nextStats.critGuarantee = true;
      break;
    }
    case 'guard_break': {
      bossDamage = Math.max(
        1,
        Math.round((10 + attrs.str * 0.9) * exhaustMult * vulnMult * critMult)
      );
      staminaLost = computeStaminaLoss(bossAttack, attrs, nextStats, bossMods);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      appliedBossVulnerable = true;
      break;
    }
    case 'war_cry': {
      const bonus = Math.max(8, Math.round(attrs.str * 0.15));
      const cap = 40;
      const nextStr = Math.min(cap, nextStats.buffs.str + bonus);
      if (nextStr === nextStats.buffs.str) {
        return {
          ok: false,
          reason: 'buff_maxed',
          nextStats: stats,
          bossDamage: 0,
          healedHp: 0,
          gainedGold: 0,
          staminaLost: 0,
        };
      }
      nextStats.buffs = { ...nextStats.buffs, str: nextStr };
      groupBuffDelta = { str: bonus };
      break;
    }

    // --- BATEDOR (PER / AGILIDADE & SAQUE) ---
    case 'agile_dash': {
      bossDamage = Math.max(
        1,
        Math.round((12 + attrs.per * 1.3) * exhaustMult * vulnMult * critMult)
      );
      dodged = Math.random() < 0.5;
      staminaLost = dodged ? 0 : computeStaminaLoss(bossAttack, attrs, nextStats, bossMods);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      break;
    }
    case 'opportunist_loot': {
      gainedGold = Math.max(1, Math.round((14 + attrs.per * 1.2) * exhaustMult));
      nextStats.gold += gainedGold;
      bonusDropRoll = true;
      break;
    }
    case 'shadow_steps': {
      nextStats.shadowCharges = 3;
      break;
    }
    case 'mark_prey': {
      const bonus = Math.max(8, Math.round(attrs.per * 0.15));
      const cap = 40;
      const nextPer = Math.min(cap, nextStats.buffs.per + bonus);
      if (nextPer === nextStats.buffs.per) {
        return {
          ok: false,
          reason: 'buff_maxed',
          nextStats: stats,
          bossDamage: 0,
          healedHp: 0,
          gainedGold: 0,
          staminaLost: 0,
        };
      }
      nextStats.buffs = { ...nextStats.buffs, per: nextPer };
      groupBuffDelta = { per: bonus };
      break;
    }

    // --- NOVIÇO ARCANO (INT / MAGIA & MANA) ---
    case 'arcane_bolt': {
      bossDamage = Math.max(
        1,
        Math.round((14 + attrs.int * 1.4) * exhaustMult * vulnMult * critMult)
      );
      staminaLost = computeStaminaLoss(bossAttack, attrs, nextStats, bossMods, 0.9);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      break;
    }
    case 'ethereal_wave': {
      const amount = Math.round(10 + Math.floor(attrs.int * 0.35));
      nextStats.mp = Math.min(nextStats.max_mp, nextStats.mp + amount);
      groupManaAmount = amount;
      break;
    }
    case 'curse_weakness': {
      appliedBossWeakened = true;
      break;
    }
    case 'focused_flame': {
      bossDamage = Math.max(
        1,
        Math.round((26 + attrs.int * 2.0) * exhaustMult * vulnMult * critMult)
      );
      staminaLost = computeStaminaLoss(bossAttack, attrs, nextStats, bossMods);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      break;
    }
  }

  if (bossDamage > 0) {
    nextStats.guardCharges = Math.max(0, (nextStats.guardCharges ?? 0) - 1);
    nextStats.shadowCharges = Math.max(0, (nextStats.shadowCharges ?? 0) - 1);
  }

  return {
    ok: true,
    nextStats,
    bossDamage,
    healedHp,
    gainedGold,
    staminaLost,
    dodged,
    bonusDropRoll,
    groupHealAmount,
    groupManaAmount,
    groupBuffDelta,
    appliedBossVulnerable,
    appliedBossWeakened,
  };
}
