import { EQUIPMENT_CATALOG, EquipmentItem, getItemRarity } from './items';

export const ROULETTE_UNLOCK_ISO = '2026-11-27T00:00:00-03:00';
export const ROULETTE_UNLOCK_MS = Date.parse(ROULETTE_UNLOCK_ISO);

export type RoulettePrizeId =
  | 'gold_small'
  | 'frag_small'
  | 'stable_pack'
  | 'gold_big'
  | 'frag_big'
  | 'gear_rare'
  | 'gear_epic'
  | 'gear_legendary';

export interface RoulettePrizeMeta {
  id: RoulettePrizeId;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  count: number; // Quantidade exata de casas dentre 100 (count === % base)
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const ROULETTE_PRIZES: RoulettePrizeMeta[] = [
  {
    id: 'gold_small',
    label: 'Bolsa de Ouro',
    shortLabel: '+35 GP',
    emoji: '🪙',
    description: '+35 Moedas de Ouro',
    count: 23,
    tier: 'common',
    bgClass: 'bg-[#2a2533]',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-300',
  },
  {
    id: 'frag_small',
    label: 'Estilhaços de Forja',
    shortLabel: '+15 Frag.',
    emoji: '💎',
    description: '+15 Fragmentos de Essência',
    count: 23,
    tier: 'common',
    bgClass: 'bg-[#232638]',
    borderClass: 'border-cyan-500/40',
    textClass: 'text-cyan-300',
  },
  {
    id: 'stable_pack',
    label: 'Pacote do Estábulo',
    shortLabel: '1 Ovo+Poção',
    emoji: '🥚',
    description: '1x Ovo + 1x Poção de Chocar',
    count: 19,
    tier: 'uncommon',
    bgClass: 'bg-[#1c2f2a]',
    borderClass: 'border-emerald-400/60',
    textClass: 'text-emerald-300',
  },
  {
    id: 'gold_big',
    label: 'Baú de Ouro',
    shortLabel: '+75 GP',
    emoji: '💰',
    description: '+75 Moedas de Ouro',
    count: 12,
    tier: 'uncommon',
    bgClass: 'bg-[#332919]',
    borderClass: 'border-amber-400/70',
    textClass: 'text-amber-200',
  },
  {
    id: 'frag_big',
    label: 'Cristal de Forja',
    shortLabel: '+40 Frag.',
    emoji: '🔮',
    description: '+40 Fragmentos de Essência',
    count: 10,
    tier: 'rare',
    bgClass: 'bg-[#1d2e44]',
    borderClass: 'border-sky-400/70',
    textClass: 'text-sky-300',
  },
  {
    id: 'gear_rare',
    label: 'Equipamento Raro',
    shortLabel: 'Item Raro',
    emoji: '🔵',
    description: 'Equipamento Raro inédito (ou +60 Frag.)',
    count: 9,
    tier: 'rare',
    bgClass: 'bg-[#17304d]',
    borderClass: 'border-sky-400',
    textClass: 'text-sky-200',
  },
  {
    id: 'gear_epic',
    label: 'Jackpot Épico',
    shortLabel: 'ÉPICO',
    emoji: '🟣',
    description: 'Equipamento Épico inédito (ou +110 Frag.)',
    count: 3,
    tier: 'epic',
    bgClass: 'bg-[#361d52]',
    borderClass: 'border-purple-400',
    textClass: 'text-purple-200',
  },
  {
    id: 'gear_legendary',
    label: 'JACKPOT LENDÁRIO',
    shortLabel: 'LENDÁRIO',
    emoji: '🌟',
    description: 'Equipamento Lendário inédito (ou +200 Frag.)',
    count: 1,
    tier: 'legendary',
    bgClass: 'bg-[#453112]',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-200',
  },
];

const PRIZE_BY_ID = new Map<RoulettePrizeId, RoulettePrizeMeta>(
  ROULETTE_PRIZES.map((p) => [p.id, p])
);

export function getRoulettePrizeMeta(id: RoulettePrizeId): RoulettePrizeMeta {
  return PRIZE_BY_ID.get(id)!;
}

/**
 * Vetor determinístico de exatamente 100 casas (índices 0..99), onde cada prêmio
 * aparece na quantidade exata de sua porcentagem base e fica bem espaçado na esteira.
 */
function buildRouletteSlots100(): RoulettePrizeId[] {
  const slots: (RoulettePrizeId | null)[] = Array(100).fill(null);

  // Coloca a única casa Lendária exatamente no meio (índice 50) e as 3 Épicas bem espaçadas
  slots[50] = 'gear_legendary';
  slots[16] = 'gear_epic';
  slots[49] = 'gear_epic'; // vizinha emocionante antes do Lendário!
  slots[83] = 'gear_epic';

  const remainingPrizes: RoulettePrizeId[] = [
    'gear_rare',
    'frag_big',
    'gold_big',
    'stable_pack',
    'frag_small',
    'gold_small',
  ];

  for (const id of remainingPrizes) {
    const count = getRoulettePrizeMeta(id).count;
    const emptyIndices: number[] = [];
    for (let i = 0; i < 100; i++) {
      if (slots[i] === null) emptyIndices.push(i);
    }
    const step = emptyIndices.length / count;
    for (let k = 0; k < count; k++) {
      const pickPos = Math.min(emptyIndices.length - 1, Math.floor((k + 0.5) * step));
      slots[emptyIndices[pickPos]] = id;
    }
  }

  return slots.map((s) => s ?? 'gold_small');
}

export const ROULETTE_SLOTS_100: RoulettePrizeId[] = buildRouletteSlots100();

export interface RouletteState {
  energy: number;
  tokens: number;
  pityCounter: number;
  totalSpins: number;
  lastPrizeLabel?: string;
}

export const DEFAULT_ROULETTE_STATE: RouletteState = {
  energy: 0,
  tokens: 0,
  pityCounter: 0,
  totalSpins: 0,
};

export function isRouletteUnlocked(now: Date = new Date()): boolean {
  return now.getTime() >= ROULETTE_UNLOCK_MS;
}

export function computeStudyRouletteEnergy(
  minutes: number,
  didQuestions: boolean,
  questionsDone: number,
  didEssay: boolean,
  essaysDone: number
): number {
  const m = Math.max(0, minutes || 0) * 0.5;
  const q = didQuestions ? Math.max(0, questionsDone || 0) * 1.2 : 0;
  const e = didEssay ? Math.max(0, essaysDone || 0) * 30 : 0;
  return Math.round((m + q + e) * 10) / 10;
}

export function computeWorkoutRouletteEnergy(
  cardio: boolean,
  kmEq: number,
  musculacao: boolean
): number {
  const musc = musculacao ? 35 : 0;
  const card = cardio ? Math.min(15, Math.max(0, Number(kmEq) || 0)) * 15 : 0;
  return Math.round((musc + card) * 10) / 10;
}

export function addRouletteEnergy(
  state: RouletteState = DEFAULT_ROULETTE_STATE,
  deltaEnergy: number,
  now: Date = new Date()
): { nextState: RouletteState; tokensEarned: number } {
  if (!isRouletteUnlocked(now) || deltaEnergy <= 0) {
    return { nextState: state, tokensEarned: 0 };
  }
  const total = state.energy + deltaEnergy;
  const tokensEarned = Math.floor(total / 100);
  const nextEnergy = Math.round((total % 100) * 10) / 10;
  return {
    tokensEarned,
    nextState: {
      ...state,
      energy: nextEnergy,
      tokens: state.tokens + tokensEarned,
    },
  };
}

export interface RouletteSpinReward {
  gold: number;
  fragments: number;
  eggs: number;
  potions: number;
  item?: EquipmentItem;
  fallbackFragments: number;
}

export interface RouletteSpinResult {
  ok: boolean;
  reason?: 'locked' | 'no_tokens';
  slotIndex: number;
  prize: RoulettePrizeMeta;
  reward: RouletteSpinReward;
  nextState: RouletteState;
  hitPity: boolean;
}

function pickRandomSlotIndexForPrize(prizeId: RoulettePrizeId): number {
  const indices: number[] = [];
  for (let i = 0; i < ROULETTE_SLOTS_100.length; i++) {
    if (ROULETTE_SLOTS_100[i] === prizeId) indices.push(i);
  }
  return indices[Math.floor(Math.random() * indices.length)] ?? 0;
}

function pickUnownedGearByRarity(
  inventory: string[],
  rarity: 'rare' | 'epic' | 'legendary'
): EquipmentItem | undefined {
  const owned = new Set(inventory);
  const candidates = EQUIPMENT_CATALOG.filter(
    (item) => getItemRarity(item) === rarity && !owned.has(item.id)
  );
  if (candidates.length === 0) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function spinRoulette(
  state: RouletteState = DEFAULT_ROULETTE_STATE,
  inventory: string[],
  now: Date = new Date()
): RouletteSpinResult {
  if (!isRouletteUnlocked(now)) {
    return {
      ok: false,
      reason: 'locked',
      slotIndex: 0,
      prize: getRoulettePrizeMeta('gold_small'),
      reward: { gold: 0, fragments: 0, eggs: 0, potions: 0, fallbackFragments: 0 },
      nextState: state,
      hitPity: false,
    };
  }
  if (state.tokens < 1) {
    return {
      ok: false,
      reason: 'no_tokens',
      slotIndex: 0,
      prize: getRoulettePrizeMeta('gold_small'),
      reward: { gold: 0, fragments: 0, eggs: 0, potions: 0, fallbackFragments: 0 },
      nextState: state,
      hitPity: false,
    };
  }

  let slotIndex = Math.floor(Math.random() * 100);
  let hitPity = false;

  if (state.pityCounter >= 9) {
    // 10º giro: Jackpot Épico (75%) ou Lendário (25%) garantido
    const jackpotId: RoulettePrizeId = Math.random() < 0.25 ? 'gear_legendary' : 'gear_epic';
    slotIndex = pickRandomSlotIndexForPrize(jackpotId);
    hitPity = true;
  } else if (state.pityCounter >= 5) {
    // Giros 6..9: +3%..+12% de chance bônus de Jackpot
    const bonusChance = (state.pityCounter - 4) * 0.03;
    if (Math.random() < bonusChance) {
      const jackpotId: RoulettePrizeId = Math.random() < 0.25 ? 'gear_legendary' : 'gear_epic';
      slotIndex = pickRandomSlotIndexForPrize(jackpotId);
      hitPity = true;
    }
  }

  const prizeId = ROULETTE_SLOTS_100[slotIndex];
  const prize = getRoulettePrizeMeta(prizeId);
  const reward: RouletteSpinReward = {
    gold: 0,
    fragments: 0,
    eggs: 0,
    potions: 0,
    fallbackFragments: 0,
  };

  let prizeSummary = `${prize.emoji} ${prize.label}`;

  switch (prizeId) {
    case 'gold_small':
      reward.gold = 35;
      prizeSummary = '🪙 +35 GP';
      break;
    case 'frag_small':
      reward.fragments = 15;
      prizeSummary = '💎 +15 Fragmentos';
      break;
    case 'stable_pack':
      reward.eggs = 1;
      reward.potions = 1;
      prizeSummary = '🥚 1x Ovo + 1x Poção';
      break;
    case 'gold_big':
      reward.gold = 75;
      prizeSummary = '💰 +75 GP';
      break;
    case 'frag_big':
      reward.fragments = 40;
      prizeSummary = '🔮 +40 Fragmentos';
      break;
    case 'gear_rare': {
      const item = pickUnownedGearByRarity(inventory, 'rare');
      if (item) {
        reward.item = item;
        prizeSummary = `🔵 ${item.name} (Raro)`;
      } else {
        reward.fallbackFragments = 60;
        reward.fragments = 60;
        prizeSummary = '🔵 Coleção Rara completa → +60 Fragmentos';
      }
      break;
    }
    case 'gear_epic': {
      const item = pickUnownedGearByRarity(inventory, 'epic');
      if (item) {
        reward.item = item;
        prizeSummary = `🟣 ${item.name} (Épico)`;
      } else {
        reward.fallbackFragments = 110;
        reward.fragments = 110;
        prizeSummary = '🟣 Coleção Épica completa → +110 Fragmentos';
      }
      break;
    }
    case 'gear_legendary': {
      const item = pickUnownedGearByRarity(inventory, 'legendary');
      if (item) {
        reward.item = item;
        prizeSummary = `🌟 ${item.name} (Lendário)`;
      } else {
        reward.fallbackFragments = 200;
        reward.fragments = 200;
        prizeSummary = '🌟 Coleção Lendária completa → +200 Fragmentos';
      }
      break;
    }
  }

  const isJackpot = prizeId === 'gear_epic' || prizeId === 'gear_legendary';
  const nextState: RouletteState = {
    ...state,
    tokens: state.tokens - 1,
    pityCounter: isJackpot ? 0 : state.pityCounter + 1,
    totalSpins: state.totalSpins + 1,
    lastPrizeLabel: prizeSummary,
  };

  return {
    ok: true,
    slotIndex,
    prize,
    reward,
    nextState,
    hitPity,
  };
}
