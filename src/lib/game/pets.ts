export type PetSpecies =
  | 'Wolf'
  | 'Dragon'
  | 'Fox'
  | 'BearCub'
  | 'LionCub'
  | 'PandaCub'
  | 'TigerCub'
  | 'Cactus'
  | 'FlyingPig'
  | 'Owl'
  | 'Penguin'
  | 'Unicorn'
  | 'Gryphon'
  | 'TRex'
  | 'Cat'
  | 'Dog'
  | 'Sloth'
  | 'Axolotl'
  | 'Octopus'
  | 'Robot';

export type PotionColor =
  | 'Base'
  | 'Golden'
  | 'Desert'
  | 'Skeleton'
  | 'Zombie'
  | 'CottonCandyPink'
  | 'CottonCandyBlue'
  | 'Rainbow'
  | 'StarryNight'
  | 'Ember'
  | 'Aquatic'
  | 'Ghost';

export interface StableState {
  eggs: number;
  potions: number;
  foods: number;
  /** Chave: `${species}-${potion}` ou especial, valor: amizade 0..100 */
  pets: Record<string, number>;
  equippedPet?: string;
  /** Montarias desbloqueadas ao atingir 100 de amizade */
  mounts?: Record<string, boolean>;
  equippedMount?: string;
}

export const PET_SPECIES: { id: PetSpecies; label: string }[] = [
  { id: 'Wolf', label: 'Lobo' },
  { id: 'Dragon', label: 'Dragão' },
  { id: 'Fox', label: 'Raposa' },
  { id: 'BearCub', label: 'Urso' },
  { id: 'LionCub', label: 'Leão' },
  { id: 'PandaCub', label: 'Panda' },
  { id: 'TigerCub', label: 'Tigre' },
  { id: 'Cactus', label: 'Cacto' },
  { id: 'FlyingPig', label: 'Porco Voador' },
  { id: 'Owl', label: 'Coruja' },
  { id: 'Penguin', label: 'Pinguim' },
  { id: 'Unicorn', label: 'Unicórnio' },
  { id: 'Gryphon', label: 'Grifo' },
  { id: 'TRex', label: 'T-Rex' },
  { id: 'Cat', label: 'Gato' },
  { id: 'Dog', label: 'Cachorro' },
  { id: 'Sloth', label: 'Preguiça' },
  { id: 'Axolotl', label: 'Axolote' },
  { id: 'Octopus', label: 'Polvo' },
  { id: 'Robot', label: 'Robô' },
];

export const POTION_LIST: { id: PotionColor; label: string }[] = [
  { id: 'Base', label: 'Padrão' },
  { id: 'Golden', label: 'Dourada' },
  { id: 'Desert', label: 'Deserto' },
  { id: 'Skeleton', label: 'Esqueleto' },
  { id: 'Zombie', label: 'Zumbi' },
  { id: 'CottonCandyPink', label: 'Algodão Rosa' },
  { id: 'CottonCandyBlue', label: 'Algodão Azul' },
  { id: 'Rainbow', label: 'Arco-Íris' },
  { id: 'StarryNight', label: 'Noite Estrelada' },
  { id: 'Ember', label: 'Brasa' },
  { id: 'Aquatic', label: 'Aquática' },
  { id: 'Ghost', label: 'Fantasma' },
];

const SPECIAL_PETS: { id: string; label: string; hasMount: boolean }[] = [
  { id: 'Phoenix-Base', label: 'Fênix (Especial)', hasMount: true },
  { id: 'Wolf-Cerberus', label: 'Cérbero (Especial)', hasMount: false },
  { id: 'Dragon-Hydra', label: 'Hidra (Especial)', hasMount: true },
  { id: 'Orca-Base', label: 'Orca (Especial)', hasMount: true },
  { id: 'Mammoth-Base', label: 'Mamute (Especial)', hasMount: true },
];

const PETS_WITHOUT_MOUNTS = new Set(
  SPECIAL_PETS.filter((p) => !p.hasMount).map((p) => p.id)
);

// Todos os 190 pets verificados localmente em /public/sprites/
// (Dragon, Wolf, Fox, BearCub, LionCub, PandaCub, TigerCub, Cactus, FlyingPig têm todas as 12 cores;
// Quest species têm as 9 cores padrão + Rainbow/StarryNight/Ember/Aquatic/Ghost conforme disponibilidade)
const QUEST_SPECIES_SET = new Set<PetSpecies>([
  'Owl',
  'Penguin',
  'Unicorn',
  'Gryphon',
  'TRex',
  'Cat',
  'Dog',
  'Sloth',
  'Axolotl',
  'Octopus',
  'Robot',
]);

const QUEST_POTIONS: PotionColor[] = ['Base', 'Golden', 'Desert', 'Skeleton', 'Zombie', 'CottonCandyPink', 'CottonCandyBlue'];

export const ALL_PET_IDS: string[] = [
  ...PET_SPECIES.flatMap((sp) => {
    const pots = QUEST_SPECIES_SET.has(sp.id) ? QUEST_POTIONS : POTION_LIST.map((p) => p.id);
    return pots.map((pot) => `${sp.id}-${pot}`);
  }),
  ...SPECIAL_PETS.map((p) => p.id),
];

export function hasMountForPet(petId: string): boolean {
  return !PETS_WITHOUT_MOUNTS.has(petId);
}

export const DEFAULT_STABLE: StableState = {
  eggs: 0,
  potions: 0,
  foods: 0,
  pets: {},
  equippedPet: undefined,
  mounts: {},
  equippedMount: undefined,
};

/**
 * Converte saves antigos (com mapas por espécie/cor) para os contadores únicos.
 */
export function normalizeStableState(raw: unknown): StableState {
  if (!raw || typeof raw !== 'object') return DEFAULT_STABLE;
  const obj = raw as Record<string, unknown>;

  const sumCount = (val: unknown, fallback: number): number => {
    if (typeof val === 'number') return Math.max(0, val);
    if (val && typeof val === 'object') {
      return Object.values(val as Record<string, number>).reduce(
        (acc, n) => acc + (typeof n === 'number' ? n : 0),
        0
      );
    }
    return fallback;
  };

  return {
    eggs: sumCount(obj.eggs, DEFAULT_STABLE.eggs),
    potions: sumCount(obj.potions, DEFAULT_STABLE.potions),
    foods: sumCount(obj.foods, DEFAULT_STABLE.foods),
    pets:
      obj.pets && typeof obj.pets === 'object'
        ? (obj.pets as Record<string, number>)
        : DEFAULT_STABLE.pets,
    equippedPet: typeof obj.equippedPet === 'string' ? obj.equippedPet : undefined,
    mounts:
      obj.mounts && typeof obj.mounts === 'object'
        ? (obj.mounts as Record<string, boolean>)
        : {},
    equippedMount: typeof obj.equippedMount === 'string' ? obj.equippedMount : undefined,
  };
}

export function getPetSpritePath(petId: string): string {
  return `/sprites/Pet-${petId}.png`;
}

export function getMountBodySpritePath(mountId: string): string {
  return `/sprites/Mount_Body_${mountId}.png`;
}

export function getMountHeadSpritePath(mountId: string): string {
  return `/sprites/Mount_Head_${mountId}.png`;
}

export function formatPetName(petId: string): string {
  const special = SPECIAL_PETS.find((p) => p.id === petId);
  if (special) return special.label;
  const [sp, pot] = petId.split('-') as [PetSpecies, PotionColor];
  const spLabel = PET_SPECIES.find((p) => p.id === sp)?.label ?? sp;
  const potLabel = POTION_LIST.find((p) => p.id === pot)?.label ?? pot;
  return `${spLabel} (${potLabel})`;
}

/**
 * Sorteia aleatoriamente um mascote que o jogador ainda não possui.
 */
export function pickRandomUnownedPet(ownedPets: Record<string, number>): string | null {
  const unowned = ALL_PET_IDS.filter((id) => ownedPets[id] === undefined);
  if (unowned.length === 0) return null;
  return unowned[Math.floor(Math.random() * unowned.length)];
}

/**
 * Chance de 22% de dropar um Ovo, Poção de Chocar ou Ração de Pet ao registrar estudo/treino.
 */
export function rollTaskDrop():
  | { kind: 'egg'; label: string }
  | { kind: 'potion'; label: string }
  | { kind: 'food'; label: string }
  | null {
  if (Math.random() > 0.22) return null;

  const roll = Math.random();
  if (roll < 0.4) {
    return { kind: 'egg', label: 'Ovo' };
  }
  if (roll < 0.7) {
    return { kind: 'potion', label: 'Poção de Chocar' };
  }
  return { kind: 'food', label: 'Ração de Pet' };
}
