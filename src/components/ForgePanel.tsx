'use client';

import React, { useMemo, useState } from 'react';
import { Coins, Gem, Hammer, Search, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import {
  EquipmentItem,
  EquippedGear,
  getEquipmentById,
  getEquipmentShopIconPath,
  getItemEffectiveStats,
  getItemRarity,
  ItemRarity,
  PlayableHeroClass,
  RARITY_META,
} from '@/lib/game/items';
import {
  canSalvageItem,
  getForgeUpgradeCost,
  getItemBasePower,
  getItemSalvageFragments,
  isItemEquippedAnywhere,
  MAX_ENHANCEMENT_LEVEL,
} from '@/lib/game/forge';

interface ForgePanelProps {
  gold: number;
  fragments: number;
  heroClass: PlayableHeroClass;
  equipped: EquippedGear;
  costume: EquippedGear;
  inventory: string[];
  enhancements: Record<string, number>;
  onUpgradeItem: (item: EquipmentItem) => void;
  onSalvageItems: (itemIds: string[]) => void;
}

function formatAttrSummary(stats: { str: number; int: number; con: number; per: number }): string {
  const parts: string[] = [];
  if (stats.str) parts.push(`STR +${stats.str}`);
  if (stats.int) parts.push(`INT +${stats.int}`);
  if (stats.con) parts.push(`CON +${stats.con}`);
  if (stats.per) parts.push(`PER +${stats.per}`);
  return parts.join(' · ') || 'Visual';
}

export function ForgePanel({
  gold,
  fragments,
  heroClass,
  equipped,
  costume,
  inventory,
  enhancements,
  onUpgradeItem,
  onSalvageItems,
}: ForgePanelProps) {
  const [mode, setMode] = useState<'upgrade' | 'salvage'>('upgrade');
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | ItemRarity>('all');
  const [confirmBulkRarity, setConfirmBulkRarity] = useState<'common' | 'uncommon' | null>(null);

  const combatItems = useMemo(() => {
    const equippedIds = new Set(Object.values(equipped).filter(Boolean) as string[]);
    const q = search.trim().toLowerCase();

    return inventory
      .map((id) => getEquipmentById(id))
      .filter((item): item is EquipmentItem => Boolean(item))
      .filter((item) => getItemBasePower(item) >= 1)
      .filter((item) => {
        if (rarityFilter !== 'all' && getItemRarity(item) !== rarityFilter) return false;
        if (q && !item.name.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const aEq = equippedIds.has(a.id) ? 1 : 0;
        const bEq = equippedIds.has(b.id) ? 1 : 0;
        if (aEq !== bEq) return bEq - aEq;
        return getItemBasePower(b) - getItemBasePower(a);
      });
  }, [inventory, equipped, search, rarityFilter]);

  const salvageableItems = useMemo(
    () => combatItems.filter((item) => canSalvageItem(item, equipped, costume)),
    [combatItems, equipped, costume]
  );

  const bulkSummary = useMemo(() => {
    const calc = (target: 'common' | 'uncommon') => {
      const list = inventory
        .map((id) => getEquipmentById(id))
        .filter((item): item is EquipmentItem => Boolean(item))
        .filter(
          (item) =>
            getItemRarity(item) === target && canSalvageItem(item, equipped, costume)
        );
      const totalFrag = list.reduce(
        (acc, item) => acc + getItemSalvageFragments(item, enhancements[item.id] ?? 0),
        0
      );
      return { ids: list.map((i) => i.id), totalFrag };
    };
    return {
      common: calc('common'),
      uncommon: calc('uncommon'),
    };
  }, [inventory, equipped, costume, enhancements]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Forja */}
      <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="font-condensed font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <Hammer className="w-5 h-5 text-[#ffbe5d]" />
            Forja & Desfragmentação de Equipamentos
          </h2>
          <p className="text-xs text-[#a8a1b5] mt-0.5">
            Desmonte itens sobressalentes para gerar Fragmentos de Essência e evolua seus itens
            principais até <strong className="text-[#ffbe5d]">+5 Obra-Prima</strong> (100% garantido).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-[#191129] border border-cyan-500/50 rounded-md px-3 py-1.5 flex items-center gap-1.5 text-xs font-condensed font-bold text-cyan-300">
            <Gem className="w-4 h-4 text-cyan-300" />
            <span>{fragments} Fragmentos</span>
          </div>
          <div className="bg-[#191129] border border-amber-500/50 rounded-md px-3 py-1.5 flex items-center gap-1.5 text-xs font-condensed font-bold text-[#ffbe5d]">
            <Coins className="w-4 h-4 text-[#ffbe5d]" />
            <span>{gold} GP</span>
          </div>
        </div>
      </div>

      {/* Sub-abas da Forja + Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('upgrade')}
            className={`px-3.5 py-2 rounded-md text-xs font-condensed font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mode === 'upgrade'
                ? 'bg-[#6133b4] text-white shadow'
                : 'bg-[#23202a] text-[#a8a1b5] border border-[#3a3447] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Aprimorar (+1 a +5)
          </button>
          <button
            type="button"
            onClick={() => setMode('salvage')}
            className={`px-3.5 py-2 rounded-md text-xs font-condensed font-bold flex items-center gap-1.5 transition cursor-pointer ${
              mode === 'salvage'
                ? 'bg-[#6133b4] text-white shadow'
                : 'bg-[#23202a] text-[#a8a1b5] border border-[#3a3447] hover:text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Desfragmentar ({salvageableItems.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-[#8a8299] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar equipamento..."
              className="w-full bg-[#1a181d] border border-[#3a3447] rounded-md pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
            />
          </div>
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as 'all' | ItemRarity)}
            className="bg-[#1a181d] border border-[#3a3447] rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
          >
            <option value="all">Todas Raridades</option>
            <option value="common">Comum</option>
            <option value="uncommon">Incomum</option>
            <option value="rare">Raro</option>
            <option value="epic">Épico</option>
            <option value="legendary">Lendário</option>
          </select>
        </div>
      </div>

      {/* Ações em massa na aba Desfragmentar */}
      {mode === 'salvage' && (
        <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs text-[#a8a1b5]">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-[#24cc8f]" />
            Itens equipados (Batalha/Fantasia) e cosméticos de 0 atributos são protegidos automaticamente.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['common', 'uncommon'] as const).map((r) => {
              const info = bulkSummary[r];
              const label = r === 'common' ? 'Comuns' : 'Incomuns';
              const isConfirming = confirmBulkRarity === r;
              return isConfirming ? (
                <div key={r} className="flex items-center gap-1.5 bg-[#191129] border border-amber-400/60 rounded px-2.5 py-1">
                  <span className="text-[11px] font-condensed text-amber-200">
                    Desmontar {info.ids.length} {label} → +{info.totalFrag} Frag.?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSalvageItems(info.ids);
                      setConfirmBulkRarity(null);
                    }}
                    className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulkRarity(null)}
                    className="px-2 py-0.5 rounded bg-[#342e40] text-[#d6c7ff] text-[11px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  key={r}
                  type="button"
                  disabled={info.ids.length === 0}
                  onClick={() => setConfirmBulkRarity(r)}
                  className={`px-3 py-1.5 rounded text-xs font-condensed font-bold transition cursor-pointer ${
                    info.ids.length === 0
                      ? 'bg-[#1a181d] text-[#6e677d] border border-[#342e40] cursor-not-allowed'
                      : 'bg-[#191129] hover:bg-[#36205d] text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  Desmontar {label} ({info.ids.length} → +{info.totalFrag} 💎)
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de Itens */}
      {mode === 'upgrade' ? (
        combatItems.length === 0 ? (
          <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-8 text-center text-xs text-[#a8a1b5]">
            Nenhum equipamento de combate encontrado no inventário com os filtros atuais.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {combatItems.map((item) => {
              const rarity = getItemRarity(item);
              const meta = RARITY_META[rarity];
              const lv = enhancements[item.id] ?? 0;
              const isEquipped = isItemEquippedAnywhere(item.id, equipped, costume);
              const curEff = getItemEffectiveStats(item, heroClass, lv);
              const nextEff = lv < MAX_ENHANCEMENT_LEVEL ? getItemEffectiveStats(item, heroClass, lv + 1) : null;
              const cost = getForgeUpgradeCost(item, lv);
              const canAfford = Boolean(cost && fragments >= cost.fragments && gold >= cost.gold);

              return (
                <div
                  key={item.id}
                  style={meta.glowShadow !== 'none' ? { boxShadow: meta.glowShadow } : undefined}
                  className={`bg-[#23202a] border rounded-lg p-3 flex items-center gap-3 ${meta.cardBorderClass}`}
                >
                  <img
                    src={getEquipmentShopIconPath(item.id)}
                    alt={item.name}
                    className="w-12 h-12 rounded bg-[#191129] border border-[#432874] p-1 shrink-0 [image-rendering:pixelated]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-condensed font-bold text-white truncate">
                        {item.name}
                      </span>
                      {lv > 0 && (
                        <span className="text-[10px] font-condensed font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50">
                          +{lv}
                        </span>
                      )}
                      {isEquipped && (
                        <span className="text-[10px] font-condensed font-bold px-1.5 py-0.2 rounded bg-[#24cc8f]/20 text-[#24cc8f] border border-[#24cc8f]/40">
                          Equipado
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-condensed text-[#d6c7ff] mt-0.5">
                      {formatAttrSummary(curEff)}
                      {nextEff && (
                        <span className="text-[#24cc8f] ml-1.5">
                          → {formatAttrSummary(nextEff)}
                        </span>
                      )}
                    </div>
                    {cost ? (
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-[11px] font-condensed text-[#a8a1b5]">
                          Custo: <strong className="text-cyan-300">{cost.fragments} 💎</strong> +{' '}
                          <strong className="text-[#ffbe5d]">{cost.gold} GP</strong>
                        </span>
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUpgradeItem(item)}
                          className={`px-3 py-1 rounded text-[11px] font-condensed font-extrabold transition cursor-pointer ${
                            canAfford
                              ? 'bg-[#6133b4] hover:bg-[#7440cf] text-white'
                              : 'bg-[#1a181d] text-[#6e677d] border border-[#342e40] cursor-not-allowed'
                          }`}
                        >
                          ⚒️ Forjar +{lv + 1}
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] font-condensed font-bold text-[#ffbe5d] mt-2">
                        ✨ Obra-Prima Máxima (+5)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : salvageableItems.length === 0 ? (
        <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-8 text-center text-xs text-[#a8a1b5]">
          Nenhum equipamento sobressalente elegível para desfragmentação.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {salvageableItems.map((item) => {
            const rarity = getItemRarity(item);
            const meta = RARITY_META[rarity];
            const lv = enhancements[item.id] ?? 0;
            const fragYield = getItemSalvageFragments(item, lv);
            const curEff = getItemEffectiveStats(item, heroClass, lv);

            return (
              <div
                key={item.id}
                className={`bg-[#23202a] border rounded-lg p-3 flex items-center justify-between gap-3 ${meta.cardBorderClass}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getEquipmentShopIconPath(item.id)}
                    alt={item.name}
                    className="w-11 h-11 rounded bg-[#191129] border border-[#432874] p-1 shrink-0 [image-rendering:pixelated]"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-condensed font-bold text-white truncate">
                        {item.name}
                      </span>
                      {lv > 0 && (
                        <span className="text-[10px] font-condensed font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50">
                          +{lv}
                        </span>
                      )}
                      <span className={`text-[9px] font-condensed font-bold px-1.5 py-0.2 rounded border ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[11px] font-condensed text-[#a8a1b5] mt-0.5">
                      {formatAttrSummary(curEff)} · Poder {getItemBasePower(item)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSalvageItems([item.id])}
                  className="px-3 py-1.5 rounded bg-[#191129] hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/50 text-xs font-condensed font-extrabold shrink-0 cursor-pointer transition"
                >
                  💎 +{fragYield}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
