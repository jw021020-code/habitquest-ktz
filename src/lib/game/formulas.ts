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
 * Concede XP/Ouro de fontes permitidas (vitória de Boss, estudos/treinos, ouro de baú)
 * garantindo verificação de Level-Up, restauração opcional de 100% STA/MP
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
      bossAttack * 0.45 * conMitigation * bossWeakMult * guardMult * shadowMult * extraMitigationMult
    )
  );
}

export function getLevelScale(level: number): number {
  return 1 + Math.min(3.5, Math.max(0, level - 1) * 0.055);
}

export function getQuestScale(level: number): number {
  return 1 + Math.min(2.0, Math.max(0, level - 1) * 0.03);
}

function computeBasePreview(
  stats: PlayerStats,
  baseXp: number,
  baseGold: number,
  baseBossDamage: number,
  attrs: Attributes,
  bossAttack: number,
  bossMods?: BossCombatModifiers,
  effortScale = 1.0
): RewardPreview {
  if (baseXp <= 0) {
    return { xp: 0, gold: 0, bossDamage: 0, staminaLost: 0 };
  }
  const exhaustMult = stats.hp <= 0 && !stats.critGuarantee ? 0.7 : 1.0;
  const vulnMult = bossMods?.vulnerable ? 1.2 : 1.0;
  const levelScale = getLevelScale(stats.level);
  // XP é 100% neutro de classe/atributos (INT e Crítico não alteram XP)
  const xp = Math.max(1, Math.round(baseXp * levelScale));
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
  essaysDone = 0
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
    effortScale
  );
}

/**
 * Prévia determinística para exibir em tempo real no card de Treino.
 */
export function previewWorkoutReward(
  stats: PlayerStats,
  cardio: boolean,
  musculacao: boolean,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12,
  bossMods?: BossCombatModifiers,
  km = 0
): RewardPreview {
  const count = (cardio ? 1 : 0) + (musculacao ? 1 : 0);
  if (count === 0) {
    return { xp: 0, gold: 0, bossDamage: 0, staminaLost: 0 };
  }
  const mult = count === 2 ? 2.2 : 1.0;
  const safeKm = cardio ? Math.min(15, Math.max(0, Number(km) || 0)) : 0;
  return computeBasePreview(
    stats,
    55 * mult + safeKm * 15,
    8 * mult + safeKm * 2,
    14 * mult + safeKm * 4,
    attrs,
    bossAttack,
    bossMods
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
  effortFactor = 1.5
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

  // XP é 100% neutro de classe (sem bônus de INT nem de Crítico)
  const gainedXp = Math.max(1, Math.round(baseXp * levelScale));
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
  essaysDone = 0
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
    totalFactor
  );
}

export function calculateWorkoutReward(
  stats: PlayerStats,
  cardio: boolean,
  musculacao: boolean,
  attrs: Attributes = ZERO_ATTRS,
  bossAttack = 12,
  bossMods?: BossCombatModifiers,
  km = 0
) {
  const count = (cardio ? 1 : 0) + (musculacao ? 1 : 0);
  const mult = count === 2 ? 2.2 : 1.0;
  const safeKm = cardio ? Math.min(15, Math.max(0, Number(km) || 0)) : 0;

  return applyProgressReward(
    stats,
    55 * mult + safeKm * 15,
    8 * mult + safeKm * 2,
    14 * mult + safeKm * 4,
    5 * mult,
    attrs,
    bossAttack,
    bossMods
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
        Math.round((8 + attrs.str * 0.8 + attrs.int * 0.4) * exhaustMult * vulnMult * critMult)
      );
      staminaLost = computeStaminaLoss(bossAttack, attrs, nextStats, bossMods, 0.7);
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
        Math.round((14 + attrs.con * 1.4 + attrs.str * 0.6) * exhaustMult * vulnMult * critMult)
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
        Math.round((20 + attrs.str * 2.2) * exhaustMult * vulnMult * critMult)
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
        Math.round((12 + attrs.str * 1.2) * exhaustMult * vulnMult * critMult)
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
        Math.round((15 + attrs.per * 1.8) * exhaustMult * vulnMult * critMult)
      );
      dodged = Math.random() < 0.5;
      staminaLost = dodged ? 0 : computeStaminaLoss(bossAttack, attrs, nextStats, bossMods);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      break;
    }
    case 'opportunist_loot': {
      gainedGold = Math.max(1, Math.round((16 + attrs.per * 1.6) * exhaustMult));
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
        Math.round((18 + attrs.int * 2.0) * exhaustMult * vulnMult * critMult)
      );
      staminaLost = computeStaminaLoss(bossAttack, attrs, nextStats, bossMods, 0.75);
      nextStats.hp = Math.max(0, nextStats.hp - staminaLost);
      nextStats.critGuarantee = false;
      break;
    }
    case 'ethereal_wave': {
      const amount = Math.round(14 + Math.floor(attrs.int * 0.5));
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
        Math.round((32 + attrs.int * 2.8) * exhaustMult * vulnMult * critMult)
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
