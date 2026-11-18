import petsCatalogRaw from './pets-catalog.json';
import localSpritesRaw from '../../../scripts/sprites-manifest.json';

export type PetCategory = 'drop' | 'quest' | 'premium' | 'wacky' | 'special';

export interface PetCatalogEntry {
  id: string;
  name: string;
  category: PetCategory;
  species: string;
  potion: string;
}

export interface StableState {
  eggs: number;
  potions: number;
  /** Mascotes desbloqueados pelo jogador (chave: petId) */
  pets: Record<string, number | boolean>;
  equippedPet?: string;
}

const LOCAL_SPRITES = new Set<string>(localSpritesRaw as string[]);
const HABITICA_CDN = 'https://habitica-assets.s3.amazonaws.com/mobileApp/images';

export const PET_CATALOG: PetCatalogEntry[] = petsCatalogRaw as PetCatalogEntry[];

const PET_BY_ID = new Map<string, PetCatalogEntry>(
  PET_CATALOG.map((p) => [p.id, p])
);

export const ALL_PET_IDS: string[] = PET_CATALOG.map((p) => p.id);

export const DEFAULT_STABLE: StableState = {
  eggs: 0,
  potions: 0,
  pets: {},
  equippedPet: undefined,
};

/**
 * Normaliza saves antigos (incluindo saves com `foods`, `mounts` ou `equippedMount`)
 * para a estrutura atual sem montarias ou rações.
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
    pets:
      obj.pets && typeof obj.pets === 'object'
        ? (obj.pets as Record<string, number | boolean>)
        : DEFAULT_STABLE.pets,
    equippedPet: typeof obj.equippedPet === 'string' ? obj.equippedPet : undefined,
  };
}

export function getPetById(petId?: string): PetCatalogEntry | undefined {
  if (!petId) return undefined;
  return PET_BY_ID.get(petId);
}

const SPECIAL_PET_FILENAMES: Record<string, string> = {
  'Gryphon-Gryphatrice': 'BackerOnly-Pet-Gryphatrice.gif',
  'Gryphatrice-Jubilant': 'Pet-Gryphatrice-Jubilant.gif',
};

export function getPetSpritePath(petId: string): string {
  const fileName = SPECIAL_PET_FILENAMES[petId] ?? `Pet-${petId}.png`;
  return LOCAL_SPRITES.has(fileName)
    ? `/sprites/${fileName}`
    : `${HABITICA_CDN}/${fileName}`;
}

export function formatPetName(petId: string): string {
  return PET_BY_ID.get(petId)?.name ?? petId;
}

/**
 * Sorteia aleatoriamente um dentre os 1.248 mascotes que o jogador ainda não possui.
 */
export function pickRandomUnownedPet(
  ownedPets: Record<string, number | boolean>
): string | null {
  const unowned = ALL_PET_IDS.filter((id) => ownedPets[id] === undefined);
  if (unowned.length === 0) return null;
  return unowned[Math.floor(Math.random() * unowned.length)];
}

/**
 * Chance de 22% de dropar um Ovo ou Poção de Chocar ao registrar estudo/treino.
 */
export function rollTaskDrop():
  | { kind: 'egg'; label: string }
  | { kind: 'potion'; label: string }
  | null {
  if (Math.random() > 0.22) return null;

  return Math.random() < 0.5
    ? { kind: 'egg', label: 'Ovo' }
    : { kind: 'potion', label: 'Poção de Chocar' };
}
