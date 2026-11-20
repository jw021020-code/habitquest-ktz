'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Dumbbell, ScrollText, ShoppingBag, Store, Users } from 'lucide-react';
import {
  applyClassSkill,
  BossCombatModifiers,
  calculateStudyReward,
  calculateWorkoutReward,
  getUnallocatedStatPoints,
  getXpToNextLevel,
  grantXpAndResources,
  PlayerStats,
  ZERO_ATTRS,
} from '@/lib/game/formulas';
import {
  Attributes,
  CharacterAppearance,
  computeTotalAttributes,
  CombatHeroClass,
  DEFAULT_APPEARANCE,
  DEFAULT_EQUIPPED,
  DEFAULT_INVENTORY,
  EquipmentItem,
  EquipmentSlot,
  EquippedGear,
  getEquipmentById,
  getItemEffectiveStats,
} from '@/lib/game/items';
import {
  BOSS_CATALOG,
  CLASS_INFO,
  CLASS_UNLOCK_LEVEL,
  ClassSkill,
  getBossAtIndexAndCycle,
  getBossById,
  getProgressiveBoss,
} from '@/lib/game/skills';
import {
  DEFAULT_STABLE,
  formatPetName,
  normalizeStableState,
  pickRandomUnownedPet,
  rollTaskDrop,
  StableState,
} from '@/lib/game/pets';
import {
  DEFAULT_METRICS,
  HeroMetrics,
  rollArmoireReward,
  rollBossEquipmentDrop,
  rollGuaranteedEquipment,
  rollWeeklyQuestEquipmentDrop,
} from '@/lib/game/achievements';
import {
  buildQuestProgressList,
  computePeriodTotals,
  getDayKey,
  getQuestById,
  getQuestXpForLevel,
  MONTHLY_BONUS_REWARD,
  MONTHLY_QUESTS_POOL,
  QuestCycle,
  syncQuestsPeriod,
} from '@/lib/game/quests';
import {
  canClaimDailyCheckIn,
  computeCheckInReward,
  DEFAULT_CHECKIN_STATE,
  getProjectedStreak,
} from '@/lib/game/checkin';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchLatestPartyBoss,
  fetchUserBundle,
  joinOrCreateKtzParty,
  RemoteParty,
  RemoteProfile,
  sendRemotePartyMessage,
  syncProfileToSupabase,
  updateRemotePartyBoss,
} from '@/lib/supabase/data';
import { AuthModal } from '@/components/AuthModal';
import { DailyCheckInModal } from '@/components/DailyCheckInModal';
import { EquipmentPanel } from '@/components/EquipmentPanel';
import {
  ActiveSection,
  HabiticaHeader,
  InventorySubTab,
  ShopSubTab,
} from '@/components/HabiticaHeader';
import { MemberProfileModal } from '@/components/MemberProfileModal';
import { PartyChatMessage, PartyPanel } from '@/components/PartyPanel';
import { QuestsPanel, QuestsSummaryStrip } from '@/components/QuestsPanel';
import { SkillsBar } from '@/components/SkillsBar';
import { StatsModal } from '@/components/StatsModal';
import { StudyEntry, StudyLogCard } from '@/components/StudyLogCard';
import { WorkoutEntry, WorkoutLogCard } from '@/components/WorkoutLogCard';

interface PartyState {
  name: string;
  bossStage: number;
  bossId: string;
  bossName: string;
  bossSprite: string;
  bossHp: number;
  bossMaxHp: number;
  bossAttack: number;
  rewardGold: number;
  rewardXp: number;
}

type MobileTab = 'study' | 'workout' | 'quests' | 'inventario' | 'loja' | 'ktz';

const STORAGE_KEY = 'habitquest_ktz_launch_v1';

const DEFAULT_STATS: PlayerStats = {
  level: 1,
  hp: 50,
  max_hp: 50,
  mp: 30,
  max_mp: 32,
  xp: 0,
  xp_to_next: 350,
  gold: 0,
  heroClass: 'apprentice',
  buffs: { ...ZERO_ATTRS },
};

const FIRST_BOSS = getProgressiveBoss(1);
const DEFAULT_PARTY: PartyState = {
  name: 'KTZ - Know The Zero',
  bossStage: 1,
  bossId: FIRST_BOSS.id,
  bossName: FIRST_BOSS.name,
  bossSprite: FIRST_BOSS.sprite,
  bossHp: FIRST_BOSS.maxHp,
  bossMaxHp: FIRST_BOSS.maxHp,
  bossAttack: FIRST_BOSS.attack,
  rewardGold: FIRST_BOSS.rewardGold,
  rewardXp: FIRST_BOSS.rewardXp,
};

export default function HomePage() {
  const [heroName, setHeroName] = useState<string>('Herói');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [remoteParty, setRemoteParty] = useState<RemoteParty | null>(null);
  const [remoteMembers, setRemoteMembers] = useState<RemoteProfile[]>([]);
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [studyEntries, setStudyEntries] = useState<StudyEntry[]>([]);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [party, setParty] = useState<PartyState>(DEFAULT_PARTY);
  const [appearance, setAppearance] = useState<CharacterAppearance>(DEFAULT_APPEARANCE);
  const [equipped, setEquipped] = useState<EquippedGear>(DEFAULT_EQUIPPED);
  const [costume, setCostume] = useState<EquippedGear>(DEFAULT_EQUIPPED);
  const [useCostume, setUseCostume] = useState<boolean>(false);
  const [inventory, setInventory] = useState<string[]>(DEFAULT_INVENTORY);
  const [stable, setStable] = useState<StableState>(DEFAULT_STABLE);
  const [metrics, setMetrics] = useState<HeroMetrics>(DEFAULT_METRICS);

  const [activeSection, setActiveSection] = useState<ActiveSection>('registro');
  const [mobileTab, setMobileTab] = useState<MobileTab>('study');
  const [invTab, setInvTab] = useState<InventorySubTab>('equipment');
  const [shopFilter, setShopFilter] = useState<ShopSubTab>('all');

  const [statsOpen, setStatsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [inspectedMember, setInspectedMember] = useState<RemoteProfile | null>(null);

  const [messages, setMessages] = useState<PartyChatMessage[]>([
    {
      id: 'm1',
      author: 'Sistema',
      kind: 'system',
      text: 'Clã KTZ - Know The Zero iniciado! Registre estudos e treinos para enfrentar os Bosses.',
      time: 'Agora',
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [onlineLoaded, setOnlineLoaded] = useState(false);
  const [bossMods, setBossMods] = useState<BossCombatModifiers>({});

  const totalAttributes = useMemo(() => {
    const gear = computeTotalAttributes(equipped, stats.heroClass);
    const alloc = stats.allocatedStats ?? ZERO_ATTRS;
    return {
      str: gear.str + stats.buffs.str + alloc.str,
      int: gear.int + stats.buffs.int + alloc.int,
      con: gear.con + stats.buffs.con + alloc.con,
      per: gear.per + stats.buffs.per + alloc.per,
    };
  }, [equipped, stats.heroClass, stats.buffs, stats.allocatedStats]);

  const unallocatedPoints = useMemo(
    () => getUnallocatedStatPoints(stats.level, stats.allocatedStats),
    [stats.level, stats.allocatedStats]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.heroName) setHeroName(parsed.heroName);
          if (parsed.stats) {
            const loadedStats = { ...DEFAULT_STATS, ...parsed.stats };
            loadedStats.xp_to_next = getXpToNextLevel(loadedStats.level);
            setStats(loadedStats);
          }
          if (parsed.studyEntries) setStudyEntries(parsed.studyEntries);
          if (parsed.workoutEntries) setWorkoutEntries(parsed.workoutEntries);
          if (parsed.party) setParty({ ...DEFAULT_PARTY, ...parsed.party });
          if (parsed.appearance) setAppearance(parsed.appearance);
          if (parsed.equipped) setEquipped(parsed.equipped);
          if (parsed.costume) setCostume(parsed.costume);
          if (typeof parsed.useCostume === 'boolean') setUseCostume(parsed.useCostume);
          if (parsed.inventory) setInventory(parsed.inventory);
          if (parsed.stable) setStable(normalizeStableState(parsed.stable));
          if (parsed.metrics) setMetrics(parsed.metrics);
          if (parsed.messages) setMessages(parsed.messages);
        }
      } catch {
        // ignora estado corrompido
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        heroName,
        stats,
        studyEntries,
        workoutEntries,
        party,
        appearance,
        equipped,
        costume,
        useCostume,
        inventory,
        stable,
        metrics,
        messages,
      })
    );
  }, [
    hydrated,
    heroName,
    stats,
    studyEntries,
    workoutEntries,
    party,
    appearance,
    equipped,
    costume,
    useCostume,
    inventory,
    stable,
    metrics,
    messages,
  ]);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(msg);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 4200);
  };

  const pushActionLog = (text: string) => {
    if (remoteParty) {
      sendRemotePartyMessage(remoteParty.id, userId, 'Sistema', text, 'system');
      return;
    }
    setMessages((prev) => [
      {
        id: crypto.randomUUID(),
        author: 'Sistema',
        kind: 'system',
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 99),
    ]);
  };

  const activeBossAttack = remoteParty ? remoteParty.boss_attack : party.bossAttack;

  const applyBossDamageAndCheckVictory = (
    damage: number,
    sourceLabel: string,
    latestStats: PlayerStats
  ): {
    defeated: boolean;
    bossName: string;
    nextBossName?: string;
    leveledUp?: boolean;
    nextLevel?: number;
  } => {
    const currentStage = remoteParty ? (remoteParty.boss_stage ?? 1) : party.bossStage;
    const currentBossId = remoteParty ? remoteParty.boss_id : party.bossId;
    const currentHp = remoteParty ? remoteParty.boss_hp : party.bossHp;
    const bName = remoteParty ? remoteParty.boss_name : party.bossName;
    const rGold = remoteParty ? remoteParty.reward_gold : party.rewardGold;
    const rXp = remoteParty ? remoteParty.reward_xp : party.rewardXp;
    const dropCount = getBossById(currentBossId)?.dropCount ?? 1;

    if (damage <= 0) {
      return { defeated: false, bossName: bName };
    }

    const defeated = currentHp - damage <= 0;

    if (defeated) {
      const nextStage = currentStage + 1;
      const nextBoss = getProgressiveBoss(nextStage);

      // Ao derrotar um Boss: recompensa (com checagem de Level-Up) + drops garantidos + reset 100% STA/MP + reset buffs!
      const victoryRes = grantXpAndResources(latestStats, totalAttributes, {
        xp: rXp,
        goldDelta: rGold,
        fullRestore: true,
        resetBuffs: true,
      });

      setStats(victoryRes.nextStats);
      setBossMods({});
      setStable((prev) => ({
        ...prev,
        eggs: prev.eggs + dropCount,
        potions: prev.potions + dropCount,
      }));
      const bossGearDrop = rollBossEquipmentDrop(inventory, currentStage);
      if (bossGearDrop && !inventory.includes(bossGearDrop.item.id)) {
        setInventory((prev) => [...prev, bossGearDrop.item.id]);
      }
      setMetrics((m) => ({
        ...m,
        bossesDefeated: m.bossesDefeated + 1,
        totalGoldEarned: m.totalGoldEarned + rGold,
        totalBossDamage: (m.totalBossDamage ?? 0) + damage,
        currentBossStage: nextStage,
        currentBossDamage: 0,
        lastClaimedBossStage: currentStage,
      }));

      if (remoteParty) {
        updateRemotePartyBoss(remoteParty.id, {
          boss_stage: nextStage,
          boss_id: nextBoss.id,
          boss_name: nextBoss.name,
          boss_sprite: nextBoss.sprite,
          boss_hp: nextBoss.maxHp,
          boss_max_hp: nextBoss.maxHp,
          boss_attack: nextBoss.attack,
          reward_gold: nextBoss.rewardGold,
          reward_xp: nextBoss.rewardXp,
        });
      } else {
        setParty((p) => ({
          ...p,
          bossStage: nextStage,
          bossId: nextBoss.id,
          bossName: nextBoss.name,
          bossSprite: nextBoss.sprite,
          bossHp: nextBoss.maxHp,
          bossMaxHp: nextBoss.maxHp,
          bossAttack: nextBoss.attack,
          rewardGold: nextBoss.rewardGold,
          rewardXp: nextBoss.rewardXp,
        }));
      }

      const gearDropText = bossGearDrop ? ` · 🎁 ${bossGearDrop.label}` : '';
      pushActionLog(
        `🏆 ${heroName} deu o golpe final em ${bName} (${sourceLabel})! +${rGold} GP, +${rXp} XP, +${dropCount} Ovo, +${dropCount} Poção${gearDropText}, STA/MP 100%! Próximo: #${nextStage} ${nextBoss.name}.`
      );
      if (bossGearDrop) {
        showToast(`🎁 Drop do Boss: ${bossGearDrop.label}!`);
      }
      if (victoryRes.leveledUp) {
        pushActionLog(`🎉 ${heroName} alcançou o Nível ${victoryRes.nextStats.level}!`);
      }

      return {
        defeated: true,
        bossName: bName,
        nextBossName: nextBoss.name,
        leveledUp: victoryRes.leveledUp,
        nextLevel: victoryRes.nextStats.level,
      };
    }

    const nextHp = Math.max(0, currentHp - damage);
    setMetrics((m) => ({
      ...m,
      totalBossDamage: (m.totalBossDamage ?? 0) + damage,
      currentBossStage: currentStage,
      currentBossDamage:
        (m.currentBossStage === currentStage ? (m.currentBossDamage ?? 0) : 0) + damage,
    }));

    if (remoteParty) {
      // Leitura fresca do HP no Supabase antes de subtrair para evitar sobrescrita em ataques simultâneos
      fetchLatestPartyBoss(remoteParty.id).then((fresh) => {
        if (!fresh || (fresh.boss_stage ?? 1) !== currentStage) return;
        const safeNextHp = Math.max(1, fresh.boss_hp - damage);
        updateRemotePartyBoss(remoteParty.id, { boss_hp: safeNextHp });
      });
    } else {
      setParty((p) => ({ ...p, bossHp: nextHp }));
    }
    pushActionLog(`⚔️ ${heroName} causou ${damage} de dano em ${bName} (${sourceLabel}).`);
    return { defeated: false, bossName: bName };
  };

  const processDropAndToast = (
    res: {
      deltaXp: number;
      deltaGold: number;
      deltaMp: number;
      staminaLost: number;
      bossDamage: number;
      leveledUp: boolean;
      isCritical: boolean;
      becameExhausted: boolean;
      nextStats: PlayerStats;
    },
    label: string
  ) => {
    setStats(res.nextStats);

    const bossOutcome =
      res.bossDamage > 0
        ? applyBossDamageAndCheckVictory(res.bossDamage, label, res.nextStats)
        : { defeated: false, bossName: '' };

    let dropText = '';
    setMetrics((m) => ({
      ...m,
      tasksCompleted: m.tasksCompleted + 1,
      criticalHits: m.criticalHits + (res.isCritical ? 1 : 0),
      totalGoldEarned: m.totalGoldEarned + res.deltaGold,
    }));

    const drop = rollTaskDrop(totalAttributes.per);
    if (drop) {
      dropText = ` · 🎁 Drop: ${drop.label}!`;
      pushActionLog(`🎁 ${heroName} encontrou: ${drop.label}!`);
      setStable((prev) => {
        if (drop.kind === 'egg') {
          return { ...prev, eggs: prev.eggs + 1 };
        }
        return { ...prev, potions: prev.potions + 1 };
      });
    }

    if (res.leveledUp && !bossOutcome.defeated) {
      pushActionLog(`🎉 ${heroName} alcançou o Nível ${res.nextStats.level}!`);
    }

    if (bossOutcome.defeated) {
      const lvlTag =
        bossOutcome.leveledUp || res.leveledUp
          ? ` · 🎉 Nível ${bossOutcome.nextLevel ?? res.nextStats.level}!`
          : '';
      showToast(
        `🏆 ${bossOutcome.bossName} derrotado! STA/MP 100%! Próximo: ${bossOutcome.nextBossName}${lvlTag}${dropText}`
      );
    } else if (res.leveledUp) {
      showToast(`🎉 Nível ${res.nextStats.level}! Estamina e Mana restauradas!${dropText}`);
    } else if (res.becameExhausted) {
      pushActionLog(`⚠️ ${heroName} ficou Exausto (0 Estamina)!`);
      showToast(`⚠️ Estamina zerou (Exausto: -30% GP/Dano, XP normal)!${dropText}`);
    } else {
      const critTag = res.isCritical ? '💥 CRÍTICO! ' : '';
      showToast(
        `${critTag}+${res.deltaXp} XP  +${res.deltaGold} GP  -${res.staminaLost} STA  -${res.bossDamage} Boss${dropText}`
      );
    }
  };

  const handleAddStudy = (entry: Omit<StudyEntry, 'id' | 'createdAt'>) => {
    const now = new Date();
    const nowLabel = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newEntry: StudyEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: nowLabel,
      loggedAt: now.toISOString(),
    };
    setStudyEntries((prev) => [newEntry, ...prev]);

    const qText = entry.didQuestions ? ` (${entry.questionsDone} questões)` : '';
    pushActionLog(`${heroName} registrou Estudo: ${entry.subject} (${entry.minutes} min${qText}).`);

    const res = calculateStudyReward(
      stats,
      entry.minutes,
      entry.didQuestions,
      entry.questionsDone,
      totalAttributes,
      activeBossAttack,
      bossMods
    );
    processDropAndToast(res, `Estudo: ${entry.subject}`);
  };

  const handleDeleteStudy = (id: string) => {
    setStudyEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddWorkout = (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    const now = new Date();
    const nowLabel = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newEntry: WorkoutEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: nowLabel,
      loggedAt: now.toISOString(),
    };
    setWorkoutEntries((prev) => [newEntry, ...prev]);

    const kmText = entry.cardio && entry.km && entry.km > 0 ? ` (${entry.km} km)` : '';
    const label = [entry.cardio ? `Cárdio${kmText}` : '', entry.musculacao ? 'Musculação' : '']
      .filter(Boolean)
      .join(' + ');
    pushActionLog(`💪 ${heroName} registrou Treino: ${label}.`);

    const res = calculateWorkoutReward(
      stats,
      entry.cardio,
      entry.musculacao,
      totalAttributes,
      activeBossAttack,
      bossMods,
      entry.km ?? 0
    );
    processDropAndToast(res, `Treino: ${label}`);
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkoutEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleCastSkill = (skill: ClassSkill) => {
    const res = applyClassSkill(stats, skill, totalAttributes, activeBossAttack, bossMods);
    if (!res.ok) {
      if (res.reason === 'full_stamina') {
        showToast('💚 Sua Estamina já está cheia!');
      } else if (res.reason === 'buff_maxed') {
        showToast('🛡️ Este buff já está no limite máximo contra o Boss atual!');
      } else {
        showToast('⚡ Mana insuficiente!');
      }
      return;
    }
    setStats(res.nextStats);
    if (res.gainedGold > 0) {
      setMetrics((m) => ({ ...m, totalGoldEarned: m.totalGoldEarned + res.gainedGold }));
    }

    if (res.appliedBossVulnerable) {
      setBossMods((m) => ({ ...m, vulnerable: true }));
    }
    if (res.appliedBossWeakened) {
      setBossMods((m) => ({ ...m, weakened: true }));
    }

    // Efeitos coletivos para a Guilda KTZ (transmitidos via party_messages Realtime)
    if (skill.isGroup) {
      if (res.groupHealAmount && res.groupHealAmount > 0) {
        pushActionLog(
          `🤝 ${heroName} lançou ${skill.name} (+${res.groupHealAmount} STA para toda a KTZ)!`
        );
      } else if (res.groupManaAmount && res.groupManaAmount > 0) {
        pushActionLog(
          `🤝 ${heroName} lançou ${skill.name} (+${res.groupManaAmount} MP para toda a KTZ)!`
        );
      } else if (res.groupBuffDelta?.con) {
        pushActionLog(
          `🤝 ${heroName} lançou ${skill.name} (+${res.groupBuffDelta.con} CON para toda a KTZ)!`
        );
      } else if (res.groupBuffDelta?.str) {
        pushActionLog(
          `🤝 ${heroName} lançou ${skill.name} (+${res.groupBuffDelta.str} STR para toda a KTZ)!`
        );
      } else if (res.groupBuffDelta?.per) {
        pushActionLog(
          `🤝 ${heroName} lançou ${skill.name} (+${res.groupBuffDelta.per} PER para toda a KTZ)!`
        );
      } else if (res.appliedBossVulnerable) {
        pushActionLog(
          `🤝 ${heroName} usou ${skill.name} (Boss Vulnerável: +20% dano para toda a KTZ)!`
        );
      } else if (res.appliedBossWeakened) {
        pushActionLog(
          `🤝 ${heroName} lançou ${skill.name} (Boss Enfraquecido: -25% ataque para toda a KTZ)!`
        );
      }
    } else {
      pushActionLog(`✨ ${heroName} usou ${skill.name}.`);
    }

    let dropText = '';
    if (res.bonusDropRoll) {
      const drop = rollTaskDrop(totalAttributes.per + 25);
      if (drop) {
        dropText = ` · 🎁 Drop: ${drop.label}!`;
        pushActionLog(`🎁 ${heroName} encontrou ${drop.label} usando ${skill.name}!`);
        setStable((prev) =>
          drop.kind === 'egg' ? { ...prev, eggs: prev.eggs + 1 } : { ...prev, potions: prev.potions + 1 }
        );
      }
    }

    const bossOutcome =
      res.bossDamage > 0
        ? applyBossDamageAndCheckVictory(res.bossDamage, skill.name, res.nextStats)
        : { defeated: false, bossName: '' };

    if (bossOutcome.defeated) {
      const lvlTag = bossOutcome.leveledUp ? ` · 🎉 Nível ${bossOutcome.nextLevel}!` : '';
      showToast(
        `🏆 ${bossOutcome.bossName} derrotado com ${skill.name}! STA/MP 100%! Próximo: ${bossOutcome.nextBossName}${lvlTag}`
      );
    } else if (res.bossDamage > 0) {
      const dodgeTag = res.dodged ? ' · 💨 Esquiva (0 STA)!' : ` · -${res.staminaLost} STA`;
      const vulnTag = res.appliedBossVulnerable ? ' · Boss Vulnerável (+20%)' : '';
      showToast(`⚔️ ${skill.name}: -${res.bossDamage} Boss HP${dodgeTag}${vulnTag}!`);
    } else if (res.healedHp > 0 || res.groupHealAmount) {
      showToast(`💚 ${skill.name}: +${res.healedHp} STA (Guilda KTZ curada)!`);
    } else if (res.groupManaAmount) {
      showToast(`💙 ${skill.name}: +${res.groupManaAmount} MP restaurado para toda a KTZ!`);
    } else if (res.gainedGold > 0) {
      showToast(`🪙 ${skill.name}: +${res.gainedGold} GP!${dropText}`);
    } else if (skill.kind === 'stance') {
      showToast(`⚡ ${skill.name} ativado!`);
    } else if (skill.kind === 'buff') {
      showToast(`🛡️ ${skill.name} aplicado para toda a KTZ!`);
    }
  };

  const handleChangeClass = (nextClass: CombatHeroClass) => {
    if (stats.level < CLASS_UNLOCK_LEVEL) {
      showToast(`🔒 Alcance o Nível ${CLASS_UNLOCK_LEVEL} para escolher sua Classe!`);
      return;
    }
    if (stats.heroClass !== 'apprentice') {
      showToast('🔒 Classe travada! Use o Orbe do Renascimento para escolher outro caminho.');
      return;
    }
    setStats((s) => ({ ...s, heroClass: nextClass }));
    pushActionLog(`🎭 ${heroName} escolheu a classe inicial ${CLASS_INFO[nextClass].label}!`);
    showToast(`🎭 Classe definitiva definida: ${CLASS_INFO[nextClass].label}!`);
  };

  const applyGearItem = (prev: EquippedGear, item: EquipmentItem): EquippedGear => {
    const next: EquippedGear = { ...prev, [item.slot]: item.id };
    if (item.slot === 'weapon' && item.twoHanded && next.shield) {
      delete next.shield;
    } else if (item.slot === 'shield' && getEquipmentById(next.weapon)?.twoHanded) {
      delete next.weapon;
    }
    return next;
  };

  const handleBuyItem = (
    item: EquipmentItem,
    afterBuy: 'bag' | 'equip' | 'costume' = 'bag'
  ) => {
    if (stats.gold < item.price || inventory.includes(item.id)) return;
    setStats((s) => ({ ...s, gold: s.gold - item.price }));
    setInventory((prev) => [...prev, item.id]);

    if (afterBuy === 'equip') {
      const removedOther =
        (item.slot === 'weapon' && item.twoHanded && Boolean(equipped.shield)) ||
        (item.slot === 'shield' && Boolean(getEquipmentById(equipped.weapon)?.twoHanded));
      setEquipped((prev) => applyGearItem(prev, item));
      pushActionLog(`🛡️ ${heroName} comprou e equipou ${item.name} (-${item.price} GP).`);
      showToast(
        removedOther
          ? `🛡️ ${item.name} equipado! (Item conflitante de 2 mãos removido)`
          : `🛡️ Comprou e equipou: ${item.name}!`
      );
    } else if (afterBuy === 'costume') {
      setCostume((prev) => applyGearItem(prev, item));
      pushActionLog(`🎭 ${heroName} comprou ${item.name} para Fantasia (-${item.price} GP).`);
      showToast(`🎭 Comprou e vestiu na Fantasia: ${item.name}!`);
    } else {
      pushActionLog(`🛍️ ${heroName} comprou ${item.name} (-${item.price} GP).`);
      showToast(`🛍️ Guardado na mochila: ${item.name}!`);
    }
  };

  const handleBuyBatchItems = (items: EquipmentItem[]) => {
    const buyable = items.filter((it) => !inventory.includes(it.id));
    if (buyable.length === 0) return;

    let remainingGold = stats.gold;
    const bought: EquipmentItem[] = [];
    for (const it of buyable) {
      if (remainingGold >= it.price) {
        remainingGold -= it.price;
        bought.push(it);
      }
    }
    if (bought.length === 0) {
      showToast('🪙 Ouro insuficiente para comprar estes itens.');
      return;
    }

    const totalCost = stats.gold - remainingGold;
    const boughtIds = bought.map((it) => it.id);
    setStats((s) => ({ ...s, gold: remainingGold }));
    setInventory((prev) => [...prev, ...boughtIds.filter((id) => !prev.includes(id))]);
    pushActionLog(
      `🛍️ ${heroName} comprou ${bought.length} itens em lote (-${totalCost} GP).`
    );
    showToast(`🛍️ ${bought.length} itens comprados (-${totalCost} GP)!`);
  };

  const handleToggleEquip = (item: EquipmentItem) => {
    if (equipped[item.slot] !== item.id) {
      if (item.slot === 'weapon' && item.twoHanded && equipped.shield) {
        showToast(`${item.name} (2 mãos) equipado. Escudo removido.`);
      } else if (item.slot === 'shield' && getEquipmentById(equipped.weapon)?.twoHanded) {
        showToast(`${item.name} equipado. Arma de 2 mãos removida.`);
      }
    }
    setEquipped((prev) => {
      if (prev[item.slot] === item.id) {
        const next = { ...prev };
        delete next[item.slot];
        return next;
      }
      return applyGearItem(prev, item);
    });
  };

  const handleUnequipSlot = (slot: EquipmentSlot) => {
    if (!equipped[slot]) return;
    setEquipped((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const handleClearAllEquipped = () => {
    setEquipped({});
    showToast('🧹 Equipamento de Batalha limpo.');
  };

  const handleAutoEquipBest = () => {
    const ownedItems = inventory
      .map((id) => getEquipmentById(id))
      .filter((it): it is EquipmentItem => Boolean(it));

    if (ownedItems.length === 0) {
      showToast('Você ainda não possui equipamentos no inventário.');
      return;
    }

    const statSum = (it: EquipmentItem) => {
      const eff = getItemEffectiveStats(it, stats.heroClass);
      return eff.str + eff.int + eff.con + eff.per;
    };

    const bestForSlot = (slot: EquipmentSlot): EquipmentItem | undefined => {
      const candidates = ownedItems.filter((it) => it.slot === slot);
      if (candidates.length === 0) return undefined;
      return candidates.sort((a, b) => statSum(b) - statSum(a) || b.price - a.price)[0];
    };

    const next: EquippedGear = {};
    const armor = bestForSlot('armor');
    const head = bestForSlot('head');
    const headAcc = bestForSlot('headAccessory');
    const eyewear = bestForSlot('eyewear');
    const body = bestForSlot('body');
    const back = bestForSlot('back');

    if (armor && statSum(armor) > 0) next.armor = armor.id;
    if (head && statSum(head) > 0) next.head = head.id;
    if (headAcc && statSum(headAcc) > 0) next.headAccessory = headAcc.id;
    if (eyewear && statSum(eyewear) > 0) next.eyewear = eyewear.id;
    if (body && statSum(body) > 0) next.body = body.id;
    if (back && statSum(back) > 0) next.back = back.id;

    // Comparar melhor Arma de 2 mãos vs melhor Arma de 1 mão + melhor Escudo
    const weapons2H = ownedItems
      .filter((it) => it.slot === 'weapon' && it.twoHanded)
      .sort((a, b) => statSum(b) - statSum(a));
    const weapons1H = ownedItems
      .filter((it) => it.slot === 'weapon' && !it.twoHanded)
      .sort((a, b) => statSum(b) - statSum(a));
    const bestShield = bestForSlot('shield');

    const best2H = weapons2H[0];
    const best1H = weapons1H[0];
    const score2H = best2H ? statSum(best2H) : -1;
    const score1HPlusShield =
      (best1H ? statSum(best1H) : 0) + (bestShield ? statSum(bestShield) : 0);

    if (score2H > score1HPlusShield && best2H && score2H > 0) {
      next.weapon = best2H.id;
    } else {
      if (best1H && statSum(best1H) > 0) next.weapon = best1H.id;
      if (bestShield && statSum(bestShield) > 0) next.shield = bestShield.id;
    }

    setEquipped(next);
    const total = computeTotalAttributes(next);
    showToast(
      `⚡ Melhores itens equipados! (STR ${total.str} · INT ${total.int} · CON ${total.con} · PER ${total.per})`
    );
  };

  const handleUnequipCostumeSlot = (slot: EquipmentSlot) => {
    if (!costume[slot]) return;
    setCostume((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const handleClearCostume = () => {
    setCostume({});
    showToast('🧹 Fantasia limpa.');
  };

  const handleCopyBattleToCostume = () => {
    setCostume({ ...equipped });
    showToast('🎭 Equipamento de Batalha copiado para Fantasia!');
  };

  const handleHatchEgg = () => {
    if (stable.eggs <= 0 || stable.potions <= 0) return;
    const petId = pickRandomUnownedPet(stable.pets);
    if (!petId) {
      showToast('Você já desbloqueou todos os mascotes!');
      return;
    }
    setStable((prev) => ({
      ...prev,
      eggs: prev.eggs - 1,
      potions: prev.potions - 1,
      pets: { ...prev.pets, [petId]: 1 },
      equippedPet: petId,
    }));
    pushActionLog(`🐣 ${heroName} chocou um mascote aleatório: ${formatPetName(petId)}!`);
    showToast(`🐣 Nasceu um novo mascote: ${formatPetName(petId)}!`);
  };

  const handleTogglePet = (petId: string) => {
    setStable((prev) => ({
      ...prev,
      equippedPet: prev.equippedPet === petId ? undefined : petId,
    }));
  };

  const handleToggleCostumeEquip = (item: EquipmentItem) => {
    setCostume((prev) => {
      if (prev[item.slot] === item.id) {
        const next = { ...prev };
        delete next[item.slot];
        return next;
      }
      return applyGearItem(prev, item);
    });
  };

  const handleAllocateStat = (statKey: keyof Attributes) => {
    if (unallocatedPoints <= 0) return;
    setStats((s) => {
      const curr = s.allocatedStats ?? ZERO_ATTRS;
      return {
        ...s,
        allocatedStats: { ...curr, [statKey]: curr[statKey] + 1 },
      };
    });
    showToast(`+1 ponto alocado em ${statKey.toUpperCase()}!`);
  };

  const handleRebirth = () => {
    if (stats.level < 10) {
      showToast('⚠️ O Renascimento exige Nível 10 ou superior.');
      return;
    }
    setStats((s) => ({
      ...s,
      level: 1,
      hp: 50,
      max_hp: 50,
      mp: 30,
      max_mp: 32,
      xp: 0,
      xp_to_next: 350,
      gold: s.gold + 50,
      heroClass: 'apprentice',
      buffs: { ...ZERO_ATTRS },
      allocatedStats: { ...ZERO_ATTRS },
      rebirths: (s.rebirths ?? 0) + 1,
    }));
    setMetrics((m) => ({ ...m, totalGoldEarned: m.totalGoldEarned + 50 }));
    pushActionLog(`🌟 ${heroName} renasceu no Nível 1 como Aprendiz (+50 GP)!`);
    showToast('🌟 Renascimento concluído (+50 GP)! Você voltou a ser Aprendiz.');
  };

  const handleResetLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStats(DEFAULT_STATS);
    setStudyEntries([]);
    setWorkoutEntries([]);
    setParty(DEFAULT_PARTY);
    setAppearance(DEFAULT_APPEARANCE);
    setEquipped(DEFAULT_EQUIPPED);
    setCostume(DEFAULT_EQUIPPED);
    setUseCostume(false);
    setInventory(DEFAULT_INVENTORY);
    setStable(DEFAULT_STABLE);
    setMetrics(DEFAULT_METRICS);
    setBossMods({});
    setMessages([
      {
        id: 'm1',
        author: 'Sistema',
        kind: 'system',
        text: 'Temporada iniciada do zero no Nível 1!',
        time: 'Agora',
      },
    ]);
    showToast('🔄 Progresso local zerado para o Nível 1!');
  };

  const handleBuyPotion = () => {
    if (stats.gold < 15 || stats.hp >= stats.max_hp) return;
    setStats((s) => ({
      ...s,
      gold: s.gold - 15,
      hp: Math.min(s.max_hp, s.hp + 30),
    }));
    pushActionLog(`🧪 ${heroName} usou um Tônico de Estamina (+30 STA, -15 GP).`);
    showToast('🧪 Tônico de Estamina usado (+30 STA)!');
  };

  const handleBuyManaPotion = () => {
    if (stats.gold < 15 || stats.mp >= stats.max_mp) return;
    setStats((s) => ({
      ...s,
      gold: s.gold - 15,
      mp: Math.min(s.max_mp, s.mp + 25),
    }));
    pushActionLog(`🔷 ${heroName} usou um Elixir de Mana (+25 MP, -15 GP).`);
    showToast('🔷 Elixir de Mana usado (+25 MP)!');
  };

  const handleBuyHatchPotion = (count = 1) => {
    const cost = 25 * count;
    if (stats.gold < cost) return;
    setStats((s) => ({ ...s, gold: s.gold - cost }));
    setStable((prev) => ({
      ...prev,
      potions: prev.potions + count,
    }));
    pushActionLog(`🧪 ${heroName} comprou ${count}x Poção de Chocar (-${cost} GP).`);
    showToast(`🧪 Comprou +${count} Poção de Chocar!`);
  };

  const handleSellEgg = () => {
    if (stable.eggs <= 0) return;
    setStable((prev) => ({
      ...prev,
      eggs: prev.eggs - 1,
    }));
    setStats((s) => ({ ...s, gold: s.gold + 5 }));
    setMetrics((m) => ({ ...m, totalGoldEarned: m.totalGoldEarned + 5 }));
    showToast('🪙 Ovo vendido por +5 GP!');
  };

  const handleSellPotion = () => {
    if (stable.potions <= 0) return;
    setStable((prev) => ({
      ...prev,
      potions: prev.potions - 1,
    }));
    setStats((s) => ({ ...s, gold: s.gold + 5 }));
    setMetrics((m) => ({ ...m, totalGoldEarned: m.totalGoldEarned + 5 }));
    showToast('🪙 Poção de Chocar vendida por +5 GP!');
  };

  const loadOnlineBundle = async (uid: string, fallbackNick?: string) => {
    setOnlineLoaded(false);
    let bundle = await fetchUserBundle(uid);

    // Se o perfil ou o vínculo com a KTZ ainda não existir, cria e vincula automaticamente
    if (!bundle || !bundle.party) {
      await joinOrCreateKtzParty(uid, fallbackNick || heroName || 'Aprendiz');
      bundle = await fetchUserBundle(uid);
      if (!bundle) return;
    }

    const p = bundle.profile;
    const loadedLevel = p.level ?? 1;
    setHeroName(p.username);
    setStats({
      level: loadedLevel,
      hp: p.hp ?? 50,
      max_hp: p.max_hp ?? 50,
      mp: p.mp ?? 30,
      max_mp: p.max_mp ?? 32,
      xp: p.xp ?? 0,
      xp_to_next: getXpToNextLevel(loadedLevel),
      gold: p.gold ?? 0,
      heroClass: p.hero_class ?? 'apprentice',
      buffs: p.buffs ?? { ...ZERO_ATTRS },
      rebirths: p.rebirths ?? 0,
      allocatedStats: p.allocated_stats ?? { ...ZERO_ATTRS },
    });
    setAppearance(p.appearance ?? DEFAULT_APPEARANCE);
    setEquipped(p.equipped ?? DEFAULT_EQUIPPED);
    setCostume(p.costume ?? DEFAULT_EQUIPPED);
    setUseCostume(Boolean(p.use_costume));
    setInventory(Array.isArray(p.inventory) ? p.inventory : DEFAULT_INVENTORY);
    setStable(normalizeStableState(p.stable ?? DEFAULT_STABLE));
    setMetrics({ ...DEFAULT_METRICS, ...(p.metrics ?? {}) });
    setStudyEntries(Array.isArray(p.study_entries) ? p.study_entries : []);
    setWorkoutEntries(Array.isArray(p.workout_entries) ? p.workout_entries : []);
    setRemoteParty(bundle.party);
    setRemoteMembers(bundle.members);
    setMessages(
      bundle.messages.length > 0
        ? bundle.messages.map((m) => ({
            id: m.id,
            author: m.username,
            kind: m.kind,
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
        : [
            {
              id: 'ktz-welcome',
              author: 'Sistema',
              kind: 'system',
              text: 'Bem-vindo à KTZ - Know The Zero! Registre estudos e treinos para enfrentar o Boss.',
              time: 'Agora',
            },
          ]
    );
    setOnlineLoaded(true);
  };

  const refreshSupabaseSession = async () => {
    if (!isSupabaseConfigured()) {
      setUserId(null);
      setUserEmail(null);
      setOnlineLoaded(false);
      setRemoteParty(null);
      setRemoteMembers([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    const metaNick = (data.user?.user_metadata?.username as string | undefined) ?? undefined;
    setUserId(uid);
    setUserEmail(data.user?.email ?? null);
    if (uid) {
      await loadOnlineBundle(uid, metaNick);
    } else {
      setOnlineLoaded(false);
      setRemoteParty(null);
      setRemoteMembers([]);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled) return;
        const uid = data.user?.id ?? null;
        const metaNick = (data.user?.user_metadata?.username as string | undefined) ?? undefined;
        setUserId(uid);
        setUserEmail(data.user?.email ?? null);
        if (uid) {
          loadOnlineBundle(uid, metaNick);
        } else {
          // Abre o modal de conta automaticamente ao entrar no site online sem sessão ativa
          setAuthOpen(true);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !userId || !onlineLoaded || !isSupabaseConfigured()) return;
    const t = setTimeout(() => {
      syncProfileToSupabase(userId, {
        username: heroName,
        hero_class: stats.heroClass,
        level: stats.level,
        hp: stats.hp,
        max_hp: stats.max_hp,
        mp: stats.mp,
        max_mp: stats.max_mp,
        xp: stats.xp,
        xp_to_next: stats.xp_to_next,
        gold: stats.gold,
        rebirths: stats.rebirths ?? 0,
        allocated_stats: stats.allocatedStats ?? ZERO_ATTRS,
        buffs: stats.buffs ?? ZERO_ATTRS,
        appearance,
        equipped,
        costume,
        use_costume: useCostume,
        inventory,
        stable,
        metrics,
        study_entries: studyEntries,
        workout_entries: workoutEntries,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [
    hydrated,
    userId,
    onlineLoaded,
    heroName,
    stats,
    appearance,
    equipped,
    costume,
    useCostume,
    inventory,
    stable,
    metrics,
    studyEntries,
    workoutEntries,
  ]);

  useEffect(() => {
    if (!remoteParty?.id || !isSupabaseConfigured()) return;
    const supabase = createClient();
    const pid = remoteParty.id;

    const channel = supabase
      .channel(`ktz-${pid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parties', filter: `id=eq.${pid}` },
        (payload) => {
          setRemoteParty(payload.new as RemoteParty);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `party_id=eq.${pid}` },
        () => {
          supabase
            .from('profiles')
            .select('*')
            .eq('party_id', pid)
            .then(({ data }) => {
              if (data) setRemoteMembers(data as RemoteProfile[]);
            });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'party_messages', filter: `party_id=eq.${pid}` },
        (payload) => {
          const m = payload.new as {
            id: string;
            user_id?: string | null;
            username: string;
            kind: 'chat' | 'system';
            content: string;
            created_at: string;
          };
          // Aplica efeitos coletivos de skills de membros aliados da KTZ em tempo real
          if (m.kind === 'system' && m.user_id && m.user_id !== userId && m.content.startsWith('🤝 ')) {
            const healMatch = m.content.match(/\+(\d+) STA para toda a KTZ/);
            const manaMatch = m.content.match(/\+(\d+) MP para toda a KTZ/);
            const conMatch = m.content.match(/\+(\d+) CON para toda a KTZ/);
            const strMatch = m.content.match(/\+(\d+) STR para toda a KTZ/);
            const perMatch = m.content.match(/\+(\d+) PER para toda a KTZ/);
            if (healMatch) {
              const val = Number(healMatch[1]);
              setStats((s) => ({ ...s, hp: Math.min(s.max_hp, s.hp + val) }));
            } else if (manaMatch) {
              const val = Number(manaMatch[1]);
              setStats((s) => ({ ...s, mp: Math.min(s.max_mp, s.mp + val) }));
            } else if (conMatch) {
              const val = Number(conMatch[1]);
              setStats((s) => ({ ...s, buffs: { ...s.buffs, con: Math.min(40, s.buffs.con + val) } }));
            } else if (strMatch) {
              const val = Number(strMatch[1]);
              setStats((s) => ({ ...s, buffs: { ...s.buffs, str: Math.min(40, s.buffs.str + val) } }));
            } else if (perMatch) {
              const val = Number(perMatch[1]);
              setStats((s) => ({ ...s, buffs: { ...s.buffs, per: Math.min(40, s.buffs.per + val) } }));
            } else if (m.content.includes('Boss Vulnerável')) {
              setBossMods((bm) => ({ ...bm, vulnerable: true }));
            } else if (m.content.includes('Boss Enfraquecido')) {
              setBossMods((bm) => ({ ...bm, weakened: true }));
            }
          }
          setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev;
            return [
              {
                id: m.id,
                author: m.username,
                kind: m.kind,
                text: m.content,
                time: new Date(m.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
              ...prev.slice(0, 99),
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [remoteParty?.id]);

  // Recompensa compartilhada automática para membros da KTZ que participaram do Boss derrotado por outro aliado
  useEffect(() => {
    if (!hydrated || !remoteParty) return;
    const partyStage = remoteParty.boss_stage ?? 1;
    const prevStage = partyStage - 1;
    if (
      prevStage >= 1 &&
      metrics.currentBossStage === prevStage &&
      (metrics.currentBossDamage ?? 0) > 0 &&
      (metrics.lastClaimedBossStage ?? 0) < prevStage
    ) {
      const prevBoss = getProgressiveBoss(prevStage);
      const victoryRes = grantXpAndResources(stats, totalAttributes, {
        xp: prevBoss.rewardXp,
        goldDelta: prevBoss.rewardGold,
        fullRestore: true,
        resetBuffs: true,
      });
      setStats(victoryRes.nextStats);
      setBossMods({});
      setStable((prev) => ({
        ...prev,
        eggs: prev.eggs + prevBoss.dropCount,
        potions: prev.potions + prevBoss.dropCount,
      }));
      const sharedGearDrop = rollBossEquipmentDrop(inventory, prevStage);
      if (sharedGearDrop && !inventory.includes(sharedGearDrop.item.id)) {
        setInventory((prev) => [...prev, sharedGearDrop.item.id]);
      }
      setMetrics((m) => ({
        ...m,
        bossesDefeated: m.bossesDefeated + 1,
        totalGoldEarned: m.totalGoldEarned + prevBoss.rewardGold,
        currentBossStage: partyStage,
        currentBossDamage: 0,
        lastClaimedBossStage: prevStage,
      }));
      const sharedDropText = sharedGearDrop ? ` · 🎁 ${sharedGearDrop.label}` : '';
      showToast(
        `🏆 A guilda derrotou ${prevBoss.name}! +${prevBoss.rewardGold} GP, +${prevBoss.rewardXp} XP, +${prevBoss.dropCount} Ovo/Poção${sharedDropText} e STA/MP 100%!`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteParty?.boss_stage, hydrated]);

  const handleSelectBossMission = (bossIndex: number, cycle: number) => {
    const targetStage = cycle * BOSS_CATALOG.length + bossIndex + 1;
    const chosen = getBossAtIndexAndCycle(bossIndex, cycle);

    setMetrics((m) => ({
      ...m,
      currentBossStage: targetStage,
      currentBossDamage: 0,
    }));

    if (remoteParty) {
      updateRemotePartyBoss(remoteParty.id, {
        boss_stage: targetStage,
        boss_id: chosen.id,
        boss_name: chosen.name,
        boss_sprite: chosen.sprite,
        boss_hp: chosen.maxHp,
        boss_max_hp: chosen.maxHp,
        boss_attack: chosen.attack,
        reward_gold: chosen.rewardGold,
        reward_xp: chosen.rewardXp,
      });
    } else {
      setParty((p) => ({
        ...p,
        bossStage: targetStage,
        bossId: chosen.id,
        bossName: chosen.name,
        bossSprite: chosen.sprite,
        bossHp: chosen.maxHp,
        bossMaxHp: chosen.maxHp,
        bossAttack: chosen.attack,
        rewardGold: chosen.rewardGold,
        rewardXp: chosen.rewardXp,
      }));
    }

    pushActionLog(
      `📜 ${heroName} iniciou a missão: ${chosen.name} (${chosen.maxHp} HP)!`
    );
    showToast(`📜 Missão iniciada: ${chosen.name} (${chosen.maxHp} HP)!`);
  };

  const handleBuyArmoire = (count = 1) => {
    const cost = 40 * count;
    if (stats.gold < cost) return;

    let simInventory = [...inventory];
    let totalEggs = 0;
    let totalPotions = 0;
    const newEquipNames: string[] = [];
    let lastSingleLabel = '';

    for (let i = 0; i < count; i++) {
      const reward = rollArmoireReward(simInventory);
      lastSingleLabel = reward.label;
      if (reward.kind === 'equipment') {
        if (!simInventory.includes(reward.item.id)) {
          simInventory.push(reward.item.id);
        }
        newEquipNames.push(reward.item.name);
      } else if (reward.kind === 'egg') {
        totalEggs += 1;
      } else if (reward.kind === 'potion') {
        totalPotions += 1;
      }
    }

    const armoireRes = grantXpAndResources(stats, totalAttributes, {
      goldDelta: -cost,
    });
    setStats(armoireRes.nextStats);
    setMetrics((m) => ({
      ...m,
      armoireOpened: m.armoireOpened + count,
    }));
    if (simInventory.length > inventory.length) {
      setInventory(simInventory);
    }
    if (totalEggs > 0 || totalPotions > 0) {
      setStable((prev) => ({
        ...prev,
        eggs: prev.eggs + totalEggs,
        potions: prev.potions + totalPotions,
      }));
    }

    if (count === 1) {
      pushActionLog(`🎁 ${heroName} abriu o Armoire Encantado e ganhou: ${lastSingleLabel}!`);
      showToast(`🎁 Armoire Encantado: ${lastSingleLabel}!`);
    } else {
      const parts: string[] = [];
      if (newEquipNames.length > 0) parts.push(`${newEquipNames.length} equips`);
      if (totalEggs > 0) parts.push(`${totalEggs} Ovos`);
      if (totalPotions > 0) parts.push(`${totalPotions} Poções`);
      const summary = parts.join(', ');
      pushActionLog(`🎁 ${heroName} abriu ${count}x o Armoire Encantado: ${summary}!`);
      showToast(`🎁 ${count}x Armoire: ${summary}!`);
    }
  };

  const handleExportSave = () => {
    const payload = JSON.stringify(
      { heroName, stats, studyEntries, workoutEntries, party, appearance, equipped, costume, useCostume, inventory, stable, metrics, messages },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habitquest-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 Backup exportado!');
  };

  const handleImportSave = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.heroName) setHeroName(parsed.heroName);
      if (parsed.stats) setStats({ ...DEFAULT_STATS, ...parsed.stats });
      if (parsed.studyEntries) setStudyEntries(parsed.studyEntries);
      if (parsed.workoutEntries) setWorkoutEntries(parsed.workoutEntries);
      if (parsed.party) setParty({ ...DEFAULT_PARTY, ...parsed.party });
      if (parsed.appearance) setAppearance(parsed.appearance);
      if (parsed.equipped) setEquipped(parsed.equipped);
      if (parsed.costume) setCostume(parsed.costume);
      if (typeof parsed.useCostume === 'boolean') setUseCostume(parsed.useCostume);
      if (parsed.inventory) setInventory(parsed.inventory);
      if (parsed.stable) setStable(normalizeStableState(parsed.stable));
      if (parsed.metrics) setMetrics({ ...DEFAULT_METRICS, ...parsed.metrics });
      if (parsed.messages) setMessages(parsed.messages);
      showToast('✅ Backup restaurado com sucesso!');
    } catch {
      showToast('❌ Arquivo de backup inválido.');
    }
  };

  const handleSendChat = (text: string) => {
    if (remoteParty) {
      sendRemotePartyMessage(remoteParty.id, userId, heroName, text, 'chat');
      return;
    }
    setMessages((prev) => [
      {
        id: crypto.randomUUID(),
        author: heroName,
        kind: 'chat',
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 99),
    ]);
  };

  const activeBossStage = remoteParty ? (remoteParty.boss_stage ?? 1) : party.bossStage;
  const activeBossName = remoteParty ? remoteParty.boss_name : party.bossName;
  const activeBossSprite = remoteParty ? remoteParty.boss_sprite : party.bossSprite;
  const activeBossHp = remoteParty ? remoteParty.boss_hp : party.bossHp;
  const activeBossMaxHp = remoteParty ? remoteParty.boss_max_hp : party.bossMaxHp;
  const activeRewardGold = remoteParty ? remoteParty.reward_gold : party.rewardGold;
  const activeRewardXp = remoteParty ? remoteParty.reward_xp : party.rewardXp;
  const supabaseReady = isSupabaseConfigured();

  const [nowTs, setNowTs] = useState<number | null>(null);
  useEffect(() => {
    setNowTs(Date.now());
  }, []);

  const questsState = useMemo(
    () => (nowTs !== null ? syncQuestsPeriod(metrics.quests, new Date(nowTs)) : null),
    [metrics.quests, nowTs]
  );

  useEffect(() => {
    if (!questsState) return;
    const m = metrics.quests;
    if (
      !m ||
      m.dailyKey !== questsState.dailyKey ||
      m.weeklyKey !== questsState.weeklyKey ||
      m.monthlyKey !== questsState.monthlyKey
    ) {
      setMetrics((prev) => ({ ...prev, quests: questsState }));
    }
  }, [metrics.quests, questsState]);

  const periodTotals = useMemo(
    () =>
      nowTs !== null
        ? computePeriodTotals(studyEntries, workoutEntries, new Date(nowTs))
        : {
            daily: { studyMinutes: 0, questionsDone: 0, runKm: 0, workoutsCount: 0 },
            weekly: { studyMinutes: 0, questionsDone: 0, runKm: 0, workoutsCount: 0 },
            monthly: { studyMinutes: 0, questionsDone: 0, runKm: 0, workoutsCount: 0 },
          },
    [studyEntries, workoutEntries, nowTs]
  );

  const dailyQuests = useMemo(
    () =>
      questsState
        ? buildQuestProgressList(
            questsState.dailyQuestIds,
            questsState.dailyClaimedIds,
            periodTotals.daily,
            stats.level
          )
        : [],
    [questsState, periodTotals.daily, stats.level]
  );

  const weeklyQuests = useMemo(
    () =>
      questsState
        ? buildQuestProgressList(
            questsState.weeklyQuestIds,
            questsState.weeklyClaimedIds,
            periodTotals.weekly,
            stats.level
          )
        : [],
    [questsState, periodTotals.weekly, stats.level]
  );

  const monthlyQuests = useMemo(
    () =>
      questsState
        ? buildQuestProgressList(
            MONTHLY_QUESTS_POOL.map((q) => q.id),
            questsState.monthlyClaimedIds,
            periodTotals.monthly,
            stats.level
          )
        : [],
    [questsState, periodTotals.monthly, stats.level]
  );

  const canClaimMonthlyBonus =
    Boolean(questsState) &&
    monthlyQuests.length === 4 &&
    monthlyQuests.every((q) => q.completed) &&
    !questsState!.monthlyBonusClaimed;

  const readyQuestsCount =
    [...dailyQuests, ...weeklyQuests, ...monthlyQuests].filter((q) => q.completed && !q.claimed)
      .length + (canClaimMonthlyBonus ? 1 : 0);

  const canCheckInToday =
    nowTs !== null && canClaimDailyCheckIn(metrics.checkin, new Date(nowTs));
  const currentCheckInStreak = metrics.checkin?.streak ?? 0;

  const handleClaimCheckIn = () => {
    const now = new Date();
    const todayKey = getDayKey(now);
    if (!canClaimDailyCheckIn(metrics.checkin, now)) return;

    const nextStreak = getProjectedStreak(metrics.checkin, now);
    const reward = computeCheckInReward(stats.level, stats.max_hp, stats.max_mp, nextStreak);

    const res = grantXpAndResources(stats, totalAttributes, {
      goldDelta: reward.gold,
    });
    const nextStats: PlayerStats = {
      ...res.nextStats,
      hp: Math.min(res.nextStats.max_hp, res.nextStats.hp + reward.staRestore),
      mp: Math.min(res.nextStats.max_mp, res.nextStats.mp + reward.mpRestore),
    };
    setStats(nextStats);

    let extraEggs = 0;
    let extraPotions = 0;
    let armoireLabel = '';

    if (reward.milestoneBonus === 'egg_or_potion') {
      if (Math.random() < 0.5) extraEggs += 1;
      else extraPotions += 1;
    } else if (reward.milestoneBonus === 'egg_and_potion') {
      extraEggs += 1;
      extraPotions += 1;
    } else if (reward.milestoneBonus === 'armoire') {
      const drop = rollArmoireReward(inventory);
      armoireLabel = drop.label;
      if (drop.kind === 'equipment') {
        if (!inventory.includes(drop.item.id)) {
          setInventory((prev) => [...prev, drop.item.id]);
        }
      } else if (drop.kind === 'egg') {
        extraEggs += 1;
      } else if (drop.kind === 'potion') {
        extraPotions += 1;
      }
    }

    if (extraEggs > 0 || extraPotions > 0) {
      setStable((prev) => ({
        ...prev,
        eggs: prev.eggs + extraEggs,
        potions: prev.potions + extraPotions,
      }));
    }

    setMetrics((prev) => ({
      ...prev,
      totalGoldEarned: prev.totalGoldEarned + reward.gold,
      checkin: {
        lastClaimDayKey: todayKey,
        streak: nextStreak,
        totalCheckIns: (prev.checkin?.totalCheckIns ?? DEFAULT_CHECKIN_STATE.totalCheckIns) + 1,
      },
    }));

    const bonusParts: string[] = [];
    if (extraEggs > 0) bonusParts.push(`+${extraEggs} Ovo`);
    if (extraPotions > 0) bonusParts.push(`+${extraPotions} Poção`);
    if (armoireLabel) bonusParts.push(`🎁 ${armoireLabel}`);
    const bonusText = bonusParts.length > 0 ? ` · ${bonusParts.join(', ')}` : '';

    pushActionLog(
      `📅 ${heroName} fez Check-in Diário (${nextStreak}d): +${reward.gold} GP, +${reward.staRestore} STA, +${reward.mpRestore} MP${bonusText}!`
    );
    showToast(
      `📅 Check-in ${nextStreak}d! +${reward.gold} GP, +${reward.staRestore} STA, +${reward.mpRestore} MP${bonusText}`
    );
  };

  const handleInspectLocal = () => {
    setInspectedMember({
      id: userId ?? 'local-hero',
      username: heroName,
      hero_class: stats.heroClass,
      level: stats.level,
      hp: stats.hp,
      max_hp: stats.max_hp,
      mp: stats.mp,
      max_mp: stats.max_mp,
      xp: stats.xp,
      xp_to_next: stats.xp_to_next,
      gold: stats.gold,
      is_sleeping: false,
      rebirths: stats.rebirths ?? 0,
      allocated_stats: stats.allocatedStats ?? { ...ZERO_ATTRS },
      buffs: stats.buffs ?? { ...ZERO_ATTRS },
      appearance,
      equipped,
      costume,
      use_costume: useCostume,
      inventory,
      stable,
      metrics,
      study_entries: studyEntries,
      workout_entries: workoutEntries,
      party_id: remoteParty?.id ?? null,
    });
  };

  const handleClaimQuest = (questId: string, cycle: QuestCycle) => {
    const def = getQuestById(questId);
    if (!def) return;

    const list =
      cycle === 'daily' ? dailyQuests : cycle === 'weekly' ? weeklyQuests : monthlyQuests;
    const item = list.find((q) => q.def.id === questId);
    if (!item || !item.completed || item.claimed) return;

    const { gold, eggOrPotionChance, guaranteedEggOrPotion, eggs = 0, potions = 0 } =
      def.reward;
    const xp = item.scaledXp;

    let bonusEggs = eggs;
    let bonusPotions = potions;
    if (guaranteedEggOrPotion || (eggOrPotionChance && Math.random() < eggOrPotionChance)) {
      if (Math.random() < 0.5) bonusEggs += 1;
      else bonusPotions += 1;
    }

    const res = grantXpAndResources(stats, totalAttributes, {
      xp,
      goldDelta: gold,
    });
    setStats(res.nextStats);

    if (bonusEggs > 0 || bonusPotions > 0) {
      setStable((prev) => ({
        ...prev,
        eggs: prev.eggs + bonusEggs,
        potions: prev.potions + bonusPotions,
      }));
    }

    setMetrics((prev) => {
      const synced = syncQuestsPeriod(prev.quests);
      return {
        ...prev,
        totalGoldEarned: prev.totalGoldEarned + gold,
        quests: {
          ...synced,
          dailyClaimedIds:
            cycle === 'daily'
              ? [...synced.dailyClaimedIds, questId]
              : synced.dailyClaimedIds,
          weeklyClaimedIds:
            cycle === 'weekly'
              ? [...synced.weeklyClaimedIds, questId]
              : synced.weeklyClaimedIds,
          monthlyClaimedIds:
            cycle === 'monthly'
              ? [...synced.monthlyClaimedIds, questId]
              : synced.monthlyClaimedIds,
          totalQuestsCompleted: (synced.totalQuestsCompleted ?? 0) + 1,
        },
      };
    });

    const extraParts: string[] = [];
    if (bonusEggs > 0) extraParts.push(`+${bonusEggs} Ovo`);
    if (bonusPotions > 0) extraParts.push(`+${bonusPotions} Poção`);
    if (cycle === 'weekly') {
      const weeklyEquip = rollWeeklyQuestEquipmentDrop(inventory);
      if (weeklyEquip && !inventory.includes(weeklyEquip.item.id)) {
        setInventory((prev) => [...prev, weeklyEquip.item.id]);
        extraParts.push(`🎁 ${weeklyEquip.label}`);
      }
    }
    const extraText = extraParts.length > 0 ? ` · ${extraParts.join(', ')}` : '';

    pushActionLog(
      `🎯 ${heroName} concluiu a missão "${def.title}": +${xp} XP, +${gold} GP${extraText}!`
    );
    showToast(`🎯 Missão Concluída! +${xp} XP, +${gold} GP${extraText}`);
  };

  const handleClaimMonthlyBonus = () => {
    if (!canClaimMonthlyBonus) return;

    const equipDrop = rollGuaranteedEquipment(inventory);
    const scaledBonusXp = getQuestXpForLevel(MONTHLY_BONUS_REWARD.xp, stats.level);
    const res = grantXpAndResources(stats, totalAttributes, {
      xp: scaledBonusXp,
      goldDelta: MONTHLY_BONUS_REWARD.gold,
    });
    setStats(res.nextStats);

    if (equipDrop && !inventory.includes(equipDrop.item.id)) {
      setInventory((prev) => [...prev, equipDrop.item.id]);
    }

    setMetrics((prev) => {
      const synced = syncQuestsPeriod(prev.quests);
      return {
        ...prev,
        totalGoldEarned: prev.totalGoldEarned + MONTHLY_BONUS_REWARD.gold,
        quests: {
          ...synced,
          monthlyBonusClaimed: true,
        },
      };
    });

    const dropLabel = equipDrop ? ` · 🎁 ${equipDrop.label}` : '';
    pushActionLog(
      `👑 ${heroName} fechou todas as 4 Metas Mensais PRF e abriu o Baú de Honra: +${scaledBonusXp} XP, +${MONTHLY_BONUS_REWARD.gold} GP${dropLabel}!`
    );
    showToast(
      `👑 Baú de Honra PRF! +${scaledBonusXp} XP, +${MONTHLY_BONUS_REWARD.gold} GP${dropLabel}`
    );
  };

  const showRegistroSection = activeSection === 'registro';
  const showQuestsSection = activeSection === 'quests';
  const showKtzSection = activeSection === 'ktz';
  const gearMode: 'inventory' | 'shop' | null =
    activeSection === 'inventario'
      ? 'inventory'
      : activeSection === 'loja'
        ? 'shop'
        : null;

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-8 bg-[#1a181d] text-[#f3f1f7]">
      <HabiticaHeader
        heroName={heroName}
        userEmail={userEmail}
        stats={stats}
        unallocatedPoints={unallocatedPoints}
        appearance={appearance}
        equipped={equipped}
        costume={costume}
        useCostume={useCostume}
        petId={stable.equippedPet}
        ownedEquipmentCount={inventory.length}
        ownedPetsCount={Object.keys(stable.pets).length}
        totalAttributes={totalAttributes}
        bossStage={activeBossStage}
        bossName={activeBossName}
        bossSprite={activeBossSprite}
        bossHp={activeBossHp}
        bossMaxHp={activeBossMaxHp}
        bossAttack={activeBossAttack}
        remoteMembers={remoteMembers}
        activeSection={activeSection}
        invTab={invTab}
        shopFilter={shopFilter}
        readyQuestsCount={readyQuestsCount}
        canClaimCheckIn={canCheckInToday}
        checkInStreak={currentCheckInStreak}
        supabaseReady={supabaseReady}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (sec === 'ktz') setMobileTab('ktz');
          else if (sec === 'quests') setMobileTab('quests');
          else if (sec === 'inventario') setMobileTab('inventario');
          else if (sec === 'loja') setMobileTab('loja');
          else if (mobileTab !== 'study' && mobileTab !== 'workout') setMobileTab('study');
        }}
        onSelectInvTab={setInvTab}
        onSelectShopFilter={setShopFilter}
        onOpenStats={() => setStatsOpen(true)}
        onOpenCheckIn={() => setCheckInOpen(true)}
        onInspectMember={(m) => setInspectedMember(m)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Gaveta de Classes e Habilidades (Estilo Habitica Skills Drawer) */}
      {showRegistroSection && (
        <SkillsBar
          heroClass={stats.heroClass}
          level={stats.level}
          mp={stats.mp}
          guardCharges={stats.guardCharges}
          critGuarantee={stats.critGuarantee}
          shadowCharges={stats.shadowCharges}
          onChangeClass={handleChangeClass}
          onCastSkill={handleCastSkill}
        />
      )}

      {/* Notificação Flutuante Estilo Habitica */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 bg-[#271b3d] border-2 border-[#925cf3] text-white text-xs sm:text-sm font-condensed font-bold px-4 py-2.5 rounded-md shadow-2xl">
          {toast}
        </div>
      )}

      {/* Aba 1: REGISTRO (Resumo Missão Diária + Colunas de Estudo Teórico + Treinamento Físico Diário) */}
      {showRegistroSection && (
        <>
          <QuestsSummaryStrip
            dailyQuest={dailyQuests[0]}
            readyCount={readyQuestsCount}
            onOpenQuests={() => {
              setActiveSection('quests');
              setMobileTab('quests');
            }}
            onClaimDaily={(qId) => handleClaimQuest(qId, 'daily')}
          />
          <main className="max-w-7xl w-full mx-auto px-4 pt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={mobileTab === 'workout' ? 'hidden md:block' : 'block'}>
              <StudyLogCard
                entries={studyEntries}
                stats={stats}
                totalAttributes={totalAttributes}
                bossAttack={activeBossAttack}
                onAddStudy={handleAddStudy}
                onDeleteStudy={handleDeleteStudy}
              />
            </div>

            <div className={mobileTab === 'study' ? 'hidden md:block' : 'block'}>
              <WorkoutLogCard
                entries={workoutEntries}
                stats={stats}
                totalAttributes={totalAttributes}
                bossAttack={activeBossAttack}
                onAddWorkout={handleAddWorkout}
                onDeleteWorkout={handleDeleteWorkout}
              />
            </div>
          </main>
        </>
      )}

      {/* Aba Missões PRF (Diária, Semanais e Metas Mensais) */}
      {showQuestsSection && questsState && (
        <QuestsPanel
          level={stats.level}
          dailyQuests={dailyQuests}
          weeklyQuests={weeklyQuests}
          monthlyQuests={monthlyQuests}
          monthlyBonusClaimed={questsState.monthlyBonusClaimed}
          totalQuestsCompleted={questsState.totalQuestsCompleted}
          dailyKey={questsState.dailyKey}
          weeklyKey={questsState.weeklyKey}
          monthlyKey={questsState.monthlyKey}
          onClaimQuest={handleClaimQuest}
          onClaimMonthlyBonus={handleClaimMonthlyBonus}
          onPeriodTick={() => setNowTs(Date.now())}
        />
      )}

      {/* Abas 2 & 3: INVENTÁRIO e LOJA (Views de Página Inteira Estilo Habitica) */}
      <EquipmentPanel
        mode={gearMode}
        invTab={invTab}
        shopFilter={shopFilter}
        onChangeInvTab={setInvTab}
        onChangeShopFilter={(filter) => {
          setShopFilter(filter);
          setActiveSection('loja');
          setMobileTab('loja');
        }}
        gold={stats.gold}
        hp={stats.hp}
        maxHp={stats.max_hp}
        mp={stats.mp}
        maxMp={stats.max_mp}
        heroClass={stats.heroClass}
        appearance={appearance}
        equipped={equipped}
        costume={costume}
        useCostume={useCostume}
        inventory={inventory}
        stable={stable}
        totalAttributes={totalAttributes}
        onChangeAppearance={setAppearance}
        onBuyItem={handleBuyItem}
        onBuyBatchItems={handleBuyBatchItems}
        onBuyPotion={handleBuyPotion}
        onBuyManaPotion={handleBuyManaPotion}
        onBuyArmoire={handleBuyArmoire}
        onBuyHatchPotion={handleBuyHatchPotion}
        onSellEgg={handleSellEgg}
        onSellPotion={handleSellPotion}
        onToggleEquip={handleToggleEquip}
        onUnequipSlot={handleUnequipSlot}
        onClearAllEquipped={handleClearAllEquipped}
        onAutoEquipBest={handleAutoEquipBest}
        onToggleCostumeEquip={handleToggleCostumeEquip}
        onUnequipCostumeSlot={handleUnequipCostumeSlot}
        onClearCostume={handleClearCostume}
        onCopyBattleToCostume={handleCopyBattleToCostume}
        onToggleUseCostume={() => setUseCostume((v) => !v)}
        onHatchEgg={handleHatchEgg}
        onTogglePet={handleTogglePet}
      />

      {/* Aba 4: KTZ - KNOW THE ZERO (2 Colunas Estilo Guild/Party do Habitica) */}
      <PartyPanel
        visible={showKtzSection}
        isOnline={Boolean(userId)}
        heroName={heroName}
        heroStats={stats}
        heroMetrics={metrics}
        heroAppearance={appearance}
        heroEquipped={equipped}
        heroCostume={costume}
        heroUseCostume={useCostume}
        heroPetId={stable.equippedPet}
        remoteParty={remoteParty}
        remoteMembers={remoteMembers}
        bossId={remoteParty ? remoteParty.boss_id : party.bossId}
        bossStage={activeBossStage}
        bossName={activeBossName}
        bossSprite={activeBossSprite}
        bossHp={activeBossHp}
        bossMaxHp={activeBossMaxHp}
        bossAttack={activeBossAttack}
        rewardGold={activeRewardGold}
        rewardXp={activeRewardXp}
        messages={messages}
        onSendChat={handleSendChat}
        onSelectBossMission={handleSelectBossMission}
        onInspectMember={(m) => setInspectedMember(m)}
        onInspectLocal={handleInspectLocal}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Modais: Perfil/Atributos/Conquistas, Check-in Diário, Inspeção de Membro e Conta */}
      <DailyCheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        level={stats.level}
        maxHp={stats.max_hp}
        maxMp={stats.max_mp}
        checkinState={metrics.checkin}
        canClaimToday={canCheckInToday}
        onClaimCheckIn={handleClaimCheckIn}
      />

      <MemberProfileModal
        member={inspectedMember}
        bossStage={activeBossStage}
        onClose={() => setInspectedMember(null)}
      />
      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        level={stats.level}
        rebirths={stats.rebirths ?? 0}
        unallocatedPoints={unallocatedPoints}
        petsCount={Object.keys(stable.pets).length}
        attributes={totalAttributes}
        metrics={metrics}
        studyEntries={studyEntries}
        workoutEntries={workoutEntries}
        onAllocateStat={handleAllocateStat}
        onRebirth={handleRebirth}
        onResetLocal={handleResetLocal}
        onExportSave={handleExportSave}
        onImportSave={handleImportSave}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        heroName={heroName}
        onChangeHeroName={setHeroName}
        userEmail={userEmail}
        onAuthSuccess={refreshSupabaseSession}
      />

      {/* Barra de Navegação Inferior no Mobile (6 Abas Estilo Habitica Mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#36205d] border-t border-[#4f2a93] grid grid-cols-6">
        {[
          { id: 'study', label: 'Estudo', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'workout', label: 'Treino', icon: <Dumbbell className="w-4 h-4" /> },
          { id: 'quests', label: 'Missões', icon: <ScrollText className="w-4 h-4" />, badge: readyQuestsCount },
          { id: 'inventario', label: 'Inventário', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'loja', label: 'Lojas', icon: <Store className="w-4 h-4" /> },
          { id: 'ktz', label: 'KTZ', icon: <Users className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              const id = tab.id as MobileTab;
              setMobileTab(id);
              if (id === 'ktz') setActiveSection('ktz');
              else if (id === 'quests') setActiveSection('quests');
              else if (id === 'inventario') setActiveSection('inventario');
              else if (id === 'loja') setActiveSection('loja');
              else setActiveSection('registro');
            }}
            className={`relative flex flex-col items-center justify-center py-2 text-[10px] font-condensed gap-0.5 ${
              mobileTab === tab.id ? 'text-[#ffbe5d] font-bold bg-[#271b3d]/50' : 'text-[#d6c7ff]/80'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <span className="absolute top-1 right-2 px-1 rounded-full bg-[#ffbe5d] text-[#1a181d] text-[9px] font-extrabold leading-tight">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
    </div>
  );
}
