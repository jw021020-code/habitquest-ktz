import gearCatalogRaw from './gear-catalog.json';
import appearancesCatalogRaw from './appearances-catalog.json';
import localSpritesRaw from '../../../scripts/sprites-manifest.json';

export type EquipmentSlot =
  | 'weapon'
  | 'shield'
  | 'armor'
  | 'head'
  | 'headAccessory'
  | 'eyewear'
  | 'body'
  | 'back';

export type BodySize = 'broad' | 'slim';
export type CombatHeroClass = 'warrior' | 'wizard' | 'rogue' | 'healer';
export type PlayableHeroClass = 'apprentice' | CombatHeroClass;
export type HeroClass = PlayableHeroClass | 'cosmetic';
export type GearCategory = 'class' | 'seasonal' | 'armoire' | 'mystery' | 'special';
export type GearSeason = 'winter' | 'spring' | 'summer' | 'fall';

export type HairColor = string;
export type ShirtColor = string;
export type SkinGroup =
  | 'padrao'
  | 'arcoiris'
  | 'pastel'
  | 'animais'
  | 'sobrenatural'
  | 'aquatica'
  | 'inverno';

export interface Attributes {
  str: number;
  int: number;
  con: number;
  per: number;
}

export interface CharacterAppearance {
  skin: string;
  bodySize: BodySize;
  shirt: ShirtColor;
  hairStyle: number; // 0..20 (0 = sem base/careca)
  hairBangs: number; // 0..4 (0 = sem franja)
  hairColor: HairColor;
  hairFlower?: number; // 0..16 (flores de cabelo e brincos)
  hairBeard?: number; // 0..3
  hairMustache?: number; // 0..2
  background?: string; // 'none' ou ID do background oficial
}

export type EquippedGear = Partial<Record<EquipmentSlot, string>>;

export interface EquipmentItem {
  id: string;
  name: string;
  notes?: string;
  slot: EquipmentSlot;
  heroClass: HeroClass;
  category: GearCategory;
  season?: GearSeason;
  twoHanded?: boolean;
  price: number;
  stats: Attributes;
}

interface AppearancesCatalogData {
  backgrounds: { id: string; label: string; notes?: string }[];
  skins: { id: string; label: string; group: SkinGroup; hex: string }[];
  shirts: { id: string; label: string }[];
  hairBases: { id: number; label: string }[];
  hairBangs: { id: number; label: string }[];
  hairColors: { id: string; label: string; hex: string }[];
  hairFlowers: { id: number; label: string }[];
}

const APPEARANCES_CATALOG = appearancesCatalogRaw as AppearancesCatalogData;

export const SKIN_OPTIONS = APPEARANCES_CATALOG.skins;
export const SHIRT_OPTIONS = APPEARANCES_CATALOG.shirts;
export const HAIR_BASE_OPTIONS = APPEARANCES_CATALOG.hairBases;
export const HAIR_BANGS_OPTIONS = APPEARANCES_CATALOG.hairBangs;
export const HAIR_COLORS = APPEARANCES_CATALOG.hairColors;
export const HAIR_FLOWER_OPTIONS = APPEARANCES_CATALOG.hairFlowers;
export const BACKGROUND_OPTIONS = APPEARANCES_CATALOG.backgrounds;

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  skin: 'f5a76e',
  bodySize: 'broad',
  shirt: 'blue',
  hairStyle: 1,
  hairBangs: 1,
  hairColor: 'brown',
  hairFlower: 0,
  hairBeard: 0,
  hairMustache: 0,
  background: 'none',
};

export const DEFAULT_EQUIPPED: EquippedGear = {};

export const DEFAULT_INVENTORY: string[] = [];

export const EQUIPMENT_CATALOG: EquipmentItem[] = gearCatalogRaw as EquipmentItem[];

const EQUIPMENT_BY_ID = new Map<string, EquipmentItem>(
  EQUIPMENT_CATALOG.map((item) => [item.id, item])
);

const LOCAL_SPRITES = new Set<string>(localSpritesRaw as string[]);
const HABITICA_CDN = 'https://habitica-assets.s3.amazonaws.com/mobileApp/images';

/** Sprites lendários/especiais que usam .gif animado no avatar do Habitica */
const ANIMATED_AVATAR_IDS = new Set<string>([
  'weapon_special_0',
  'armor_special_0',
  'head_special_0',
  'shield_special_0',
  'armor_special_1',
  'head_special_1',
  'weapon_special_critical',
]);

export function getEquipmentById(id?: string): EquipmentItem | undefined {
  if (!id) return undefined;
  return EQUIPMENT_BY_ID.get(id);
}

/**
 * Resolve o caminho de um sprite de aparência/cenário (usa /sprites/ quando local
 * e a CDN oficial do Habitica para os demais).
 */
export function getAppearanceSpritePath(fileName: string): string {
  if (LOCAL_SPRITES.has(fileName)) {
    return `/sprites/${fileName}`;
  }
  return `${HABITICA_CDN}/${fileName}`;
}

/**
 * Resolve o caminho do sprite para renderização no Avatar (usa /sprites/ quando local
 * e a CDN oficial do Habitica para os demais itens e GIFs animados).
 */
export function getEquipmentSpritePath(itemId: string, bodySize: BodySize): string {
  const ext = ANIMATED_AVATAR_IDS.has(itemId) ? 'gif' : 'png';
  const filename = itemId.startsWith('armor_')
    ? `${bodySize}_${itemId}.${ext}`
    : `${itemId}.${ext}`;

  if (LOCAL_SPRITES.has(filename)) {
    return `/sprites/${filename}`;
  }
  return `${HABITICA_CDN}/${filename}`;
}

/**
 * Resolve o ícone oficial de vitrine (shop_<id>.png) para cards da Loja e Inventário.
 */
export function getEquipmentShopIconPath(itemId: string): string {
  const shopFilename = `shop_${itemId}.png`;
  if (LOCAL_SPRITES.has(shopFilename)) {
    return `/sprites/${shopFilename}`;
  }
  return `${HABITICA_CDN}/${shopFilename}`;
}

/**
 * Soma os atributos de todos os itens equipados nos 8 slots oficiais.
 */
export function computeTotalAttributes(equipped: EquippedGear): Attributes {
  const total: Attributes = { str: 0, int: 0, con: 0, per: 0 };
  const slots: EquipmentSlot[] = [
    'weapon',
    'shield',
    'armor',
    'head',
    'headAccessory',
    'eyewear',
    'body',
    'back',
  ];
  for (const slot of slots) {
    const item = getEquipmentById(equipped[slot]);
    if (item) {
      total.str += item.stats.str;
      total.int += item.stats.int;
      total.con += item.stats.con;
      total.per += item.stats.per;
    }
  }
  return total;
}
