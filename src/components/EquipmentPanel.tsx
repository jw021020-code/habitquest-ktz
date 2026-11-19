'use client';

import React, { useState } from 'react';
import {
  Coins,
  Copy,
  Eraser,
  Eye,
  Search,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  Attributes,
  BACKGROUND_OPTIONS,
  CharacterAppearance,
  EQUIPMENT_CATALOG,
  EquipmentItem,
  EquipmentSlot,
  EquippedGear,
  GearCategory,
  GearSeason,
  getAppearanceSpritePath,
  getEquipmentById,
  getEquipmentShopIconPath,
  getItemEffectiveStats,
  getItemRarity,
  HAIR_BANGS_OPTIONS,
  HAIR_BASE_OPTIONS,
  HAIR_COLORS,
  HAIR_FLOWER_OPTIONS,
  hasClassAffinity,
  HeroClass,
  ItemRarity,
  PlayableHeroClass,
  RARITY_META,
  SHIRT_OPTIONS,
  SKIN_OPTIONS,
  SkinGroup,
} from '@/lib/game/items';
import {
  ALL_PET_IDS,
  formatPetName,
  getPetSpritePath,
  getPotionLabelPt,
  getSpeciesLabelPt,
  PET_CATALOG,
  PET_POTIONS_LIST,
  PET_SPECIES_LIST,
  PetCategory,
  StableState,
} from '@/lib/game/pets';
import { CharacterAvatar } from './CharacterAvatar';
import { InventorySubTab, ShopSubTab } from './HabiticaHeader';

interface EquipmentPanelProps {
  mode: 'inventory' | 'shop' | null;
  invTab: InventorySubTab;
  shopFilter: ShopSubTab;
  onChangeInvTab: (tab: InventorySubTab) => void;
  onChangeShopFilter: (filter: ShopSubTab) => void;
  gold: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  heroClass: PlayableHeroClass;
  appearance: CharacterAppearance;
  equipped: EquippedGear;
  costume: EquippedGear;
  useCostume: boolean;
  inventory: string[];
  stable: StableState;
  totalAttributes: Attributes;
  onChangeAppearance: (next: CharacterAppearance) => void;
  onBuyItem: (item: EquipmentItem, afterBuy?: 'bag' | 'equip' | 'costume') => void;
  onBuyBatchItems: (items: EquipmentItem[]) => void;
  onBuyPotion: () => void;
  onBuyManaPotion: () => void;
  onBuyArmoire: (count?: number) => void;
  onBuyHatchPotion: (count?: number) => void;
  onSellEgg: () => void;
  onSellPotion: () => void;
  onToggleEquip: (item: EquipmentItem) => void;
  onUnequipSlot: (slot: EquipmentSlot) => void;
  onClearAllEquipped: () => void;
  onAutoEquipBest: () => void;
  onToggleCostumeEquip: (item: EquipmentItem) => void;
  onUnequipCostumeSlot: (slot: EquipmentSlot) => void;
  onClearCostume: () => void;
  onCopyBattleToCostume: () => void;
  onToggleUseCostume: () => void;
  onHatchEgg: () => void;
  onTogglePet: (petId: string) => void;
}

const ALL_SLOTS: EquipmentSlot[] = [
  'weapon',
  'shield',
  'armor',
  'head',
  'headAccessory',
  'eyewear',
  'body',
  'back',
];

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: 'Arma',
  shield: 'Escudo',
  armor: 'Armadura',
  head: 'Capacete',
  headAccessory: 'Acess. Cabeça',
  eyewear: 'Óculos',
  body: 'Acess. Corpo',
  back: 'Capa / Costas',
};

const CLASS_LABEL: Record<HeroClass | 'all', string> = {
  all: 'Todas',
  apprentice: 'Aprendiz',
  warrior: 'Espadachim',
  wizard: 'Noviço Arcano',
  rogue: 'Batedor',
  healer: 'Escudeiro',
  cosmetic: 'Sem Classe / Visual',
};

const CATEGORY_OPTIONS: { id: GearCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos (1.877)' },
  { id: 'class', label: 'Classes (85)' },
  { id: 'seasonal', label: 'Sazonais (822)' },
  { id: 'armoire', label: 'Armoire (472)' },
  { id: 'mystery', label: 'Mistério (341)' },
  { id: 'special', label: 'Especiais (157)' },
];

const SEASON_OPTIONS: { id: GearSeason | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas as Galas' },
  { id: 'winter', label: '❄️ Inverno' },
  { id: 'spring', label: '🌸 Primavera' },
  { id: 'summer', label: '☀️ Verão' },
  { id: 'fall', label: '🎃 Outono' },
];

type ShopSortMode =
  | 'stats-desc'
  | 'str-desc'
  | 'int-desc'
  | 'con-desc'
  | 'per-desc'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';
type InvSortMode =
  | 'equipped-stats'
  | 'stats-desc'
  | 'str-desc'
  | 'int-desc'
  | 'con-desc'
  | 'per-desc'
  | 'name-asc';
type InvStatusFilter = 'all' | 'equipped' | 'upgrades' | 'with-stats' | 'cosmetic';
type ShopUtilityFilter = 'all' | 'upgrades' | 'with-stats' | 'cosmetic';
type StatFocusFilter = 'all' | keyof Attributes;
type AfterBuyMode = 'bag' | 'equip' | 'costume';

const PAGE_SIZE = 48;
const INV_PAGE_SIZE = 60;

function getStatSum(stats: Attributes): number {
  return stats.str + stats.int + stats.con + stats.per;
}

function formatStats(stats: Attributes): string {
  const parts: string[] = [];
  if (stats.str) parts.push(`STR +${stats.str}`);
  if (stats.int) parts.push(`INT +${stats.int}`);
  if (stats.con) parts.push(`CON +${stats.con}`);
  if (stats.per) parts.push(`PER +${stats.per}`);
  return parts.join(' · ') || 'Visual';
}

export function EquipmentPanel({
  mode,
  invTab,
  shopFilter,
  onChangeShopFilter,
  gold,
  hp,
  maxHp,
  mp,
  maxMp,
  heroClass,
  appearance,
  equipped,
  costume,
  useCostume,
  inventory,
  stable,
  totalAttributes,
  onChangeAppearance,
  onBuyItem,
  onBuyBatchItems,
  onBuyPotion,
  onBuyManaPotion,
  onBuyArmoire,
  onBuyHatchPotion,
  onSellEgg,
  onSellPotion,
  onToggleEquip,
  onUnequipSlot,
  onClearAllEquipped,
  onAutoEquipBest,
  onToggleCostumeEquip,
  onUnequipCostumeSlot,
  onClearCostume,
  onCopyBattleToCostume,
  onToggleUseCostume,
  onHatchEgg,
  onTogglePet,
}: EquipmentPanelProps) {
  const [slotFilter, setSlotFilter] = useState<EquipmentSlot | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<GearCategory | 'all'>('all');
  const [seasonFilter, setSeasonFilter] = useState<GearSeason | 'all'>('all');
  const [sortMode, setSortMode] = useState<ShopSortMode>('stats-desc');
  const [shopStatFocus, setShopStatFocus] = useState<StatFocusFilter>('all');
  const [shopUtilityFilter, setShopUtilityFilter] = useState<ShopUtilityFilter>('all');
  const [shopRarityFilter, setShopRarityFilter] = useState<ItemRarity | 'all'>('all');
  const [afterBuyMode, setAfterBuyMode] = useState<AfterBuyMode>('bag');
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');

  const [invStatusFilter, setInvStatusFilter] = useState<InvStatusFilter>('all');
  const [invClassFilter, setInvClassFilter] = useState<HeroClass | 'all'>('all');
  const [invCategoryFilter, setInvCategoryFilter] = useState<GearCategory | 'all'>('all');
  const [invRarityFilter, setInvRarityFilter] = useState<ItemRarity | 'all'>('all');
  const [invSortMode, setInvSortMode] = useState<InvSortMode>('equipped-stats');
  const [invVisibleLimit, setInvVisibleLimit] = useState<number>(INV_PAGE_SIZE);

  const [petCategoryFilter, setPetCategoryFilter] = useState<'owned' | 'all' | PetCategory>('owned');
  const [petSpeciesFilter, setPetSpeciesFilter] = useState<string>('all');
  const [petPotionFilter, setPetPotionFilter] = useState<string>('all');
  const [petVisibleLimit, setPetVisibleLimit] = useState<number>(PAGE_SIZE);
  const [petSearch, setPetSearch] = useState('');
  const [bgSearch, setBgSearch] = useState('');
  const [bgVisibleLimit, setBgVisibleLimit] = useState<number>(24);
  const [skinGroupFilter, setSkinGroupFilter] = useState<SkinGroup | 'all'>('all');

  if (!mode) return null;

  const q = searchQuery.trim().toLowerCase();

  const getEquippedDelta = (item: EquipmentItem): number => {
    const cur = getEquipmentById(equipped[item.slot]);
    const itemEff = getItemEffectiveStats(item, heroClass);
    const curEff = cur ? getItemEffectiveStats(cur, heroClass) : undefined;
    return getStatSum(itemEff) - (curEff ? getStatSum(curEff) : 0);
  };

  const ownedCountBySlot = ALL_SLOTS.reduce(
    (acc, sl) => {
      acc[sl] = 0;
      return acc;
    },
    {} as Record<EquipmentSlot, number>
  );
  for (const id of inventory) {
    const eq = getEquipmentById(id);
    if (eq) ownedCountBySlot[eq.slot] += 1;
  }

  const ownedItems = EQUIPMENT_CATALOG.filter((item) => {
    if (!inventory.includes(item.id)) return false;
    if (slotFilter !== 'all' && item.slot !== slotFilter) return false;
    if (invClassFilter !== 'all' && item.heroClass !== invClassFilter) return false;
    if (invCategoryFilter !== 'all' && item.category !== invCategoryFilter) return false;
    if (invRarityFilter !== 'all' && getItemRarity(item) !== invRarityFilter) return false;

    const isEq = equipped[item.slot] === item.id;
    const isCos = costume[item.slot] === item.id;
    const sum = getStatSum(item.stats);

    if (invStatusFilter === 'equipped' && !isEq && !isCos) return false;
    if (invStatusFilter === 'upgrades' && (isEq || getEquippedDelta(item) <= 0)) return false;
    if (invStatusFilter === 'with-stats' && sum <= 0) return false;
    if (invStatusFilter === 'cosmetic' && sum > 0) return false;

    if (q && !item.name.toLowerCase().includes(q) && !(item.notes ?? '').toLowerCase().includes(q)) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (invSortMode === 'equipped-stats') {
      const aActive = equipped[a.slot] === a.id || costume[a.slot] === a.id ? 1 : 0;
      const bActive = equipped[b.slot] === b.id || costume[b.slot] === b.id ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return (
        getStatSum(getItemEffectiveStats(b, heroClass)) -
          getStatSum(getItemEffectiveStats(a, heroClass)) ||
        a.name.localeCompare(b.name)
      );
    }
    if (invSortMode === 'stats-desc') {
      return (
        getStatSum(getItemEffectiveStats(b, heroClass)) -
          getStatSum(getItemEffectiveStats(a, heroClass)) ||
        a.name.localeCompare(b.name)
      );
    }
    if (invSortMode === 'str-desc') return b.stats.str - a.stats.str || getStatSum(b.stats) - getStatSum(a.stats);
    if (invSortMode === 'int-desc') return b.stats.int - a.stats.int || getStatSum(b.stats) - getStatSum(a.stats);
    if (invSortMode === 'con-desc') return b.stats.con - a.stats.con || getStatSum(b.stats) - getStatSum(a.stats);
    if (invSortMode === 'per-desc') return b.stats.per - a.stats.per || getStatSum(b.stats) - getStatSum(a.stats);
    return a.name.localeCompare(b.name);
  });

  const visibleOwnedItems = ownedItems.slice(0, invVisibleLimit);

  const filteredShopItems = EQUIPMENT_CATALOG.filter((item) => {
    if (inventory.includes(item.id)) return false;
    if (shopFilter !== 'all' && item.heroClass !== shopFilter) return false;
    if (slotFilter !== 'all' && item.slot !== slotFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (categoryFilter === 'seasonal' && seasonFilter !== 'all' && item.season !== seasonFilter) {
      return false;
    }
    if (shopRarityFilter !== 'all' && getItemRarity(item) !== shopRarityFilter) return false;
    if (shopStatFocus !== 'all' && item.stats[shopStatFocus] <= 0) return false;

    const sum = getStatSum(item.stats);
    if (shopUtilityFilter === 'upgrades' && getEquippedDelta(item) <= 0) return false;
    if (shopUtilityFilter === 'with-stats' && sum <= 0) return false;
    if (shopUtilityFilter === 'cosmetic' && sum > 0) return false;

    if (q && !item.name.toLowerCase().includes(q) && !(item.notes ?? '').toLowerCase().includes(q)) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortMode === 'price-asc') return a.price - b.price || a.name.localeCompare(b.name);
    if (sortMode === 'price-desc') return b.price - a.price || a.name.localeCompare(b.name);
    if (sortMode === 'stats-desc') {
      return getStatSum(b.stats) - getStatSum(a.stats) || a.price - b.price;
    }
    if (sortMode === 'str-desc') return b.stats.str - a.stats.str || getStatSum(b.stats) - getStatSum(a.stats);
    if (sortMode === 'int-desc') return b.stats.int - a.stats.int || getStatSum(b.stats) - getStatSum(a.stats);
    if (sortMode === 'con-desc') return b.stats.con - a.stats.con || getStatSum(b.stats) - getStatSum(a.stats);
    if (sortMode === 'per-desc') return b.stats.per - a.stats.per || getStatSum(b.stats) - getStatSum(a.stats);
    return a.name.localeCompare(b.name);
  });

  const visibleShopItems = filteredShopItems.slice(0, visibleLimit);
  const visibleShopTotalCost = visibleShopItems.reduce((acc, it) => acc + it.price, 0);

  const ownedPetIds = Object.keys(stable.pets);
  const canHatch =
    stable.eggs > 0 && stable.potions > 0 && ownedPetIds.length < ALL_PET_IDS.length;

  const petQuery = petSearch.trim().toLowerCase();
  const petSpeciesCounts = new Map<string, { owned: number; total: number }>();
  const petPotionCounts = new Map<string, { owned: number; total: number }>();
  for (const pet of PET_CATALOG) {
    const isOwned = stable.pets[pet.id] !== undefined;
    const sp = petSpeciesCounts.get(pet.species) ?? { owned: 0, total: 0 };
    sp.total += 1;
    if (isOwned) sp.owned += 1;
    petSpeciesCounts.set(pet.species, sp);

    const po = petPotionCounts.get(pet.potion) ?? { owned: 0, total: 0 };
    po.total += 1;
    if (isOwned) po.owned += 1;
    petPotionCounts.set(pet.potion, po);
  }

  const filteredPetEntries = PET_CATALOG.filter((pet) => {
    const isOwned = stable.pets[pet.id] !== undefined;
    if (petCategoryFilter === 'owned' && !isOwned) return false;
    if (petCategoryFilter !== 'owned' && petCategoryFilter !== 'all' && pet.category !== petCategoryFilter) {
      return false;
    }
    if (petSpeciesFilter !== 'all' && pet.species !== petSpeciesFilter) {
      return false;
    }
    if (petPotionFilter !== 'all' && pet.potion !== petPotionFilter) {
      return false;
    }
    if (
      petQuery &&
      !pet.name.toLowerCase().includes(petQuery) &&
      !pet.id.toLowerCase().includes(petQuery) &&
      !getSpeciesLabelPt(pet.species).toLowerCase().includes(petQuery) &&
      !getPotionLabelPt(pet.potion).toLowerCase().includes(petQuery)
    ) {
      return false;
    }
    return true;
  });
  const visiblePetEntries = filteredPetEntries.slice(0, petVisibleLimit);
  const specialPetsCount = PET_CATALOG.filter((p) => p.category === 'special').length;

  const filteredBackgrounds = BACKGROUND_OPTIONS.filter((bg) => {
    const bq = bgSearch.trim().toLowerCase();
    if (!bq) return true;
    return (
      bg.label.toLowerCase().includes(bq) ||
      bg.id.toLowerCase().includes(bq) ||
      (bg.notes ?? '').toLowerCase().includes(bq)
    );
  });
  const visibleBackgrounds = filteredBackgrounds.slice(0, bgVisibleLimit);
  const filteredSkins = SKIN_OPTIONS.filter(
    (s) => skinGroupFilter === 'all' || s.group === skinGroupFilter
  );

  return (
    <section className="max-w-7xl w-full mx-auto px-4 pt-4 pb-8 select-none">
      {/* ================================================================= */}
      {/* MODO 1: INVENTÁRIO DE PÁGINA INTEIRA ESTILO HABITICA             */}
      {/* ================================================================= */}
      {mode === 'inventory' && (
        <div className="space-y-4">
          {/* Sub-aba 1: EQUIPAMENTOS */}
          {invTab === 'equipment' && (
            <div className="space-y-4">
              {/* Manequim Duplo Interativo: Equipamento de Batalha vs Fantasia (Costume) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Card Equipamento de Batalha */}
                <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-condensed font-bold text-sm uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#925cf3]" />
                        Equipamento de Batalha (Atributos Ativos)
                      </h3>
                      <p className="text-[11px] text-[#a8a1b5]">
                        STR {totalAttributes.str} · INT {totalAttributes.int} · CON{' '}
                        {totalAttributes.con} · PER {totalAttributes.per}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={onAutoEquipBest}
                        title="Equipa automaticamente os itens com maior soma de atributos para cada slot"
                        className="px-2.5 py-1.5 rounded text-[11px] font-condensed font-bold uppercase bg-[#24cc8f]/20 hover:bg-[#24cc8f]/30 border border-[#24cc8f]/60 text-[#24cc8f] flex items-center gap-1 transition"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Auto-Equipar Melhores
                      </button>
                      <button
                        onClick={onClearAllEquipped}
                        title="Desequipa todos os 8 slots de batalha"
                        className="px-2.5 py-1.5 rounded text-[11px] font-condensed font-bold uppercase bg-[#1a181d] hover:bg-rose-950/60 border border-[#3a3447] hover:border-rose-500/40 text-[#a8a1b5] hover:text-rose-300 flex items-center gap-1 transition"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        Limpar Tudo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {ALL_SLOTS.map((slot) => {
                      const eq = getEquipmentById(equipped[slot]);
                      const isSlotSelected = slotFilter === slot;
                      return (
                        <div
                          key={slot}
                          onClick={() => {
                            setSlotFilter((cur) => (cur === slot ? 'all' : slot));
                            setInvVisibleLimit(INV_PAGE_SIZE);
                          }}
                          title={
                            eq
                              ? `${eq.name} (${formatStats(eq.stats)}). Clique para filtrar ${SLOT_LABEL[slot]}`
                              : `Clique para filtrar ${SLOT_LABEL[slot]}`
                          }
                          className={`relative cursor-pointer rounded-md p-2 flex flex-col items-center text-center border transition ${
                            isSlotSelected
                              ? 'bg-[#2c2240] border-[#925cf3] ring-1 ring-[#925cf3]/50'
                              : 'bg-[#1a181d] border-[#3a3447] hover:border-[#6133b4]'
                          }`}
                        >
                          {eq && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnequipSlot(slot);
                              }}
                              title={`Desequipar ${eq.name}`}
                              className="absolute top-1 right-1 w-5 h-5 rounded bg-[#23202a]/90 hover:bg-rose-600 text-[#a8a1b5] hover:text-white border border-[#3a3447] flex items-center justify-center transition z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <div className="w-12 h-12 rounded bg-[#271b3d] border border-[#432874] flex items-center justify-center mb-1">
                            {eq ? (
                              <img
                                src={getEquipmentShopIconPath(eq.id)}
                                alt={eq.name}
                                className="w-11 h-11 object-contain [image-rendering:pixelated]"
                              />
                            ) : (
                              <span className="text-[10px] text-[#6e677d]">Vazio</span>
                            )}
                          </div>
                          <span className="text-[10px] font-condensed font-bold text-[#a8a1b5] uppercase truncate w-full">
                            {SLOT_LABEL[slot]}
                          </span>
                          <span className="text-[10px] text-white truncate w-full">
                            {eq ? eq.name : '—'}
                          </span>
                          {eq && (
                            <span className="text-[9px] text-[#ffbe5d] font-condensed truncate w-full">
                              {formatStats(eq.stats)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Fantasia (Costume) */}
                <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-4">
                  <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                    <div>
                      <h3 className="font-condensed font-bold text-sm uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[#24cc8f]" />
                        Fantasia (Apenas Visual)
                      </h3>
                      <p className="text-[11px] text-[#a8a1b5]">
                        Clique em um slot para filtrar ou no × para remover.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        onClick={onCopyBattleToCostume}
                        title="Copia os itens atuais de Batalha para a Fantasia"
                        className="px-2 py-1.5 rounded text-[11px] font-condensed font-bold uppercase bg-[#1a181d] hover:bg-[#36205d] border border-[#3a3447] text-[#d6c7ff] flex items-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar de Batalha
                      </button>
                      <button
                        onClick={onClearCostume}
                        title="Limpa todos os 8 slots da Fantasia"
                        className="px-2 py-1.5 rounded text-[11px] font-condensed font-bold uppercase bg-[#1a181d] hover:bg-rose-950/60 border border-[#3a3447] hover:border-rose-500/40 text-[#a8a1b5] hover:text-rose-300 flex items-center gap-1 transition"
                      >
                        <Eraser className="w-3 h-3" />
                        Limpar
                      </button>
                      <button
                        onClick={onToggleUseCostume}
                        className={`px-2.5 py-1.5 rounded text-[11px] font-condensed font-bold uppercase border transition ${
                          useCostume
                            ? 'bg-[#24cc8f]/20 border-[#24cc8f] text-[#24cc8f]'
                            : 'bg-[#1a181d] border-[#3a3447] text-[#a8a1b5] hover:text-white'
                        }`}
                      >
                        {useCostume ? '✓ Fantasia Ativa' : 'Ativar Fantasia'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {ALL_SLOTS.map((slot) => {
                      const eq = getEquipmentById(costume[slot]);
                      const isSlotSelected = slotFilter === slot;
                      return (
                        <div
                          key={slot}
                          onClick={() => {
                            setSlotFilter((cur) => (cur === slot ? 'all' : slot));
                            setInvVisibleLimit(INV_PAGE_SIZE);
                          }}
                          title={
                            eq
                              ? `${eq.name}. Clique para filtrar ${SLOT_LABEL[slot]}`
                              : `Clique para filtrar ${SLOT_LABEL[slot]}`
                          }
                          className={`relative cursor-pointer rounded-md p-2 flex flex-col items-center text-center border transition ${
                            isSlotSelected
                              ? 'bg-[#2c2240] border-[#24cc8f] ring-1 ring-[#24cc8f]/40'
                              : useCostume
                                ? 'bg-[#1a181d] border-[#24cc8f]/40 hover:border-[#24cc8f]'
                                : 'bg-[#1a181d] border-[#3a3447] opacity-70 hover:opacity-100'
                          }`}
                        >
                          {eq && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnequipCostumeSlot(slot);
                              }}
                              title={`Remover ${eq.name} da Fantasia`}
                              className="absolute top-1 right-1 w-5 h-5 rounded bg-[#23202a]/90 hover:bg-rose-600 text-[#a8a1b5] hover:text-white border border-[#3a3447] flex items-center justify-center transition z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <div className="w-12 h-12 rounded bg-[#271b3d] border border-[#432874] flex items-center justify-center mb-1">
                            {eq ? (
                              <img
                                src={getEquipmentShopIconPath(eq.id)}
                                alt={eq.name}
                                className="w-11 h-11 object-contain [image-rendering:pixelated]"
                              />
                            ) : (
                              <span className="text-[10px] text-[#6e677d]">Vazio</span>
                            )}
                          </div>
                          <span className="text-[10px] font-condensed font-bold text-[#a8a1b5] uppercase truncate w-full">
                            {SLOT_LABEL[slot]}
                          </span>
                          <span className="text-[10px] text-white truncate w-full">
                            {eq ? eq.name : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Barra Avançada de Busca, Filtros e Ordenação do Inventário */}
              <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-3.5 space-y-3">
                {/* Linha 1: Slots */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSlotFilter('all');
                      setInvVisibleLimit(INV_PAGE_SIZE);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-condensed font-bold transition ${
                      slotFilter === 'all'
                        ? 'bg-[#6133b4] text-white'
                        : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                    }`}
                  >
                    Todos ({inventory.length})
                  </button>
                  {ALL_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSlotFilter(slot);
                        setInvVisibleLimit(INV_PAGE_SIZE);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-condensed font-bold transition ${
                        slotFilter === slot
                          ? 'bg-[#6133b4] text-white'
                          : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                      }`}
                    >
                      {SLOT_LABEL[slot]} ({ownedCountBySlot[slot]})
                    </button>
                  ))}
                </div>

                {/* Linha 2: Status/Utilidade + Classe + Coleção + Ordenação + Busca */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
                  <div className="lg:col-span-5 flex flex-wrap gap-1">
                    {(
                      [
                        { id: 'all', label: 'Todos' },
                        { id: 'equipped', label: 'Equipados' },
                        { id: 'upgrades', label: 'Upgrades' },
                        { id: 'with-stats', label: 'Com atributos' },
                        { id: 'cosmetic', label: 'Visuais' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setInvStatusFilter(st.id);
                          setInvVisibleLimit(INV_PAGE_SIZE);
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-condensed font-bold transition ${
                          invStatusFilter === st.id
                            ? 'bg-[#24cc8f]/20 border border-[#24cc8f] text-[#24cc8f]'
                            : 'bg-[#1a181d] border border-[#3a3447] text-[#a8a1b5] hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-2">
                    <select
                      value={invClassFilter}
                      onChange={(e) => {
                        setInvClassFilter(e.target.value as HeroClass | 'all');
                        setInvVisibleLimit(INV_PAGE_SIZE);
                      }}
                      className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
                    >
                      <option value="all">Classe: Todas</option>
                      <option value="healer">Escudeiro</option>
                      <option value="warrior">Espadachim</option>
                      <option value="rogue">Batedor</option>
                      <option value="wizard">Noviço Arcano</option>
                      <option value="cosmetic">Visual / Sem Classe</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <select
                      value={invRarityFilter}
                      onChange={(e) => {
                        setInvRarityFilter(e.target.value as ItemRarity | 'all');
                        setInvVisibleLimit(INV_PAGE_SIZE);
                      }}
                      className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
                    >
                      <option value="all">Raridade: Todas</option>
                      <option value="common">Comum</option>
                      <option value="uncommon">Incomum</option>
                      <option value="rare">Raro</option>
                      <option value="epic">Épico</option>
                      <option value="legendary">Lendário</option>
                    </select>
                  </div>

                  <div className="lg:col-span-3 flex gap-2">
                    <select
                      value={invSortMode}
                      onChange={(e) => setInvSortMode(e.target.value as InvSortMode)}
                      className="flex-1 bg-[#1a181d] border border-[#3a3447] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
                    >
                      <option value="equipped-stats">Equipados + Mais Fortes</option>
                      <option value="stats-desc">Maior Bônus Total</option>
                      <option value="str-desc">Maior STR</option>
                      <option value="int-desc">Maior INT</option>
                      <option value="con-desc">Maior CON</option>
                      <option value="per-desc">Maior PER</option>
                      <option value="name-asc">Nome (A–Z)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#3a3447]/60">
                  <span className="text-[11px] text-[#a8a1b5]">
                    Exibindo <strong className="text-white">{visibleOwnedItems.length}</strong> de{' '}
                    <strong className="text-white">{ownedItems.length}</strong> itens filtrados
                  </span>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-[#8a8299] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setInvVisibleLimit(INV_PAGE_SIZE);
                      }}
                      placeholder="Buscar por nome ou descrição..."
                      className="w-full bg-[#1a181d] border border-[#3a3447] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
                    />
                  </div>
                </div>
              </div>

              {/* Grid de Cards Quadrados Estilo Habitica Inventory */}
              {visibleOwnedItems.length === 0 ? (
                <div className="bg-[#23202a] border border-[#3a3447] rounded-md py-10 text-center text-xs text-[#8a8299]">
                  Nenhum item encontrado com esses filtros.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {visibleOwnedItems.map((item) => {
                      const isEquipped = equipped[item.slot] === item.id;
                      const isCostume = costume[item.slot] === item.id;
                      const delta = getEquippedDelta(item);
                      const rarity = getItemRarity(item);
                      const rarityMeta = RARITY_META[rarity];
                      const hasAffinity = hasClassAffinity(item, heroClass);
                      const effStats = getItemEffectiveStats(item, heroClass);
                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col justify-between rounded-md border overflow-hidden transition ${
                            isEquipped
                              ? 'bg-[#2c2240] border-[#925cf3] shadow-md'
                              : isCostume
                                ? 'bg-[#1c2b29] border-[#24cc8f]/60'
                                : 'bg-[#23202a] border-[#3a3447] hover:border-[#6133b4]'
                          }`}
                        >
                          <div
                            className="p-3 flex flex-col items-center text-center"
                            title={item.notes}
                          >
                            <div className="relative w-20 h-20 rounded-md bg-[#1a181d] border border-[#3a3447] flex items-center justify-center mb-2">
                              <img
                                src={getEquipmentShopIconPath(item.id)}
                                alt={item.name}
                                loading="lazy"
                                className="w-16 h-16 object-contain [image-rendering:pixelated]"
                              />
                              <span className="absolute top-1 left-1 text-[9px] font-condensed font-bold uppercase px-1 rounded bg-[#271b3d] text-[#d6c7ff]">
                                {SLOT_LABEL[item.slot]}
                              </span>
                              <span
                                className={`absolute top-1 right-1 text-[8px] font-condensed font-bold uppercase px-1 rounded border ${rarityMeta.badgeClass}`}
                              >
                                {rarityMeta.label}
                              </span>
                              {hasAffinity && (
                                <span
                                  className="absolute bottom-1 left-1 text-[8px] font-condensed font-bold uppercase px-1 rounded bg-[#24cc8f]/20 text-[#24cc8f] border border-[#24cc8f]/50"
                                  title="Afinidade de Classe: +50% de atributos"
                                >
                                  +50%
                                </span>
                              )}
                              {item.twoHanded && (
                                <span className="absolute bottom-1 right-1 text-[8px] font-condensed font-bold uppercase px-1 rounded bg-rose-950/90 text-rose-300 border border-rose-500/40">
                                  2 Mãos
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-condensed font-bold text-white line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-[#ffbe5d] font-condensed mt-0.5">
                              {formatStats(effStats)}
                            </p>
                            {!isEquipped && delta !== 0 && (
                              <span
                                className={`text-[10px] font-condensed font-bold mt-0.5 ${
                                  delta > 0 ? 'text-[#24cc8f]' : 'text-[#8a8299]'
                                }`}
                              >
                                {delta > 0 ? `▲ +${delta} vs atual` : `▼ ${delta} vs atual`}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 border-t border-[#3a3447] text-[11px] font-condensed font-bold">
                            <button
                              onClick={() => onToggleEquip(item)}
                              className={`py-2 transition ${
                                isEquipped
                                  ? 'bg-[#925cf3] text-white'
                                  : 'bg-[#1a181d] hover:bg-[#36205d] text-[#d6c7ff]'
                              }`}
                            >
                              {isEquipped ? '✓ Equipado' : 'Equipar'}
                            </button>
                            <button
                              onClick={() => onToggleCostumeEquip(item)}
                              className={`py-2 border-l border-[#3a3447] transition ${
                                isCostume
                                  ? 'bg-[#24cc8f]/25 text-[#24cc8f]'
                                  : 'bg-[#1a181d] hover:bg-[#2c2836] text-[#a8a1b5]'
                              }`}
                            >
                              {isCostume ? '✓ Fantasia' : 'Fantasia'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {visibleOwnedItems.length < ownedItems.length && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setInvVisibleLimit((v) => v + INV_PAGE_SIZE)}
                        className="px-5 py-2.5 rounded-md bg-[#36205d] hover:bg-[#4f2a93] border border-[#6133b4] text-white text-xs font-condensed font-bold uppercase tracking-wider transition"
                      >
                        Carregar mais ({ownedItems.length - visibleOwnedItems.length} restantes)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Sub-aba 2: ESTÁBULO (INCUBADORA + 1.248 MASCOTES) */}
          {invTab === 'stable' && (
            <div className="space-y-5">
              {/* Incubadora Simplificada Estilo Habitica */}
              <div className="bg-[#23202a] border border-[#432874] rounded-md p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 flex items-center gap-3">
                      <img
                        src="/sprites/Pet_Egg_Wolf.png"
                        alt="Ovo"
                        className="w-12 h-12 object-contain [image-rendering:pixelated] shrink-0"
                      />
                      <div>
                        <div className="text-lg font-condensed font-bold text-white tabular-nums">
                          {stable.eggs}
                        </div>
                        <div className="text-xs font-condensed text-[#a8a1b5]">Ovos</div>
                      </div>
                    </div>

                    <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 flex items-center gap-3">
                      <img
                        src="/sprites/Pet_HatchingPotion_Base.png"
                        alt="Poção de Chocar"
                        className="w-12 h-12 object-contain [image-rendering:pixelated] shrink-0"
                      />
                      <div>
                        <div className="text-lg font-condensed font-bold text-[#925cf3] tabular-nums">
                          {stable.potions}
                        </div>
                        <div className="text-xs font-condensed text-[#a8a1b5]">Poções de Chocar</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-72">
                    <button
                      disabled={!canHatch}
                      onClick={onHatchEgg}
                      className={`w-full py-3 px-4 rounded-md font-condensed font-bold text-sm uppercase tracking-wider transition shadow-md ${
                        canHatch
                          ? 'bg-[#24cc8f] hover:brightness-110 text-[#1a181d] cursor-pointer'
                          : 'bg-[#1a181d] text-[#6e677d] border border-[#3a3447] cursor-not-allowed'
                      }`}
                    >
                      Chocar mascote (1 Ovo + 1 Poção)
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra de Filtro por Coleção, Espécie, Cor/Estilo e Especiais */}
              <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-3 space-y-2.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'owned', label: `Meus Mascotes (${ownedPetIds.length})` },
                        { id: 'all', label: `Todos (${ALL_PET_IDS.length})` },
                        { id: 'special', label: `Especiais (${specialPetsCount})` },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setPetCategoryFilter(cat.id);
                          setPetVisibleLimit(PAGE_SIZE);
                        }}
                        className={`px-2.5 py-1.5 rounded text-xs font-condensed font-bold transition cursor-pointer ${
                          petCategoryFilter === cat.id
                            ? 'bg-[#6133b4] text-white'
                            : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full lg:w-64">
                    <Search className="w-3.5 h-3.5 text-[#8a8299] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={petSearch}
                      onChange={(e) => {
                        setPetSearch(e.target.value);
                        setPetVisibleLimit(PAGE_SIZE);
                      }}
                      placeholder="Buscar mascote, cor ou espécie..."
                      className="w-full bg-[#1a181d] border border-[#3a3447] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
                    />
                  </div>
                </div>

                {/* Seletores Combináveis de Espécie e Cor/Estilo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 pt-2 border-t border-[#3a3447]/60 items-center">
                  <div className="lg:col-span-5">
                    <select
                      value={petSpeciesFilter}
                      onChange={(e) => {
                        setPetSpeciesFilter(e.target.value);
                        if (e.target.value !== 'all' && petCategoryFilter === 'owned') {
                          setPetCategoryFilter('all');
                        }
                        setPetVisibleLimit(PAGE_SIZE);
                      }}
                      className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
                    >
                      <option value="all">Espécie: Todas ({PET_SPECIES_LIST.length})</option>
                      {PET_SPECIES_LIST.map((sp) => {
                        const c = petSpeciesCounts.get(sp) ?? { owned: 0, total: 0 };
                        return (
                          <option key={sp} value={sp}>
                            {getSpeciesLabelPt(sp)} ({c.owned}/{c.total})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="lg:col-span-5">
                    <select
                      value={petPotionFilter}
                      onChange={(e) => {
                        setPetPotionFilter(e.target.value);
                        if (e.target.value !== 'all' && petCategoryFilter === 'owned') {
                          setPetCategoryFilter('all');
                        }
                        setPetVisibleLimit(PAGE_SIZE);
                      }}
                      className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
                    >
                      <option value="all">Cor: Todas ({PET_POTIONS_LIST.length})</option>
                      {PET_POTIONS_LIST.map((po) => {
                        const c = petPotionCounts.get(po) ?? { owned: 0, total: 0 };
                        return (
                          <option key={po} value={po}>
                            {getPotionLabelPt(po)} ({c.owned}/{c.total})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="lg:col-span-2 flex justify-end">
                    {(petSpeciesFilter !== 'all' ||
                      petPotionFilter !== 'all' ||
                      petSearch.trim() !== '' ||
                      petCategoryFilter !== 'owned') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPetCategoryFilter('owned');
                          setPetSpeciesFilter('all');
                          setPetPotionFilter('all');
                          setPetSearch('');
                          setPetVisibleLimit(PAGE_SIZE);
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-[#1a181d] hover:bg-[#36205d] border border-[#3a3447] text-[11px] font-condensed font-bold text-[#d6c7ff] transition cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid de Mascotes Estilo Habitica Stable */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff]">
                    Mascotes ({ownedPetIds.length} / {ALL_PET_IDS.length})
                  </h3>
                  <span className="text-[11px] text-[#a8a1b5]">
                    Exibindo {visiblePetEntries.length} de {filteredPetEntries.length}
                  </span>
                </div>
                {visiblePetEntries.length === 0 ? (
                  <div className="bg-[#23202a] border border-[#3a3447] rounded-md py-8 text-center text-xs text-[#8a8299]">
                    Você ainda não chocou nenhum mascote (ou nenhum corresponde à busca).
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                      {visiblePetEntries.map((pet) => {
                        const isOwned = stable.pets[pet.id] !== undefined;
                        const isEquipped = stable.equippedPet === pet.id;
                        return (
                          <div
                            key={pet.id}
                            className={`rounded-md border p-2.5 flex flex-col justify-between transition ${
                              isEquipped
                                ? 'bg-[#2c2240] border-[#925cf3] shadow-md'
                                : isOwned
                                  ? 'bg-[#23202a] border-[#3a3447]'
                                  : 'bg-[#1a181d]/60 border-[#2c2836] opacity-60'
                            }`}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div className="w-16 h-16 rounded bg-[#1a181d] border border-[#3a3447] flex items-center justify-center mb-1.5">
                                <img
                                  src={getPetSpritePath(pet.id)}
                                  alt={pet.name}
                                  loading="lazy"
                                  className={`w-14 h-14 object-contain [image-rendering:pixelated] ${
                                    isOwned ? '' : 'brightness-0 opacity-30'
                                  }`}
                                />
                              </div>
                              <p className="text-xs font-condensed font-bold text-white line-clamp-2">
                                {pet.name}
                              </p>

                              {!isOwned && (
                                <p className="text-[10px] text-[#6e677d] mt-1">Não descoberto</p>
                              )}
                            </div>

                            {isOwned && (
                              <div className="mt-2 pt-2 border-t border-[#3a3447] text-[10px] font-condensed font-bold">
                                <button
                                  onClick={() => onTogglePet(pet.id)}
                                  className={`w-full py-1.5 rounded transition ${
                                    isEquipped
                                      ? 'bg-[#925cf3] text-white'
                                      : 'bg-[#1a181d] hover:bg-[#36205d] text-[#d6c7ff]'
                                  }`}
                                >
                                  {isEquipped ? '✓ Ativo' : 'Equipar'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {visiblePetEntries.length < filteredPetEntries.length && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => setPetVisibleLimit((v) => v + PAGE_SIZE)}
                          className="px-5 py-2.5 rounded-md bg-[#36205d] hover:bg-[#4f2a93] border border-[#6133b4] text-white text-xs font-condensed font-bold uppercase tracking-wider transition"
                        >
                          Carregar mais ({filteredPetEntries.length - visiblePetEntries.length} restantes)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Sub-aba 3: APARÊNCIA & CENÁRIOS */}
          {invTab === 'appearance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Coluna Esquerda: Palco Preview Ao Vivo (Fixo ao rolar) */}
              <div className="lg:col-span-4 bg-[#23202a] border border-[#3a3447] rounded-md p-5 flex flex-col items-center text-center h-fit lg:sticky lg:top-4">
                <CharacterAvatar
                  appearance={appearance}
                  equipped={equipped}
                  costume={costume}
                  useCostume={useCostume}
                  petId={stable.equippedPet}
                  size="stage"
                  className="border-2 border-[#925cf3] shadow-2xl"
                />
              </div>

              {/* Coluna Direita: Seletores Visuais Completos do Habitica */}
              <div className="lg:col-span-8 bg-[#23202a] border border-[#3a3447] rounded-md p-4 space-y-6 text-xs sm:text-sm">
                {/* 1. Fundos de Cenário (404 Cenários + Sem Fundo) */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff]">
                      Fundos de Cenário ({filteredBackgrounds.length} de {BACKGROUND_OPTIONS.length})
                    </p>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-[#8a8299] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={bgSearch}
                        onChange={(e) => {
                          setBgSearch(e.target.value);
                          setBgVisibleLimit(24);
                        }}
                        placeholder="Buscar cenário (ex: Praia, Castelo)..."
                        className="w-full bg-[#1a181d] border border-[#3a3447] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {visibleBackgrounds.map((bg) => {
                      const active = (appearance.background ?? 'none') === bg.id;
                      return (
                        <button
                          key={bg.id}
                          title={bg.notes || bg.label}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, background: bg.id })
                          }
                          className={`p-1.5 rounded-md border text-left transition flex items-center gap-2 ${
                            active
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                          }`}
                        >
                          <div className="w-9 h-9 rounded overflow-hidden bg-[#271b3d] border border-[#432874] shrink-0">
                            {bg.id !== 'none' && (
                              <img
                                src={getAppearanceSpritePath(`background_${bg.id}.png`)}
                                alt={bg.label}
                                loading="lazy"
                                className="w-full h-full object-cover [image-rendering:pixelated]"
                              />
                            )}
                          </div>
                          <span className="text-xs font-condensed font-bold truncate">
                            {bg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {visibleBackgrounds.length < filteredBackgrounds.length && (
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={() => setBgVisibleLimit((v) => v + 24)}
                        className="px-4 py-1.5 rounded bg-[#36205d] hover:bg-[#4f2a93] border border-[#6133b4] text-white text-xs font-condensed font-bold uppercase tracking-wider transition"
                      >
                        Carregar mais cenários ({filteredBackgrounds.length - visibleBackgrounds.length} restantes)
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Peles (62 Peles com filtro por coleção) */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff]">
                      Cor e Textura de Pele ({SKIN_OPTIONS.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(
                        [
                          { id: 'all', label: 'Todas (62)' },
                          { id: 'padrao', label: 'Padrão' },
                          { id: 'arcoiris', label: 'Arco-Íris' },
                          { id: 'pastel', label: 'Pastel' },
                          { id: 'animais', label: 'Animais' },
                          { id: 'sobrenatural', label: 'Sobrenatural' },
                          { id: 'aquatica', label: 'Aquática' },
                          { id: 'inverno', label: 'Inverno' },
                        ] as const
                      ).map((grp) => (
                        <button
                          key={grp.id}
                          onClick={() => setSkinGroupFilter(grp.id)}
                          className={`px-2 py-1 rounded text-[11px] font-condensed font-bold transition ${
                            skinGroupFilter === grp.id
                              ? 'bg-[#6133b4] text-white'
                              : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                          }`}
                        >
                          {grp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredSkins.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onChangeAppearance({ ...appearance, skin: s.id })}
                        className={`px-2.5 py-1.5 rounded-md border flex items-center gap-2 text-xs font-condensed font-bold transition ${
                          appearance.skin === s.id
                            ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                            : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/25 shrink-0"
                          style={{ backgroundColor: s.hex }}
                        />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Corpo & 17 Camisas */}
                <div className="space-y-4">
                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Tipo de Corpo
                    </p>
                    <div className="flex gap-2 max-w-sm">
                      {[
                        { id: 'broad', label: 'Largo (Broad)' },
                        { id: 'slim', label: 'Fino (Slim)' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          onClick={() =>
                            onChangeAppearance({
                              ...appearance,
                              bodySize: b.id as CharacterAppearance['bodySize'],
                            })
                          }
                          className={`flex-1 py-2 rounded-md border text-xs font-condensed font-bold ${
                            appearance.bodySize === b.id
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5]'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Camisa ({SHIRT_OPTIONS.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SHIRT_OPTIONS.map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, shirt: sh.id })
                          }
                          className={`px-2.5 py-1.5 rounded-md border text-xs font-condensed font-bold transition ${
                            appearance.shirt === sh.id
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                          }`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Base de Cabelo (21), Franja (5) e Cor do Cabelo (45) */}
                <div className="space-y-4">
                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Base de Cabelo ({HAIR_BASE_OPTIONS.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {HAIR_BASE_OPTIONS.map((hb) => (
                        <button
                          key={hb.id}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, hairStyle: hb.id })
                          }
                          className={`px-2.5 py-1.5 rounded-md border text-xs font-condensed font-bold transition ${
                            appearance.hairStyle === hb.id
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                          }`}
                        >
                          {hb.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Franja ({HAIR_BANGS_OPTIONS.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {HAIR_BANGS_OPTIONS.map((fb) => (
                        <button
                          key={fb.id}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, hairBangs: fb.id })
                          }
                          className={`px-3 py-1.5 rounded-md border text-xs font-condensed font-bold transition ${
                            appearance.hairBangs === fb.id
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                          }`}
                        >
                          {fb.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Cor do Cabelo / Barba ({HAIR_COLORS.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {HAIR_COLORS.map((hc) => (
                        <button
                          key={hc.id}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, hairColor: hc.id })
                          }
                          title={hc.label}
                          className={`px-2 py-1 rounded-md border flex items-center gap-1.5 text-[11px] font-condensed font-bold transition ${
                            appearance.hairColor === hc.id
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/25 shrink-0"
                            style={{ backgroundColor: hc.hex }}
                          />
                          <span>{hc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Flores de Cabelo & Brincos (17) */}
                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Flores de Cabelo & Brincos ({HAIR_FLOWER_OPTIONS.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {HAIR_FLOWER_OPTIONS.map((fl) => (
                        <button
                          key={fl.id}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, hairFlower: fl.id })
                          }
                          className={`px-2.5 py-1.5 rounded-md border text-xs font-condensed font-bold transition ${
                            (appearance.hairFlower ?? 0) === fl.id
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                          }`}
                        >
                          {fl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Barba e Bigode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Barba
                    </p>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map((n) => (
                        <button
                          key={n}
                          onClick={() => onChangeAppearance({ ...appearance, hairBeard: n })}
                          className={`flex-1 py-1.5 rounded border text-xs font-condensed font-bold ${
                            (appearance.hairBeard ?? 0) === n
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5]'
                          }`}
                        >
                          {n === 0 ? 'Sem Barba' : `Estilo ${n}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Bigode
                    </p>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((n) => (
                        <button
                          key={n}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, hairMustache: n })
                          }
                          className={`flex-1 py-1.5 rounded border text-xs font-condensed font-bold ${
                            (appearance.hairMustache ?? 0) === n
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5]'
                          }`}
                        >
                          {n === 0 ? 'Sem Bigode' : `Estilo ${n}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODO 2: LOJAS DE PÁGINA INTEIRA ESTILO MERCADO DO HABITICA        */}
      {/* ================================================================= */}
      {mode === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Coluna Lateral Esquerda: Filtros do Mercado + Venda Rápida */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff]">
                  Seu Ouro
                </span>
                <span className="flex items-center gap-1 text-base font-condensed font-bold text-[#ffbe5d]">
                  <Coins className="w-4 h-4" />
                  {gold} GP
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8a8299] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar na loja..."
                  className="w-full bg-[#1a181d] border border-[#3a3447] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
                />
              </div>

              <div>
                <p className="text-[11px] font-condensed font-bold uppercase tracking-wider text-[#a8a1b5] mb-1.5">
                  Coleção do Habitica
                </p>
                <div className="flex flex-col gap-1">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategoryFilter(cat.id);
                        setVisibleLimit(PAGE_SIZE);
                      }}
                      className={`px-3 py-1.5 rounded text-left text-xs font-condensed font-bold transition ${
                        categoryFilter === cat.id
                          ? 'bg-[#6133b4] text-white'
                          : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {categoryFilter === 'seasonal' && (
                <div>
                  <p className="text-[11px] font-condensed font-bold uppercase tracking-wider text-[#a8a1b5] mb-1.5">
                    Estação (Grande Gala)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {SEASON_OPTIONS.map((se) => (
                      <button
                        key={se.id}
                        onClick={() => {
                          setSeasonFilter(se.id);
                          setVisibleLimit(PAGE_SIZE);
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-condensed font-bold ${
                          seasonFilter === se.id
                            ? 'bg-[#6133b4] text-white'
                            : 'bg-[#1a181d] text-[#a8a1b5]'
                        }`}
                      >
                        {se.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-condensed font-bold uppercase tracking-wider text-[#a8a1b5] mb-1.5">
                  Filtro de Utilidade
                </p>
                <div className="flex flex-col gap-1">
                  {(
                    [
                      { id: 'all', label: 'Todos Disponíveis' },
                      { id: 'upgrades', label: 'Upgrades' },
                      { id: 'with-stats', label: 'Com atributos' },
                      { id: 'cosmetic', label: 'Visuais' },
                    ] as const
                  ).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setShopUtilityFilter(u.id);
                        setVisibleLimit(PAGE_SIZE);
                      }}
                      className={`px-3 py-1.5 rounded text-left text-xs font-condensed font-bold transition ${
                        shopUtilityFilter === u.id
                          ? 'bg-[#24cc8f]/20 border border-[#24cc8f]/60 text-[#24cc8f]'
                          : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-condensed font-bold uppercase tracking-wider text-[#a8a1b5] mb-1.5">
                  Foco de Atributo
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {(
                    [
                      { id: 'all', label: 'Todos' },
                      { id: 'str', label: 'STR' },
                      { id: 'int', label: 'INT' },
                      { id: 'con', label: 'CON' },
                      { id: 'per', label: 'PER' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setShopStatFocus(st.id);
                        setVisibleLimit(PAGE_SIZE);
                      }}
                      className={`py-1 rounded text-[11px] font-condensed font-bold transition ${
                        shopStatFocus === st.id
                          ? 'bg-[#6133b4] text-white'
                          : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-condensed font-bold uppercase tracking-wider text-[#a8a1b5] mb-1.5">
                  Filtrar por Slot
                </p>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => {
                      setSlotFilter('all');
                      setVisibleLimit(PAGE_SIZE);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-condensed font-bold ${
                      slotFilter === 'all'
                        ? 'bg-[#6133b4] text-white'
                        : 'bg-[#1a181d] text-[#a8a1b5]'
                    }`}
                  >
                    Todos
                  </button>
                  {ALL_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSlotFilter(slot);
                        setVisibleLimit(PAGE_SIZE);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-condensed font-bold ${
                        slotFilter === slot
                          ? 'bg-[#6133b4] text-white'
                          : 'bg-[#1a181d] text-[#a8a1b5]'
                      }`}
                    >
                      {SLOT_LABEL[slot]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-condensed font-bold uppercase tracking-wider text-[#a8a1b5] mb-1.5">
                  Raridade
                </p>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      { id: 'all', label: 'Todas' },
                      { id: 'common', label: 'Comum' },
                      { id: 'uncommon', label: 'Incomum' },
                      { id: 'rare', label: 'Raro' },
                      { id: 'epic', label: 'Épico' },
                      { id: 'legendary', label: 'Lendário' },
                    ] as const
                  ).map((rar) => (
                    <button
                      key={rar.id}
                      onClick={() => {
                        setShopRarityFilter(rar.id);
                        setVisibleLimit(PAGE_SIZE);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-condensed font-bold ${
                        shopRarityFilter === rar.id
                          ? 'bg-[#6133b4] text-white'
                          : 'bg-[#1a181d] text-[#a8a1b5]'
                      }`}
                    >
                      {rar.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-condensed font-bold uppercase tracking-wider text-[#a8a1b5] mb-1.5">
                  Ordenar por
                </p>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as ShopSortMode)}
                  className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
                >
                  <option value="stats-desc">Maior Bônus Total</option>
                  <option value="str-desc">Maior STR</option>
                  <option value="int-desc">Maior INT</option>
                  <option value="con-desc">Maior CON</option>
                  <option value="per-desc">Maior PER</option>
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                  <option value="name-asc">Nome (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Venda de Ovos/Poções Excedentes */}
            <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-4 space-y-2">
              <p className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff]">
                Mercado de Trocas (+5 GP)
              </p>
              <button
                disabled={stable.eggs <= 0}
                onClick={onSellEgg}
                className="w-full py-1.5 px-3 rounded bg-[#1a181d] hover:bg-[#2c2836] border border-[#3a3447] disabled:opacity-40 text-xs flex items-center justify-between"
              >
                <span>Vender 1 Ovo ({stable.eggs})</span>
                <span className="text-[#ffbe5d] font-bold">+5 GP</span>
              </button>
              <button
                disabled={stable.potions <= 0}
                onClick={onSellPotion}
                className="w-full py-1.5 px-3 rounded bg-[#1a181d] hover:bg-[#2c2836] border border-[#3a3447] disabled:opacity-40 text-xs flex items-center justify-between"
              >
                <span>Vender 1 Poção ({stable.potions})</span>
                <span className="text-[#ffbe5d] font-bold">+5 GP</span>
              </button>
            </div>
          </aside>

          {/* Coluna Principal Direita: Destaques + Grid de Equipamentos estilo Habitica Shop */}
          <div className="lg:col-span-9 space-y-5">
            {/* Destaques Fixos do Mercado (Tônico, Elixir de Mana, Poção de Chocar, Armoire) */}
            <div>
              <h3 className="text-xs font-condensed font-bold text-[#d6c7ff] mb-2.5">
                Consumíveis e Armoire
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {/* 1. Tônico de Estamina */}
                <div className="bg-[#23202a] border border-[#3a3447] rounded-md flex flex-col justify-between overflow-hidden">
                  <div className="p-3 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded bg-[#1a181d] border border-[#3a3447] flex items-center justify-center mb-2">
                      <img
                        src="/sprites/shop_potion.png"
                        alt="Tônico de Estamina"
                        className="w-12 h-12 object-contain [image-rendering:pixelated]"
                      />
                    </div>
                    <p className="text-xs font-condensed font-bold text-white">
                      Tônico de Estamina
                    </p>
                    <p className="text-[11px] text-[#24cc8f] mt-0.5">+30 STA ({hp}/{maxHp})</p>
                  </div>
                  <button
                    disabled={gold < 15 || hp >= maxHp}
                    onClick={onBuyPotion}
                    className="w-full py-2 bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:bg-[#1a181d] disabled:text-[#6e677d] text-[#ffbe5d] border-t border-[#3a3447] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    15 GP
                  </button>
                </div>

                {/* 2. Elixir de Mana */}
                <div className="bg-[#23202a] border border-[#50b5e9]/40 rounded-md flex flex-col justify-between overflow-hidden">
                  <div className="p-3 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded bg-[#1a181d] border border-[#50b5e9]/40 flex items-center justify-center mb-2">
                      <Zap className="w-9 h-9 text-[#50b5e9] fill-[#50b5e9]/30" />
                    </div>
                    <p className="text-xs font-condensed font-bold text-white">
                      Elixir de Mana
                    </p>
                    <p className="text-[11px] text-[#50b5e9] mt-0.5">+25 MP ({mp}/{maxMp})</p>
                  </div>
                  <button
                    disabled={gold < 15 || mp >= maxMp}
                    onClick={onBuyManaPotion}
                    className="w-full py-2 bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:bg-[#1a181d] disabled:text-[#6e677d] text-[#ffbe5d] border-t border-[#3a3447] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    15 GP
                  </button>
                </div>

                {/* 3. Poção de Chocar */}
                <div className="bg-[#23202a] border border-[#3a3447] rounded-md flex flex-col justify-between overflow-hidden">
                  <div className="p-3 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded bg-[#1a181d] border border-[#3a3447] flex items-center justify-center mb-2">
                      <img
                        src="/sprites/Pet_HatchingPotion_Base.png"
                        alt="Poção de Chocar"
                        className="w-12 h-12 object-contain [image-rendering:pixelated]"
                      />
                    </div>
                    <p className="text-xs font-condensed font-bold text-white">Poção de Chocar</p>
                    <p className="text-[11px] text-[#a8a1b5] mt-0.5">
                      Você tem: {stable.potions}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 border-t border-[#3a3447]">
                    <button
                      disabled={gold < 25}
                      onClick={() => onBuyHatchPotion(1)}
                      className="py-2 bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:bg-[#1a181d] disabled:text-[#6e677d] text-[#ffbe5d] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <Coins className="w-3 h-3" />
                      1x (25)
                    </button>
                    <button
                      disabled={gold < 250}
                      onClick={() => onBuyHatchPotion(10)}
                      className="py-2 border-l border-[#3a3447] bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:bg-[#1a181d] disabled:text-[#6e677d] text-[#ffbe5d] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      10x (250)
                    </button>
                  </div>
                </div>

                {/* 4. Armoire Encantado */}
                <div className="bg-[#23202a] border border-[#925cf3]/50 rounded-md flex flex-col justify-between overflow-hidden">
                  <div className="p-3 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded bg-[#271b3d] border border-[#6133b4] flex items-center justify-center mb-2">
                      <img
                        src="/sprites/shop_armoire.png"
                        alt="Armoire Encantado"
                        className="w-12 h-12 object-contain [image-rendering:pixelated]"
                      />
                    </div>
                    <p className="text-xs font-condensed font-bold text-white">Armoire Encantado</p>
                    <p className="text-[11px] text-[#d6c7ff] mt-0.5">
                      Sorteia Equipamentos (por Raridade), Ovo ou Poção!
                    </p>
                  </div>
                  <div className="grid grid-cols-2 border-t border-[#3a3447]">
                    <button
                      disabled={gold < 40}
                      onClick={() => onBuyArmoire(1)}
                      className="py-2 bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:bg-[#1a181d] disabled:text-[#6e677d] text-[#ffbe5d] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      <Coins className="w-3 h-3" />
                      1x (40)
                    </button>
                    <button
                      disabled={gold < 400}
                      onClick={() => onBuyArmoire(10)}
                      className="py-2 border-l border-[#3a3447] bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:bg-[#1a181d] disabled:text-[#6e677d] text-[#ffbe5d] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                      10x (400)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grade de Equipamentos e Cosméticos à Venda */}
            <div>
              <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-3 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff]">
                    Equipamentos & Cosméticos Disponíveis ({filteredShopItems.length})
                  </h3>
                  <span className="text-[11px] text-[#a8a1b5]">
                    Exibindo {visibleShopItems.length} de {filteredShopItems.length}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#1a181d] border border-[#3a3447] rounded p-0.5 text-[11px] font-condensed font-bold">
                    <span className="px-1.5 text-[#a8a1b5]">Ao comprar:</span>
                    {(
                      [
                        { id: 'bag', label: 'Guardar' },
                        { id: 'equip', label: 'Equipar Batalha' },
                        { id: 'costume', label: 'Fantasia' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setAfterBuyMode(m.id)}
                        className={`px-2 py-1 rounded transition ${
                          afterBuyMode === m.id
                            ? 'bg-[#6133b4] text-white'
                            : 'text-[#a8a1b5] hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {visibleShopItems.length > 0 && (
                    <button
                      disabled={gold < visibleShopTotalCost}
                      onClick={() => onBuyBatchItems(visibleShopItems)}
                      className="px-3 py-1.5 rounded bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:opacity-40 border border-[#ffbe5d]/50 text-[#ffbe5d] text-[11px] font-condensed font-bold flex items-center gap-1 transition"
                      title="Compra todos os itens visíveis nesta página e guarda na mochila"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      Comprar Página ({visibleShopItems.length} · {visibleShopTotalCost} GP)
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visibleShopItems.map((item) => {
                  const canAfford = gold >= item.price;
                  const delta = getEquippedDelta(item);
                  const rarity = getItemRarity(item);
                  const rarityMeta = RARITY_META[rarity];
                  const hasAffinity = hasClassAffinity(item, heroClass);
                  const effStats = getItemEffectiveStats(item, heroClass);
                  return (
                    <div
                      key={item.id}
                      title={item.notes}
                      className="bg-[#23202a] border border-[#3a3447] hover:border-[#6133b4] rounded-md flex flex-col justify-between overflow-hidden transition"
                    >
                      <div className="p-3 flex flex-col items-center text-center">
                        <div className="relative w-20 h-20 rounded bg-[#1a181d] border border-[#3a3447] flex items-center justify-center mb-2">
                          <img
                            src={getEquipmentShopIconPath(item.id)}
                            alt={item.name}
                            loading="lazy"
                            className="w-16 h-16 object-contain [image-rendering:pixelated]"
                          />
                          <span className="absolute top-1 left-1 text-[8px] font-condensed font-bold uppercase px-1 rounded bg-[#271b3d] text-[#d6c7ff]">
                            {CLASS_LABEL[item.heroClass]}
                          </span>
                          <span
                            className={`absolute top-1 right-1 text-[8px] font-condensed font-bold uppercase px-1 rounded border ${rarityMeta.badgeClass}`}
                          >
                            {rarityMeta.label}
                          </span>
                          {hasAffinity && (
                            <span
                              className="absolute bottom-1 left-1 text-[8px] font-condensed font-bold uppercase px-1 rounded bg-[#24cc8f]/20 text-[#24cc8f] border border-[#24cc8f]/50"
                              title="Afinidade de Classe: +50% de atributos"
                            >
                              +50%
                            </span>
                          )}
                          {item.twoHanded && (
                            <span className="absolute bottom-1 right-1 text-[8px] font-condensed font-bold uppercase px-1 rounded bg-rose-950/90 text-rose-300 border border-rose-500/40">
                              2 Mãos
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-condensed font-bold text-white line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#24cc8f] font-condensed mt-0.5">
                          {formatStats(effStats)}
                        </p>
                        {delta !== 0 && (
                          <span
                            className={`text-[10px] font-condensed font-bold mt-0.5 ${
                              delta > 0 ? 'text-[#24cc8f]' : 'text-[#8a8299]'
                            }`}
                          >
                            {delta > 0 ? `▲ +${delta} vs atual` : `▼ ${delta} vs atual`}
                          </span>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-[#8a8299] line-clamp-2 mt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyItem(item, afterBuyMode)}
                        className={`w-full py-2 border-t border-[#3a3447] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition ${
                          canAfford
                            ? 'bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/35 text-[#ffbe5d] cursor-pointer'
                            : 'bg-[#1a181d] text-[#6e677d] cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{item.price} GP</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {visibleShopItems.length < filteredShopItems.length && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
                    className="px-5 py-2.5 rounded-md bg-[#36205d] hover:bg-[#4f2a93] border border-[#6133b4] text-white text-xs font-condensed font-bold uppercase tracking-wider transition"
                  >
                    Carregar mais ({filteredShopItems.length - visibleShopItems.length} restantes)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
