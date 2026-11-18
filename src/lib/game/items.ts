import gearCatalogRaw from './gear-catalog.json';
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

export type HairColor = 'black' | 'brown' | 'blond' | 'red' | 'white';
export type ShirtColor =
  | 'black'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'white'
  | 'yellow'
  | 'convict';

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
  hairStyle: number; // 1..5
  hairBangs: number; // 1..4
  hairColor: HairColor;
  hairBeard?: number; // 0..3
  hairMustache?: number; // 0..2
  background?: string; // 'none' ou nome do background
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

export const SKIN_OPTIONS = [
  { id: 'f5a76e', label: 'Claro Quente', hex: '#f5a76e' },
  { id: 'ddc994', label: 'Claro Neutro', hex: '#ddc994' },
  { id: 'ea8349', label: 'Dourado', hex: '#ea8349' },
  { id: 'c06534', label: 'Bronze', hex: '#c06534' },
  { id: '98461a', label: 'Escuro', hex: '#98461a' },
  { id: '915533', label: 'Café', hex: '#915533' },
  { id: 'c3e1dc', label: 'Elfo / Gelo', hex: '#c3e1dc' },
] as const;

export const SHIRT_OPTIONS: { id: ShirtColor; label: string }[] = [
  { id: 'black', label: 'Preta' },
  { id: 'blue', label: 'Azul' },
  { id: 'green', label: 'Verde' },
  { id: 'purple', label: 'Roxa' },
  { id: 'pink', label: 'Rosa' },
  { id: 'yellow', label: 'Amarela' },
  { id: 'white', label: 'Branca' },
  { id: 'convict', label: 'Listrada' },
];

export const HAIR_COLORS: { id: HairColor; label: string; hex: string }[] = [
  { id: 'black', label: 'Preto', hex: '#1e293b' },
  { id: 'brown', label: 'Castanho', hex: '#78350f' },
  { id: 'blond', label: 'Loiro', hex: '#eab308' },
  { id: 'red', label: 'Ruivo', hex: '#dc2626' },
  { id: 'white', label: 'Branco', hex: '#e2e8f0' },
];

export const BACKGROUND_OPTIONS: { id: string; label: string }[] = [
  { id: 'none', label: 'Sem Fundo' },
  { id: 'forest', label: 'Floresta' },
  { id: 'autumn_forest', label: 'Floresta de Outono' },
  { id: 'beach', label: 'Praia' },
  { id: 'clouds', label: 'Nuvens' },
  { id: 'coral_reef', label: 'Recife de Coral' },
  { id: 'dusty_canyons', label: 'Cânions' },
  { id: 'fairy_ring', label: 'Círculo das Fadas' },
  { id: 'graveyard', label: 'Cemitério' },
  { id: 'harvest_fields', label: 'Campos de Colheita' },
  { id: 'haunted_house', label: 'Casa Assombrada' },
  { id: 'open_waters', label: 'Mar Aberto' },
  { id: 'pumpkin_patch', label: 'Plantação de Abóboras' },
  { id: 'seafarer_ship', label: 'Navio Pirata' },
  { id: 'thunderstorm', label: 'Tempestade' },
  { id: 'volcano', label: 'Vulcão' },
];

export const DEFAULT_APPEARANCE: CharacterAppearance = {
  skin: 'f5a76e',
  bodySize: 'broad',
  shirt: 'blue',
  hairStyle: 1,
  hairBangs: 1,
  hairColor: 'brown',
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
