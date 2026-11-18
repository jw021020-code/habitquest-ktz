'use client';

import React, { useState } from 'react';
import {
  Coins,
  Eye,
  Search,
  Shield,
  Sparkles,
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
  getEquipmentById,
  getEquipmentShopIconPath,
  HAIR_COLORS,
  HeroClass,
  SHIRT_OPTIONS,
  SKIN_OPTIONS,
} from '@/lib/game/items';
import {
  ALL_PET_IDS,
  formatPetName,
  getPetSpritePath,
  PET_CATALOG,
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
  appearance: CharacterAppearance;
  equipped: EquippedGear;
  costume: EquippedGear;
  useCostume: boolean;
  inventory: string[];
  stable: StableState;
  totalAttributes: Attributes;
  onChangeAppearance: (next: CharacterAppearance) => void;
  onBuyItem: (item: EquipmentItem) => void;
  onBuyPotion: () => void;
  onBuyArmoire: () => void;
  onBuyHatchPotion: () => void;
  onSellEgg: () => void;
  onSellPotion: () => void;
  onToggleEquip: (item: EquipmentItem) => void;
  onToggleCostumeEquip: (item: EquipmentItem) => void;
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
  warrior: 'Guerreiro',
  wizard: 'Mago',
  rogue: 'Ladino',
  healer: 'Curandeiro',
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

type ShopSortMode = 'price-asc' | 'price-desc' | 'stats-desc' | 'name-asc';
const PAGE_SIZE = 48;

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
  appearance,
  equipped,
  costume,
  useCostume,
  inventory,
  stable,
  totalAttributes,
  onChangeAppearance,
  onBuyItem,
  onBuyPotion,
  onBuyArmoire,
  onBuyHatchPotion,
  onSellEgg,
  onSellPotion,
  onToggleEquip,
  onToggleCostumeEquip,
  onToggleUseCostume,
  onHatchEgg,
  onTogglePet,
}: EquipmentPanelProps) {
  const [slotFilter, setSlotFilter] = useState<EquipmentSlot | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<GearCategory | 'all'>('all');
  const [seasonFilter, setSeasonFilter] = useState<GearSeason | 'all'>('all');
  const [sortMode, setSortMode] = useState<ShopSortMode>('price-asc');
  const [visibleLimit, setVisibleLimit] = useState<number>(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [petCategoryFilter, setPetCategoryFilter] = useState<'owned' | 'all' | PetCategory>('owned');
  const [petVisibleLimit, setPetVisibleLimit] = useState<number>(PAGE_SIZE);
  const [petSearch, setPetSearch] = useState('');

  if (!mode) return null;

  const q = searchQuery.trim().toLowerCase();

  const ownedItems = EQUIPMENT_CATALOG.filter(
    (item) =>
      inventory.includes(item.id) &&
      (slotFilter === 'all' || item.slot === slotFilter) &&
      (!q || item.name.toLowerCase().includes(q) || (item.notes ?? '').toLowerCase().includes(q))
  );

  const filteredShopItems = EQUIPMENT_CATALOG.filter(
    (item) =>
      !inventory.includes(item.id) &&
      (shopFilter === 'all' || item.heroClass === shopFilter) &&
      (slotFilter === 'all' || item.slot === slotFilter) &&
      (categoryFilter === 'all' || item.category === categoryFilter) &&
      (categoryFilter !== 'seasonal' || seasonFilter === 'all' || item.season === seasonFilter) &&
      (!q || item.name.toLowerCase().includes(q) || (item.notes ?? '').toLowerCase().includes(q))
  ).sort((a, b) => {
    if (sortMode === 'price-asc') return a.price - b.price || a.name.localeCompare(b.name);
    if (sortMode === 'price-desc') return b.price - a.price || a.name.localeCompare(b.name);
    if (sortMode === 'stats-desc') {
      const sa = a.stats.str + a.stats.int + a.stats.con + a.stats.per;
      const sb = b.stats.str + b.stats.int + b.stats.con + b.stats.per;
      return sb - sa || a.price - b.price;
    }
    return a.name.localeCompare(b.name);
  });

  const visibleShopItems = filteredShopItems.slice(0, visibleLimit);

  const ownedPetIds = Object.keys(stable.pets);
  const canHatch =
    stable.eggs > 0 && stable.potions > 0 && ownedPetIds.length < ALL_PET_IDS.length;

  const petQuery = petSearch.trim().toLowerCase();
  const filteredPetEntries = PET_CATALOG.filter((pet) => {
    const isOwned = stable.pets[pet.id] !== undefined;
    if (petCategoryFilter === 'owned' && !isOwned) return false;
    if (petCategoryFilter !== 'owned' && petCategoryFilter !== 'all' && pet.category !== petCategoryFilter) {
      return false;
    }
    if (petQuery && !pet.name.toLowerCase().includes(petQuery) && !pet.id.toLowerCase().includes(petQuery)) {
      return false;
    }
    return true;
  });
  const visiblePetEntries = filteredPetEntries.slice(0, petVisibleLimit);

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
              {/* Manequim Duplo: Equipamento de Batalha vs Fantasia (Costume) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Card Equipamento de Batalha */}
                <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
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
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {ALL_SLOTS.map((slot) => {
                      const eq = getEquipmentById(equipped[slot]);
                      return (
                        <div
                          key={slot}
                          className="bg-[#1a181d] border border-[#3a3447] rounded-md p-2 flex flex-col items-center text-center"
                        >
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

                {/* Card Fantasia (Costume) */}
                <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-4">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div>
                      <h3 className="font-condensed font-bold text-sm uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[#24cc8f]" />
                        Fantasia (Apenas Visual)
                      </h3>
                      <p className="text-[11px] text-[#a8a1b5]">
                        Exibe outro visual no avatar mantendo os atributos de batalha.
                      </p>
                    </div>
                    <button
                      onClick={onToggleUseCostume}
                      className={`px-3 py-1.5 rounded text-xs font-condensed font-bold uppercase border transition shrink-0 ${
                        useCostume
                          ? 'bg-[#24cc8f]/20 border-[#24cc8f] text-[#24cc8f]'
                          : 'bg-[#1a181d] border-[#3a3447] text-[#a8a1b5] hover:text-white'
                      }`}
                    >
                      {useCostume ? '✓ Fantasia Ativa' : 'Ativar Fantasia'}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {ALL_SLOTS.map((slot) => {
                      const eq = getEquipmentById(costume[slot]);
                      return (
                        <div
                          key={slot}
                          className={`bg-[#1a181d] border rounded-md p-2 flex flex-col items-center text-center ${
                            useCostume ? 'border-[#24cc8f]/40' : 'border-[#3a3447] opacity-65'
                          }`}
                        >
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

              {/* Barra de Busca e Filtro por Slot */}
              <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSlotFilter('all')}
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
                      onClick={() => setSlotFilter(slot)}
                      className={`px-2.5 py-1 rounded text-xs font-condensed font-bold transition ${
                        slotFilter === slot
                          ? 'bg-[#6133b4] text-white'
                          : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                      }`}
                    >
                      {SLOT_LABEL[slot]}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 text-[#8a8299] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar item no inventário..."
                    className="w-full bg-[#1a181d] border border-[#3a3447] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
                  />
                </div>
              </div>

              {/* Grid de Cards Quadrados Estilo Habitica Inventory */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {ownedItems.map((item) => {
                  const isEquipped = equipped[item.slot] === item.id;
                  const isCostume = costume[item.slot] === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col justify-between rounded-md border overflow-hidden transition ${
                        isEquipped
                          ? 'bg-[#2c2240] border-[#925cf3] shadow-md'
                          : 'bg-[#23202a] border-[#3a3447] hover:border-[#6133b4]'
                      }`}
                    >
                      <div className="p-3 flex flex-col items-center text-center" title={item.notes}>
                        <div className="relative w-20 h-20 rounded-md bg-[#1a181d] border border-[#3a3447] flex items-center justify-center mb-2">
                          <img
                            src={getEquipmentShopIconPath(item.id)}
                            alt={item.name}
                            className="w-16 h-16 object-contain [image-rendering:pixelated]"
                          />
                          <span className="absolute top-1 left-1 text-[9px] font-condensed font-bold uppercase px-1 rounded bg-[#271b3d] text-[#d6c7ff]">
                            {SLOT_LABEL[item.slot]}
                          </span>
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
                          {formatStats(item.stats)}
                        </p>
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
                          {isEquipped ? 'Equipado' : 'Equipar'}
                        </button>
                        <button
                          onClick={() => onToggleCostumeEquip(item)}
                          className={`py-2 border-l border-[#3a3447] transition ${
                            isCostume
                              ? 'bg-[#24cc8f]/25 text-[#24cc8f]'
                              : 'bg-[#1a181d] hover:bg-[#2c2836] text-[#a8a1b5]'
                          }`}
                        >
                          {isCostume ? 'Na Fantasia' : 'Fantasia'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                      🐣 Chocar Mascote Aleatório (1 Ovo + 1 Poção)
                    </button>
                    <button
                      onClick={() => {
                        onChangeShopFilter('all');
                      }}
                      className="text-[11px] text-[#d6c7ff] hover:text-[#ffbe5d] text-center"
                    >
                      Precisa de Poção de Chocar? Compre na aba Lojas!
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra de Filtro por Categoria e Busca do Estábulo */}
              <div className="bg-[#23202a] border border-[#3a3447] rounded-md p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'owned', label: `Meus Mascotes (${ownedPetIds.length})` },
                      { id: 'all', label: `Todos (${ALL_PET_IDS.length})` },
                      { id: 'drop', label: 'Básicos (90)' },
                      { id: 'quest', label: 'Missão (610)' },
                      { id: 'premium', label: 'Mágicos (459)' },
                      { id: 'wacky', label: 'Malucos (63)' },
                      { id: 'special', label: 'Especiais (26)' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setPetCategoryFilter(cat.id);
                        setPetVisibleLimit(PAGE_SIZE);
                      }}
                      className={`px-2.5 py-1.5 rounded text-xs font-condensed font-bold transition ${
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
              {/* Coluna Esquerda: Palco Preview Ao Vivo */}
              <div className="lg:col-span-4 bg-[#23202a] border border-[#3a3447] rounded-md p-5 flex flex-col items-center text-center h-fit">
                <span className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-3">
                  Preview do Palco Habitica
                </span>
                <CharacterAvatar
                  appearance={appearance}
                  equipped={equipped}
                  costume={costume}
                  useCostume={useCostume}
                  petId={stable.equippedPet}
                  size="stage"
                  className="border-2 border-[#925cf3] shadow-2xl mb-3"
                />
                <p className="text-xs text-[#a8a1b5]">
                  Todas as alterações de aparência e fundo de cenário são salvas automaticamente.
                </p>
              </div>

              {/* Coluna Direita: Seletores Visuais estilo Habitica */}
              <div className="lg:col-span-8 bg-[#23202a] border border-[#3a3447] rounded-md p-4 space-y-5 text-xs sm:text-sm">
                {/* 1. Fundos de Cenário com Miniaturas Reais */}
                <div>
                  <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                    Fundo de Cenário (Backgrounds do Habitica)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2">
                    {BACKGROUND_OPTIONS.map((bg) => {
                      const active = (appearance.background ?? 'none') === bg.id;
                      return (
                        <button
                          key={bg.id}
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
                                src={`/sprites/background_${bg.id}.png`}
                                alt={bg.label}
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
                </div>

                {/* 2. Pele */}
                <div>
                  <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                    Cor da Pele
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_OPTIONS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onChangeAppearance({ ...appearance, skin: s.id })}
                        className={`px-3 py-1.5 rounded-md border flex items-center gap-2 font-condensed font-bold ${
                          appearance.skin === s.id
                            ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                            : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/25"
                          style={{ backgroundColor: s.hex }}
                        />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Corpo & Camisa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Tipo de Corpo
                    </p>
                    <div className="flex gap-2">
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
                          className={`flex-1 py-2 rounded-md border font-condensed font-bold ${
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
                      Camisa
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SHIRT_OPTIONS.map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, shirt: sh.id })
                          }
                          className={`px-2.5 py-1.5 rounded-md border text-xs font-condensed font-bold ${
                            appearance.shirt === sh.id
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5]'
                          }`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Cabelo, Franja e Cor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Base de Cabelo
                    </p>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => onChangeAppearance({ ...appearance, hairStyle: n })}
                          className={`flex-1 py-1.5 rounded border font-condensed font-bold ${
                            appearance.hairStyle === n
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5]'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Franja
                    </p>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          onClick={() => onChangeAppearance({ ...appearance, hairBangs: n })}
                          className={`flex-1 py-1.5 rounded border font-condensed font-bold ${
                            appearance.hairBangs === n
                              ? 'border-[#925cf3] bg-[#36205d]/70 text-white'
                              : 'border-[#3a3447] bg-[#1a181d] text-[#a8a1b5]'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                      Cor do Cabelo / Barba
                    </p>
                    <div className="flex gap-1.5">
                      {HAIR_COLORS.map((hc) => (
                        <button
                          key={hc.id}
                          onClick={() =>
                            onChangeAppearance({ ...appearance, hairColor: hc.id })
                          }
                          title={hc.label}
                          className={`w-8 h-8 rounded-md border flex items-center justify-center ${
                            appearance.hairColor === hc.id
                              ? 'border-[#925cf3] ring-2 ring-[#925cf3]/40'
                              : 'border-[#3a3447]'
                          }`}
                          style={{ backgroundColor: hc.hex }}
                        >
                          {appearance.hairColor === hc.id && (
                            <Sparkles className="w-3.5 h-3.5 text-[#925cf3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Barba e Bigode */}
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
                          className={`flex-1 py-1.5 rounded border font-condensed font-bold ${
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
                          className={`flex-1 py-1.5 rounded border font-condensed font-bold ${
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
                  Categoria de Classe
                </p>
                <div className="flex flex-col gap-1">
                  {(['all', 'warrior', 'wizard', 'rogue', 'healer', 'cosmetic'] as const).map(
                    (cls) => (
                      <button
                        key={cls}
                        onClick={() => {
                          onChangeShopFilter(cls);
                          setVisibleLimit(PAGE_SIZE);
                        }}
                        className={`px-3 py-1.5 rounded text-left text-xs font-condensed font-bold transition ${
                          shopFilter === cls
                            ? 'bg-[#6133b4] text-white'
                            : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                        }`}
                      >
                        {CLASS_LABEL[cls]}
                      </button>
                    )
                  )}
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
                  Ordenar por
                </p>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as ShopSortMode)}
                  className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
                >
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                  <option value="stats-desc">Maior Bônus de Atributos</option>
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
            {/* Destaques Fixos do Mercado (Tônico, Poção de Chocar, Armoire) */}
            <div>
              <h3 className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2.5">
                Itens Essenciais & Baú Encantado
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                {/* 2. Poção de Chocar */}
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
                  <button
                    disabled={gold < 25}
                    onClick={onBuyHatchPotion}
                    className="w-full py-2 bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:bg-[#1a181d] disabled:text-[#6e677d] text-[#ffbe5d] border-t border-[#3a3447] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    25 GP
                  </button>
                </div>

                {/* 3. Armoire Encantado */}
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
                      Sorteia Equipamentos, XP, Ovo ou Poção!
                    </p>
                  </div>
                  <button
                    disabled={gold < 40}
                    onClick={onBuyArmoire}
                    className="w-full py-2 bg-[#ffbe5d]/20 hover:bg-[#ffbe5d]/30 disabled:bg-[#1a181d] disabled:text-[#6e677d] text-[#ffbe5d] border-t border-[#3a3447] font-condensed font-bold text-xs flex items-center justify-center gap-1 transition"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    40 GP
                  </button>
                </div>
              </div>
            </div>

            {/* Grade de Equipamentos e Cosméticos à Venda */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff]">
                  Equipamentos & Cosméticos Disponíveis ({filteredShopItems.length})
                </h3>
                <span className="text-[11px] text-[#a8a1b5]">
                  Exibindo {visibleShopItems.length} de {filteredShopItems.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visibleShopItems.map((item) => {
                  const canAfford = gold >= item.price;
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
                          <span className="absolute top-1 left-1 text-[9px] font-condensed font-bold uppercase px-1 rounded bg-[#271b3d] text-[#d6c7ff]">
                            {CLASS_LABEL[item.heroClass]}
                          </span>
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
                          {formatStats(item.stats)}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-[#8a8299] line-clamp-2 mt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyItem(item)}
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
