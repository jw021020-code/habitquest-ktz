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

/** Mapeamento oficial de sprites especiais/animados (.gif) do sprites.css do Habitica */
const SPECIAL_AVATAR_FILENAMES: Record<string, string> = {
  back_special_heroicAureole: 'back_special_heroicAureole.gif',
  weapon_special_0: 'BackerOnly-Weapon-DarkSoulsBlade.gif',
  armor_special_0: 'BackerOnly-Equip-ShadeArmor.gif',
  head_special_0: 'BackerOnly-Equip-ShadeHelmet.gif',
  shield_special_0: 'BackerOnly-Shield-TormentedSkull.gif',
  armor_special_1: 'ContributorOnly-Equip-CrystalArmor.gif',
  head_special_1: 'ContributorOnly-Equip-CrystalHelmet.gif',
  weapon_special_critical: 'weapon_special_critical.gif',
  armor_special_ks2019: 'BackerOnly-Equip-MythicGryphonArmor.gif',
  eyewear_special_ks2019: 'BackerOnly-Equip-MythicGryphonVisor.gif',
  head_special_ks2019: 'BackerOnly-Equip-MythicGryphonHelm.gif',
  shield_special_ks2019: 'BackerOnly-Equip-MythicGryphonShield.gif',
  weapon_special_ks2019: 'BackerOnly-Equip-MythicGryphonGlaive.gif',
};

const ANIMATED_BACKGROUNDS = new Set<string>([
  'background_airship.png',
  'background_clocktower.png',
  'background_steamworks.png',
]);

const SPECIAL_AVATAR_OFFSETS: Record<string, { marginLeft?: number; marginTop?: number }> = {
  weapon_special_0: { marginLeft: -3, marginTop: -18 },
  head_special_0: { marginLeft: -3, marginTop: -18 },
  weapon_special_1: { marginLeft: -12 },
  head_special_1: { marginTop: 3 },
  weapon_special_critical: { marginLeft: -12, marginTop: 12 },
};

export function getEquipmentById(id?: string): EquipmentItem | undefined {
  if (!id) return undefined;
  return EQUIPMENT_BY_ID.get(id);
}

/**
 * Retorna offsets de posicionamento (em px nativos) definidos no sprites.css oficial do Habitica.
 */
export function getEquipmentSpriteOffset(
  itemId: string
): { marginLeft?: number; marginTop?: number } | undefined {
  return SPECIAL_AVATAR_OFFSETS[itemId];
}

/**
 * Resolve o caminho de um sprite de aparência/cenário (usa /sprites/ quando local
 * e a CDN oficial do Habitica para os demais, incluindo cenários animados .gif).
 */
export function getAppearanceSpritePath(fileName: string): string {
  const resolved = ANIMATED_BACKGROUNDS.has(fileName)
    ? fileName.replace(/\.png$/, '.gif')
    : fileName;
  if (LOCAL_SPRITES.has(resolved)) {
    return `/sprites/${resolved}`;
  }
  return `${HABITICA_CDN}/${resolved}`;
}

/**
 * Resolve o caminho do sprite para renderização no Avatar (usa /sprites/ quando local
 * e a CDN oficial do Habitica para os demais itens e GIFs animados).
 */
export function getEquipmentSpritePath(itemId: string, bodySize: BodySize): string {
  const filename =
    SPECIAL_AVATAR_FILENAMES[itemId] ??
    (itemId.startsWith('armor_') ? `${bodySize}_${itemId}.png` : `${itemId}.png`);

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

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const RARITY_META: Record<
  ItemRarity,
  {
    label: string;
    badgeClass: string;
    cardBorderClass: string;
    glowShadow: string;
    weight: number;
  }
> = {
  common: {
    label: 'Comum',
    badgeClass: 'bg-slate-700/70 text-slate-200 border-slate-500/40',
    cardBorderClass: 'border-[#3a3447]',
    glowShadow: 'none',
    weight: 48,
  },
  uncommon: {
    label: 'Incomum',
    badgeClass: 'bg-emerald-900/70 text-emerald-300 border-emerald-500/40',
    cardBorderClass: 'border-emerald-500/80',
    glowShadow: '0 0 10px rgba(16, 185, 129, 0.28)',
    weight: 28,
  },
  rare: {
    label: 'Raro',
    badgeClass: 'bg-sky-900/70 text-sky-300 border-sky-500/40',
    cardBorderClass: 'border-sky-400/90',
    glowShadow: '0 0 15px rgba(56, 189, 248, 0.40)',
    weight: 15,
  },
  epic: {
    label: 'Épico',
    badgeClass: 'bg-purple-900/70 text-purple-300 border-purple-500/50',
    cardBorderClass: 'border-purple-400',
    glowShadow: '0 0 20px rgba(192, 132, 252, 0.55)',
    weight: 7,
  },
  legendary: {
    label: 'Lendário',
    badgeClass: 'bg-amber-900/70 text-amber-300 border-amber-400/60',
    cardBorderClass: 'border-amber-400 ring-1 ring-amber-300/60',
    glowShadow: '0 0 26px rgba(251, 191, 36, 0.72)',
    weight: 2,
  },
};

export function getItemRarity(item: EquipmentItem): ItemRarity {
  const raw = item.stats.str + item.stats.int + item.stats.con + item.stats.per;
  const sum = item.twoHanded ? Math.round(raw / 1.45) : raw;
  if (sum >= 25) return 'legendary';
  if (sum >= 19) return 'epic';
  if (sum >= 13) return 'rare';
  if (sum >= 7) return 'uncommon';
  return 'common';
}

export function isDropOnlyRarity(rarity: ItemRarity): boolean {
  return rarity === 'epic' || rarity === 'legendary';
}

export function hasClassAffinity(
  item: EquipmentItem,
  heroClass?: PlayableHeroClass
): boolean {
  return Boolean(
    heroClass && heroClass !== 'apprentice' && item.heroClass === heroClass
  );
}

/**
 * Retorna os atributos efetivos de um equipamento considerando o bônus de +50%
 * quando equipado por um herói da mesma classe (afinidade de classe).
 */
export function getItemEffectiveStats(
  item: EquipmentItem,
  heroClass?: PlayableHeroClass
): Attributes {
  const mult = hasClassAffinity(item, heroClass) ? 1.5 : 1.0;
  return {
    str: Math.round(item.stats.str * mult),
    int: Math.round(item.stats.int * mult),
    con: Math.round(item.stats.con * mult),
    per: Math.round(item.stats.per * mult),
  };
}

/**
 * Soma os atributos de todos os itens equipados nos 8 slots oficiais,
 * aplicando +50% de bônus de afinidade para itens da classe do herói.
 */
export function computeTotalAttributes(
  equipped: EquippedGear,
  heroClass?: PlayableHeroClass
): Attributes {
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
      const eff = getItemEffectiveStats(item, heroClass);
      total.str += eff.str;
      total.int += eff.int;
      total.con += eff.con;
      total.per += eff.per;
    }
  }
  return total;
}
