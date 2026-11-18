export type EquipmentSlot = 'weapon' | 'shield' | 'armor' | 'head' | 'back' | 'eyewear';
export type BodySize = 'broad' | 'slim';
export type CombatHeroClass = 'warrior' | 'wizard' | 'rogue' | 'healer';
export type PlayableHeroClass = 'apprentice' | CombatHeroClass;
export type HeroClass = PlayableHeroClass | 'cosmetic';
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
  slot: EquipmentSlot;
  heroClass: HeroClass;
  tier: number;
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

const CLASS_LABELS: Record<CombatHeroClass, string> = {
  warrior: 'Guerreiro',
  wizard: 'Mago',
  rogue: 'Ladino',
  healer: 'Curandeiro',
};

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: 'Arma',
  shield: 'Escudo',
  armor: 'Armadura',
  head: 'Capacete',
  back: 'Capa / Costas',
  eyewear: 'Óculos',
};

function buildStats(cls: CombatHeroClass, slot: EquipmentSlot, tier: number): Attributes {
  const base = tier === 0 ? 1 : tier * 3 + (slot === 'armor' || slot === 'weapon' ? 2 : 0);
  switch (cls) {
    case 'warrior':
      return { str: base + 2, int: 0, con: Math.max(1, Math.floor(base * 0.7)), per: 0 };
    case 'wizard':
      return { str: 0, int: base + 3, con: 0, per: Math.max(1, Math.floor(base * 0.6)) };
    case 'rogue':
      return { str: Math.max(1, Math.floor(base * 0.7)), int: 0, con: 0, per: base + 2 };
    case 'healer':
      return { str: 0, int: Math.max(1, Math.floor(base * 0.7)), con: base + 2, per: 0 };
  }
}

const COSMETIC_BACK_ITEMS: EquipmentItem[] = [
  { id: 'back_special_aetherCloak', name: 'Manto do Éter', slot: 'back', heroClass: 'cosmetic', tier: 1, price: 30, stats: { str: 0, int: 3, con: 0, per: 2 } },
  { id: 'back_special_snowdriftVeil', name: 'Véu da Neve', slot: 'back', heroClass: 'cosmetic', tier: 1, price: 30, stats: { str: 0, int: 2, con: 3, per: 0 } },
  { id: 'back_special_bearTail', name: 'Cauda de Urso', slot: 'back', heroClass: 'cosmetic', tier: 1, price: 25, stats: { str: 2, int: 0, con: 2, per: 0 } },
  { id: 'back_special_foxTail', name: 'Cauda de Raposa', slot: 'back', heroClass: 'cosmetic', tier: 1, price: 25, stats: { str: 0, int: 1, con: 0, per: 3 } },
  { id: 'back_special_lionTail', name: 'Cauda de Leão', slot: 'back', heroClass: 'cosmetic', tier: 1, price: 25, stats: { str: 3, int: 0, con: 1, per: 0 } },
  { id: 'back_special_cactusTail', name: 'Espinhos de Cacto', slot: 'back', heroClass: 'cosmetic', tier: 1, price: 25, stats: { str: 1, int: 0, con: 3, per: 0 } },
  { id: 'back_special_wondercon_black', name: 'Capa Herói Preta', slot: 'back', heroClass: 'cosmetic', tier: 2, price: 35, stats: { str: 2, int: 2, con: 2, per: 2 } },
  { id: 'back_special_wondercon_red', name: 'Capa Herói Vermelha', slot: 'back', heroClass: 'cosmetic', tier: 2, price: 35, stats: { str: 3, int: 1, con: 2, per: 1 } },
];

const COSMETIC_EYEWEAR_ITEMS: EquipmentItem[] = [
  { id: 'eyewear_special_blackTopFrame', name: 'Óculos Preto', slot: 'eyewear', heroClass: 'cosmetic', tier: 1, price: 20, stats: { str: 0, int: 2, con: 0, per: 2 } },
  { id: 'eyewear_special_blueTopFrame', name: 'Óculos Azul', slot: 'eyewear', heroClass: 'cosmetic', tier: 1, price: 20, stats: { str: 0, int: 3, con: 0, per: 1 } },
  { id: 'eyewear_special_redTopFrame', name: 'Óculos Vermelho', slot: 'eyewear', heroClass: 'cosmetic', tier: 1, price: 20, stats: { str: 2, int: 1, con: 0, per: 1 } },
  { id: 'eyewear_special_greenTopFrame', name: 'Óculos Verde', slot: 'eyewear', heroClass: 'cosmetic', tier: 1, price: 20, stats: { str: 0, int: 1, con: 2, per: 1 } },
  { id: 'eyewear_special_yellowTopFrame', name: 'Óculos Amarelo', slot: 'eyewear', heroClass: 'cosmetic', tier: 1, price: 20, stats: { str: 0, int: 1, con: 0, per: 3 } },
  { id: 'eyewear_special_pinkTopFrame', name: 'Óculos Rosa', slot: 'eyewear', heroClass: 'cosmetic', tier: 1, price: 20, stats: { str: 0, int: 2, con: 1, per: 1 } },
  { id: 'eyewear_special_whiteTopFrame', name: 'Óculos Branco', slot: 'eyewear', heroClass: 'cosmetic', tier: 1, price: 20, stats: { str: 1, int: 2, con: 1, per: 1 } },
  { id: 'eyewear_special_summerWarrior', name: 'Óculos de Sol Guerreiro', slot: 'eyewear', heroClass: 'cosmetic', tier: 2, price: 30, stats: { str: 3, int: 0, con: 2, per: 1 } },
  { id: 'eyewear_special_summerRogue', name: 'Óculos de Sol Ladino', slot: 'eyewear', heroClass: 'cosmetic', tier: 2, price: 30, stats: { str: 1, int: 0, con: 1, per: 4 } },
];

function buildCatalog(): EquipmentItem[] {
  const items: EquipmentItem[] = [];
  const classes: CombatHeroClass[] = ['warrior', 'wizard', 'rogue', 'healer'];

  for (const cls of classes) {
    for (let tier = 0; tier <= 5; tier++) {
      items.push({
        id: `weapon_${cls}_${tier}`,
        name: `${SLOT_LABELS.weapon} ${CLASS_LABELS[cls]} Nv.${tier === 0 ? 'Inicial' : tier}`,
        slot: 'weapon',
        heroClass: cls,
        tier,
        price: tier === 0 ? 10 : tier * 20,
        stats: buildStats(cls, 'weapon', tier),
      });
    }

    if (cls !== 'wizard') {
      const startTier = cls === 'rogue' ? 0 : 1;
      for (let tier = startTier; tier <= 5; tier++) {
        items.push({
          id: `shield_${cls}_${tier}`,
          name: `${SLOT_LABELS.shield} ${CLASS_LABELS[cls]} Nv.${tier === 0 ? 'Inicial' : tier}`,
          slot: 'shield',
          heroClass: cls,
          tier,
          price: tier === 0 ? 10 : tier * 18,
          stats: buildStats(cls, 'shield', tier),
        });
      }
    }

    for (let tier = 1; tier <= 5; tier++) {
      items.push({
        id: `armor_${cls}_${tier}`,
        name: `${SLOT_LABELS.armor} ${CLASS_LABELS[cls]} Nv.${tier}`,
        slot: 'armor',
        heroClass: cls,
        tier,
        price: tier * 25,
        stats: buildStats(cls, 'armor', tier),
      });
      items.push({
        id: `head_${cls}_${tier}`,
        name: `${SLOT_LABELS.head} ${CLASS_LABELS[cls]} Nv.${tier}`,
        slot: 'head',
        heroClass: cls,
        tier,
        price: tier * 15,
        stats: buildStats(cls, 'head', tier),
      });
    }
  }

  return [...items, ...COSMETIC_BACK_ITEMS, ...COSMETIC_EYEWEAR_ITEMS];
}

export const EQUIPMENT_CATALOG: EquipmentItem[] = buildCatalog();

export function getEquipmentById(id?: string): EquipmentItem | undefined {
  if (!id) return undefined;
  return EQUIPMENT_CATALOG.find((item) => item.id === id);
}

/**
 * Resolve o caminho do sprite em /sprites/ considerando bodySize para armaduras.
 */
export function getEquipmentSpritePath(itemId: string, bodySize: BodySize): string {
  if (itemId.startsWith('armor_')) {
    return `/sprites/${bodySize}_${itemId}.png`;
  }
  return `/sprites/${itemId}.png`;
}

/**
 * Soma os atributos de todos os itens equipados.
 */
export function computeTotalAttributes(equipped: EquippedGear): Attributes {
  const total: Attributes = { str: 0, int: 0, con: 0, per: 0 };
  const slots: EquipmentSlot[] = ['weapon', 'shield', 'armor', 'head', 'back', 'eyewear'];
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
