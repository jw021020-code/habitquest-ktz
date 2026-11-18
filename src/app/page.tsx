'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Dumbbell, ShoppingBag, Store, Users } from 'lucide-react';
import {
  applyClassSkill,
  calculateStudyReward,
  calculateWorkoutReward,
  getUnallocatedStatPoints,
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
  EquippedGear,
  getEquipmentById,
} from '@/lib/game/items';
import {
  CLASS_INFO,
  CLASS_UNLOCK_LEVEL,
  ClassSkill,
  getProgressiveBoss,
} from '@/lib/game/skills';
import {
  DEFAULT_STABLE,
  formatPetName,
  hasMountForPet,
  normalizeStableState,
  pickRandomUnownedPet,
  rollTaskDrop,
  StableState,
} from '@/lib/game/pets';
import {
  DEFAULT_METRICS,
  HeroMetrics,
  rollArmoireReward,
} from '@/lib/game/achievements';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchUserBundle,
  joinOrCreateKtzParty,
  RemoteParty,
  RemoteProfile,
  sendRemotePartyMessage,
  syncProfileToSupabase,
  updateRemotePartyBoss,
} from '@/lib/supabase/data';
import { AuthModal } from '@/components/AuthModal';
import { EquipmentPanel } from '@/components/EquipmentPanel';
import {
  ActiveSection,
  HabiticaHeader,
  InventorySubTab,
  ShopSubTab,
} from '@/components/HabiticaHeader';
import { PartyChatMessage, PartyPanel } from '@/components/PartyPanel';
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

type MobileTab = 'study' | 'workout' | 'inventario' | 'loja' | 'ktz';

const STORAGE_KEY = 'habitquest_ktz_launch_v1';

const DEFAULT_STATS: PlayerStats = {
  level: 1,
  hp: 50,
  max_hp: 50,
  mp: 30,
  max_mp: 32,
  xp: 0,
  xp_to_next: 100,
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

  const totalAttributes = useMemo(() => {
    const gear = computeTotalAttributes(equipped);
    const alloc = stats.allocatedStats ?? ZERO_ATTRS;
    return {
      str: gear.str + stats.buffs.str + alloc.str,
      int: gear.int + stats.buffs.int + alloc.int,
      con: gear.con + stats.buffs.con + alloc.con,
      per: gear.per + stats.buffs.per + alloc.per,
    };
  }, [equipped, stats.buffs, stats.allocatedStats]);

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
    const currentHp = remoteParty ? remoteParty.boss_hp : party.bossHp;
    const bName = remoteParty ? remoteParty.boss_name : party.bossName;
    const rGold = remoteParty ? remoteParty.reward_gold : party.rewardGold;
    const rXp = remoteParty ? remoteParty.reward_xp : party.rewardXp;

    if (damage <= 0) {
      return { defeated: false, bossName: bName };
    }

    const defeated = currentHp - damage <= 0;

    if (defeated) {
      const nextStage = currentStage + 1;
      const nextBoss = getProgressiveBoss(nextStage);

      // Ao derrotar um Boss: recompensa (com checagem de Level-Up) + reset 100% STA/MP + reset buffs!
      const victoryRes = grantXpAndResources(latestStats, totalAttributes, {
        xp: rXp,
        goldDelta: rGold,
        fullRestore: true,
        resetBuffs: true,
      });

      setStats(victoryRes.nextStats);
      setMetrics((m) => ({
        ...m,
        bossesDefeated: m.bossesDefeated + 1,
        totalGoldEarned: m.totalGoldEarned + rGold,
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

      pushActionLog(
        `🏆 ${heroName} deu o golpe final em ${bName} (${sourceLabel})! +${rGold} GP, +${rXp} XP, Estamina/Mana 100%! Próximo: #${nextStage} ${nextBoss.name}.`
      );
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
    if (remoteParty) {
      updateRemotePartyBoss(remoteParty.id, { boss_hp: nextHp });
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

    const drop = rollTaskDrop();
    if (drop) {
      dropText = ` · 🎁 Drop: ${drop.label}!`;
      pushActionLog(`🎁 ${heroName} encontrou: ${drop.label}!`);
      setStable((prev) => {
        if (drop.kind === 'egg') {
          return { ...prev, eggs: prev.eggs + 1 };
        }
        if (drop.kind === 'potion') {
          return { ...prev, potions: prev.potions + 1 };
        }
        return { ...prev, foods: prev.foods + 1 };
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
    const nowLabel = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newEntry: StudyEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: nowLabel,
    };
    setStudyEntries((prev) => [newEntry, ...prev]);

    const qText = entry.didQuestions ? ` (${entry.questionsDone} questões)` : '';
    pushActionLog(`📘 ${heroName} registrou Estudo: ${entry.subject} — ${entry.minutes} min${qText}.`);

    const res = calculateStudyReward(
      stats,
      entry.minutes,
      entry.didQuestions,
      entry.questionsDone,
      totalAttributes,
      activeBossAttack
    );
    processDropAndToast(res, `Estudo: ${entry.subject}`);
  };

  const handleDeleteStudy = (id: string) => {
    setStudyEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddWorkout = (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    const nowLabel = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newEntry: WorkoutEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: nowLabel,
    };
    setWorkoutEntries((prev) => [newEntry, ...prev]);

    const label = [entry.cardio ? 'Cárdio' : '', entry.musculacao ? 'Musculação' : '']
      .filter(Boolean)
      .join(' + ');
    pushActionLog(`💪 ${heroName} registrou Treino: ${label}.`);

    const res = calculateWorkoutReward(
      stats,
      entry.cardio,
      entry.musculacao,
      totalAttributes,
      activeBossAttack
    );
    processDropAndToast(res, `Treino: ${label}`);
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkoutEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleCastSkill = (skill: ClassSkill) => {
    const res = applyClassSkill(stats, skill, totalAttributes, activeBossAttack);
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
    pushActionLog(`✨ ${heroName} usou ${skill.name}.`);

    const bossOutcome =
      res.bossDamage > 0
        ? applyBossDamageAndCheckVictory(res.bossDamage, skill.name, res.nextStats)
        : { defeated: false, bossName: '' };

    if (bossOutcome.defeated) {
      const lvlTag = bossOutcome.leveledUp ? ` · 🎉 Nível ${bossOutcome.nextLevel}!` : '';
      showToast(
        `🏆 ${bossOutcome.bossName} derrotado com ${skill.name}! STA/MP 100%! Próximo: ${bossOutcome.nextBossName}${lvlTag}`
      );
    } else if (res.leveledUp) {
      pushActionLog(`🎉 ${heroName} alcançou o Nível ${res.nextStats.level}!`);
      showToast(`🎉 ${skill.name}: Nível ${res.nextStats.level} alcançado!`);
    } else if (skill.kind === 'damage') {
      showToast(
        `✨ ${skill.name}: -${res.bossDamage} Boss HP · -${res.staminaLost} STA${res.gainedGold ? ` · +${res.gainedGold} GP` : ''}!`
      );
    } else if (skill.kind === 'heal') {
      showToast(`💚 ${skill.name}: +${res.healedHp} Estamina restaurada!`);
    } else if (skill.kind === 'xp') {
      showToast(`📘 ${skill.name}: +${res.gainedXp} XP!`);
    } else if (skill.kind === 'gold') {
      showToast(`🪙 ${skill.name}: +${res.gainedGold} GP!`);
    } else if (skill.kind === 'buff') {
      showToast(`🛡️ ${skill.name} ativado até derrotar o Boss atual!`);
    }
  };

  const handleChangeClass = (nextClass: CombatHeroClass) => {
    if (stats.level < CLASS_UNLOCK_LEVEL) {
      showToast(`🔒 Alcance o Nível ${CLASS_UNLOCK_LEVEL} para escolher sua Classe!`);
      return;
    }
    setStats((s) => ({ ...s, heroClass: nextClass }));
    pushActionLog(`🎭 ${heroName} escolheu a classe ${CLASS_INFO[nextClass].label}!`);
    showToast(`🎭 Classe definida: ${CLASS_INFO[nextClass].label}!`);
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

  const handleBuyItem = (item: EquipmentItem) => {
    if (stats.gold < item.price || inventory.includes(item.id)) return;
    const removedOther =
      (item.slot === 'weapon' && item.twoHanded && Boolean(equipped.shield)) ||
      (item.slot === 'shield' && Boolean(getEquipmentById(equipped.weapon)?.twoHanded));

    setStats((s) => ({ ...s, gold: s.gold - item.price }));
    setInventory((prev) => [...prev, item.id]);
    setEquipped((prev) => applyGearItem(prev, item));
    pushActionLog(`🛡️ ${heroName} comprou e equipou ${item.name} (-${item.price} GP).`);
    showToast(
      removedOther
        ? `🛡️ ${item.name} equipado! (Item conflitante de 2 mãos removido)`
        : `🛡️ Comprou e equipou: ${item.name}!`
    );
  };

  const handleToggleEquip = (item: EquipmentItem) => {
    if (equipped[item.slot] !== item.id) {
      if (item.slot === 'weapon' && item.twoHanded && equipped.shield) {
        showToast(`⚔️ ${item.name} (2 mãos) equipado — escudo removido.`);
      } else if (item.slot === 'shield' && getEquipmentById(equipped.weapon)?.twoHanded) {
        showToast(`🛡️ ${item.name} equipado — arma de 2 mãos removida.`);
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
      pets: { ...prev.pets, [petId]: 10 },
      equippedPet: petId,
    }));
    pushActionLog(`🐣 ${heroName} chocou um mascote aleatório: ${formatPetName(petId)}!`);
    showToast(`🐣 Nasceu um novo mascote: ${formatPetName(petId)}!`);
  };

  const handleFeedPet = (petId: string) => {
    if (stable.foods <= 0) return;
    const currentAffinity = stable.pets[petId] ?? 0;
    const nextAffinity = Math.min(100, currentAffinity + 20);
    const unlockedMount =
      nextAffinity >= 100 && hasMountForPet(petId) && !(stable.mounts ?? {})[petId];

    setStable((prev) => ({
      ...prev,
      foods: prev.foods - 1,
      pets: { ...prev.pets, [petId]: nextAffinity },
      mounts: unlockedMount ? { ...(prev.mounts ?? {}), [petId]: true } : prev.mounts,
      equippedMount: unlockedMount ? petId : prev.equippedMount,
    }));

    if (unlockedMount) {
      pushActionLog(`🐎 O mascote ${formatPetName(petId)} de ${heroName} evoluiu para Montaria!`);
      showToast(`🐎 ${formatPetName(petId)} atingiu 100/100 e evoluiu para Montaria!`);
    } else {
      showToast('🍖 Mascote alimentado (+20 amizade)!');
    }
  };

  const handleTogglePet = (petId: string) => {
    setStable((prev) => ({
      ...prev,
      equippedPet: prev.equippedPet === petId ? undefined : petId,
    }));
  };

  const handleToggleMount = (mountId: string) => {
    setStable((prev) => ({
      ...prev,
      equippedMount: prev.equippedMount === mountId ? undefined : mountId,
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
    setStats((s) => ({
      ...s,
      level: 1,
      hp: 50,
      max_hp: 50,
      mp: 30,
      max_mp: 32,
      xp: 0,
      xp_to_next: 100,
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

  const handleBuyFoodPack = () => {
    if (stats.gold < 15) return;
    setStats((s) => ({ ...s, gold: s.gold - 15 }));
    setStable((prev) => ({
      ...prev,
      foods: prev.foods + 1,
    }));
    pushActionLog(`🍖 ${heroName} comprou Ração de Pet (-15 GP).`);
    showToast('🍖 Comprou +1 Ração de Pet!');
  };

  const handleBuyHatchPotion = () => {
    if (stats.gold < 25) return;
    setStats((s) => ({ ...s, gold: s.gold - 25 }));
    setStable((prev) => ({
      ...prev,
      potions: prev.potions + 1,
    }));
    pushActionLog(`🧪 ${heroName} comprou Poção de Chocar (-25 GP).`);
    showToast('🧪 Comprou +1 Poção de Chocar!');
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
    setHeroName(p.username);
    setStats({
      level: p.level ?? 1,
      hp: p.hp ?? 50,
      max_hp: p.max_hp ?? 50,
      mp: p.mp ?? 30,
      max_mp: p.max_mp ?? 32,
      xp: p.xp ?? 0,
      xp_to_next: p.xp_to_next ?? 100,
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
    setMetrics(p.metrics ?? DEFAULT_METRICS);
    if (Array.isArray(p.study_entries)) setStudyEntries(p.study_entries);
    if (Array.isArray(p.workout_entries)) setWorkoutEntries(p.workout_entries);
    setRemoteParty(bundle.party);
    setRemoteMembers(bundle.members);
    if (bundle.messages.length > 0) {
      setMessages(
        bundle.messages.map((m) => ({
          id: m.id,
          author: m.username,
          kind: m.kind,
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))
      );
    }
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
            username: string;
            kind: 'chat' | 'system';
            content: string;
            created_at: string;
          };
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

  const handleBuyArmoire = () => {
    if (stats.gold < 40) return;
    const reward = rollArmoireReward(inventory);
    const armoireRes = grantXpAndResources(stats, totalAttributes, {
      xp: reward.kind === 'xp' ? reward.amount : 0,
      goldDelta: -40,
    });
    setStats(armoireRes.nextStats);
    setMetrics((m) => ({ ...m, armoireOpened: m.armoireOpened + 1 }));
    if (reward.kind === 'equipment') {
      setInventory((prev) => (prev.includes(reward.item.id) ? prev : [...prev, reward.item.id]));
    } else if (reward.kind === 'food') {
      setStable((prev) => ({ ...prev, foods: prev.foods + reward.amount }));
    } else if (reward.kind === 'egg') {
      setStable((prev) => ({ ...prev, eggs: prev.eggs + 1 }));
    } else if (reward.kind === 'potion') {
      setStable((prev) => ({ ...prev, potions: prev.potions + 1 }));
    }
    pushActionLog(`🎁 ${heroName} abriu o Armoire Encantado e ganhou: ${reward.label}!`);
    if (armoireRes.leveledUp) {
      pushActionLog(`🎉 ${heroName} alcançou o Nível ${armoireRes.nextStats.level}!`);
      showToast(`🎁 Armoire: ${reward.label} · 🎉 Nível ${armoireRes.nextStats.level}!`);
    } else {
      showToast(`🎁 Armoire Encantado: ${reward.label}!`);
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

  const showRegistroSection = activeSection === 'registro';
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
        mountId={stable.equippedMount}
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
        supabaseReady={supabaseReady}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (sec === 'ktz') setMobileTab('ktz');
          else if (sec === 'inventario') setMobileTab('inventario');
          else if (sec === 'loja') setMobileTab('loja');
          else if (mobileTab !== 'study' && mobileTab !== 'workout') setMobileTab('study');
        }}
        onSelectInvTab={setInvTab}
        onSelectShopFilter={setShopFilter}
        onOpenStats={() => setStatsOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Gaveta de Classes e Habilidades (Estilo Habitica Skills Drawer) */}
      {showRegistroSection && (
        <SkillsBar
          heroClass={stats.heroClass}
          level={stats.level}
          mp={stats.mp}
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

      {/* Aba 1: REGISTRO (Colunas de Estudo Teórico + Treinamento Físico Diário) */}
      {showRegistroSection && (
        <main className="max-w-7xl w-full mx-auto px-4 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        appearance={appearance}
        equipped={equipped}
        costume={costume}
        useCostume={useCostume}
        inventory={inventory}
        stable={stable}
        totalAttributes={totalAttributes}
        onChangeAppearance={setAppearance}
        onBuyItem={handleBuyItem}
        onBuyPotion={handleBuyPotion}
        onBuyArmoire={handleBuyArmoire}
        onBuyFoodPack={handleBuyFoodPack}
        onBuyHatchPotion={handleBuyHatchPotion}
        onSellEgg={handleSellEgg}
        onSellPotion={handleSellPotion}
        onToggleEquip={handleToggleEquip}
        onToggleCostumeEquip={handleToggleCostumeEquip}
        onToggleUseCostume={() => setUseCostume((v) => !v)}
        onHatchEgg={handleHatchEgg}
        onFeedPet={handleFeedPet}
        onTogglePet={handleTogglePet}
        onToggleMount={handleToggleMount}
      />

      {/* Aba 4: KTZ - KNOW THE ZERO (2 Colunas Estilo Guild/Party do Habitica) */}
      <PartyPanel
        visible={showKtzSection}
        isOnline={Boolean(userId)}
        heroName={heroName}
        heroStats={stats}
        heroAppearance={appearance}
        heroEquipped={equipped}
        heroCostume={costume}
        heroUseCostume={useCostume}
        heroPetId={stable.equippedPet}
        heroMountId={stable.equippedMount}
        remoteParty={remoteParty}
        remoteMembers={remoteMembers}
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
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Modais: Perfil/Atributos/Conquistas e Conta */}
      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        level={stats.level}
        rebirths={stats.rebirths ?? 0}
        unallocatedPoints={unallocatedPoints}
        petsCount={Object.keys(stable.pets).length}
        attributes={totalAttributes}
        metrics={metrics}
        onAllocateStat={handleAllocateStat}
        onRebirth={handleRebirth}
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

      {/* Barra de Navegação Inferior no Mobile (5 Abas Estilo Habitica Mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[#36205d] border-t border-[#4f2a93] grid grid-cols-5">
        {[
          { id: 'study', label: 'Estudo', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'workout', label: 'Treino', icon: <Dumbbell className="w-4 h-4" /> },
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
              else if (id === 'inventario') setActiveSection('inventario');
              else if (id === 'loja') setActiveSection('loja');
              else setActiveSection('registro');
            }}
            className={`flex flex-col items-center justify-center py-2 text-[10px] font-condensed gap-0.5 ${
              mobileTab === tab.id ? 'text-[#ffbe5d] font-bold bg-[#271b3d]/50' : 'text-[#d6c7ff]/80'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
