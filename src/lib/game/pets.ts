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
 * Chance escalada por Percepção (PER) e pelo esforço do registro de dropar um Ovo ou Poção de Chocar.
 * Base (esforço 1.5 = ~45min ou ~19 questões): 16%, chegando até 40% com PER alto / esforço grande.
 */
export function rollTaskDrop(
  per = 0,
  effortFactor = 1.5
):
  | { kind: 'egg'; label: string }
  | { kind: 'potion'; label: string }
  | null {
  const baseChance = Math.min(0.4, 0.16 + Math.max(0, per) * 0.0025);
  const dropScale = Math.min(2.5, Math.max(0.05, effortFactor / 1.5));
  const chance = Math.min(0.4, baseChance * dropScale);
  if (Math.random() > chance) return null;

  return Math.random() < 0.5
    ? { kind: 'egg', label: 'Ovo' }
    : { kind: 'potion', label: 'Poção de Chocar' };
}

export const SPECIES_LABELS_PT: Record<string, string> = {
  Alligator: 'Jacaré',
  Alpaca: 'Alpaca',
  Armadillo: 'Tatu',
  Axolotl: 'Axolote',
  Badger: 'Texugo',
  Bear: 'Urso (Especial)',
  BearCub: 'Filhote de Urso',
  Beetle: 'Besouro',
  Bunny: 'Coelho',
  Butterfly: 'Borboleta',
  Cactus: 'Cacto',
  Cat: 'Gato',
  Chameleon: 'Camaleão',
  Cheetah: 'Guepardo',
  Cow: 'Vaca',
  Crab: 'Caranguejo',
  Cuttlefish: 'Siba',
  Deer: 'Cervo',
  Dog: 'Cachorro',
  Dolphin: 'Golfinho',
  Dragon: 'Dragão',
  Egg: 'Ovo',
  Falcon: 'Falcão',
  Ferret: 'Furão',
  FlyingPig: 'Porco Voador',
  Fox: 'Raposa',
  Frog: 'Sapo',
  Giraffe: 'Girafa',
  Gryphatrice: 'Grifaleão-Real',
  Gryphon: 'Grifo',
  GuineaPig: 'Porquinho-da-Índia',
  Hedgehog: 'Ouriço',
  Hippo: 'Hipopótamo',
  Hippogriff: 'Hipogrifo',
  Horse: 'Cavalo',
  Jackalope: 'Jackalope',
  JackOLantern: 'Abóbora (Halloween)',
  Kangaroo: 'Canguru',
  Lion: 'Leão (Especial)',
  LionCub: 'Filhote de Leão',
  MagicalBee: 'Abelha Mágica',
  Mammoth: 'Mamute',
  MantisShrimp: 'Camarão-Louva-a-Deus',
  Monkey: 'Macaco',
  Nudibranch: 'Nudibrânquio',
  Octopus: 'Polvo',
  Orca: 'Orca',
  Otter: 'Lontra',
  Owl: 'Coruja',
  PandaCub: 'Filhote de Panda',
  Parrot: 'Papagaio',
  Peacock: 'Pavão',
  Penguin: 'Pinguim',
  Phoenix: 'Fênix',
  Platypus: 'Ornitorrinco',
  Pterodactyl: 'Pterodáctilo',
  Raccoon: 'Guaxinim',
  Rat: 'Rato',
  Robot: 'Robô',
  Rock: 'Pedra',
  Rooster: 'Galo',
  Sabretooth: 'Tigre-Dentes-de-Sabre',
  SeaSerpent: 'Serpente Marinha',
  Seahorse: 'Cavalo-Marinho',
  Sheep: 'Ovelha',
  Slime: 'Slime',
  Sloth: 'Preguiça',
  Snail: 'Caracol',
  Snake: 'Cobra',
  Spider: 'Aranha',
  Squirrel: 'Esquilo',
  TRex: 'T-Rex',
  Tiger: 'Tigre (Especial)',
  TigerCub: 'Filhote de Tigre',
  Treeling: 'Broto de Árvore',
  Triceratops: 'Triceratops',
  Turkey: 'Peru',
  Turtle: 'Tartaruga',
  Unicorn: 'Unicórnio',
  Velociraptor: 'Velociraptor',
  Whale: 'Baleia',
  Wolf: 'Lobo',
  Yarn: 'Novelo de Lã',
};

export const POTION_LABELS_PT: Record<string, string> = {
  Alien: 'Alienígena',
  Amber: 'Âmbar',
  Aquatic: 'Aquático',
  Aurora: 'Aurora',
  AutumnLeaf: 'Folha de Outono',
  Balloon: 'Balão',
  Base: 'Base (Padrão)',
  BirchBark: 'Casca de Bétula',
  BlackPearl: 'Pérola Negra',
  Bronze: 'Bronze',
  Celestial: 'Celestial',
  Cerberus: 'Cérbero',
  CottonCandyBlue: 'Algodão-Doce Azul',
  CottonCandyPink: 'Algodão-Doce Rosa',
  Cryptid: 'Críptico',
  Cupid: 'Cupido',
  Desert: 'Deserto',
  Dessert: 'Sobremesa',
  Ember: 'Brasa',
  Fairy: 'Fada',
  Floral: 'Floral',
  Fluorite: 'Fluorita',
  Frost: 'Geada',
  Fungi: 'Fungo',
  Ghost: 'Fantasma',
  Gilded: 'Dourado Real',
  Gingerbread: 'Biscoito de Gengibre',
  Glass: 'Vidro',
  Glow: 'Brilhante',
  Golden: 'Dourado',
  Gryphatrice: 'Grifaleão',
  Holly: 'Azevinho',
  Hopeful: 'Esperança',
  Hydra: 'Hidra',
  IcySnow: 'Neve Gelada',
  Jade: 'Jade',
  Jubilant: 'Jubiloso',
  Koi: 'Carpa Koi',
  Moonglow: 'Brilho Lunar',
  MossyStone: 'Pedra com Musgo',
  Onyx: 'Ônix',
  Opal: 'Opala',
  Peppermint: 'Hortelã',
  PinkMarble: 'Mármore Rosa',
  Polar: 'Polar',
  PolkaDot: 'Bolinhas',
  Porcelain: 'Porcelana',
  Rainbow: 'Arco-Íris',
  Red: 'Escarlate (Vermelho)',
  RoseGold: 'Ouro Rosé',
  RoseQuartz: 'Quartzo Rosa',
  RoyalPurple: 'Roxo Real',
  Ruby: 'Rubi',
  SandSculpture: 'Escultura de Areia',
  Shade: 'Sombrio (Preto)',
  Shadow: 'Sombra',
  Shimmer: 'Cintilante',
  Silver: 'Prata',
  Skeleton: 'Esqueleto',
  SolarSystem: 'Sistema Solar',
  Spooky: 'Assustador',
  StainedGlass: 'Vitral',
  Sunset: 'Pôr do Sol',
  Sunshine: 'Raio de Sol',
  TeaShop: 'Casa de Chá',
  Thunderstorm: 'Tempestade',
  Turquoise: 'Turquesa',
  Vampire: 'Vampiro',
  Veggie: 'Vegetal',
  Veteran: 'Veterano',
  VirtualPet: 'Pet Virtual',
  Watery: 'Aquoso',
  White: 'Das Neves (Branco)',
  Windup: 'Corda (Mecânico)',
  Zombie: 'Zumbi',
};

export function getSpeciesLabelPt(species: string): string {
  return SPECIES_LABELS_PT[species] ?? species;
}

export function getPotionLabelPt(potion: string): string {
  return POTION_LABELS_PT[potion] ?? potion;
}

export const PET_SPECIES_LIST: string[] = Array.from(
  new Set(PET_CATALOG.map((p) => p.species))
).sort((a, b) => getSpeciesLabelPt(a).localeCompare(getSpeciesLabelPt(b), 'pt-BR'));

export const PET_POTIONS_LIST: string[] = Array.from(
  new Set(PET_CATALOG.map((p) => p.potion))
).sort((a, b) => getPotionLabelPt(a).localeCompare(getPotionLabelPt(b), 'pt-BR'));
