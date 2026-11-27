import {
  ENHANCEMENT_PCT_BY_LEVEL,
  EquipmentItem,
  EquippedGear,
  getEnhancedBaseStats,
  getItemRarity,
  ItemRarity,
  MAX_ENHANCEMENT_LEVEL,
} from './items';

export { ENHANCEMENT_PCT_BY_LEVEL, getEnhancedBaseStats, MAX_ENHANCEMENT_LEVEL };

const FORGE_BASE_COST: { fragments: number; gold: number }[] = [
  { fragments: 15, gold: 40 },   // 0 -> +1
  { fragments: 30, gold: 80 },   // +1 -> +2
  { fragments: 55, gold: 140 },  // +2 -> +3
  { fragments: 90, gold: 220 },  // +3 -> +4
  { fragments: 140, gold: 350 }, // +4 -> +5
];

const RARITY_COST_MULT: Record<ItemRarity, number> = {
  common: 0.6,
  uncommon: 0.85,
  rare: 1.0,
  epic: 1.5,
  legendary: 2.2,
};

export function getItemBasePower(item: EquipmentItem): number {
  return item.stats.str + item.stats.int + item.stats.con + item.stats.per;
}

export function isItemEquippedAnywhere(
  itemId: string,
  equipped: EquippedGear,
  costume: EquippedGear
): boolean {
  return (
    Object.values(equipped).includes(itemId) ||
    Object.values(costume).includes(itemId)
  );
}

export function canSalvageItem(
  item: EquipmentItem,
  equipped: EquippedGear,
  costume: EquippedGear
): boolean {
  if (getItemBasePower(item) < 1) return false;
  return !isItemEquippedAnywhere(item.id, equipped, costume);
}

export function getForgeUpgradeCost(
  item: EquipmentItem,
  currentLevel = 0
): { fragments: number; gold: number } | null {
  if (getItemBasePower(item) < 1) return null;
  const lv = Math.max(0, Math.floor(currentLevel));
  if (lv >= MAX_ENHANCEMENT_LEVEL) return null;
  const base = FORGE_BASE_COST[lv];
  const mult = RARITY_COST_MULT[getItemRarity(item)];
  return {
    fragments: Math.max(1, Math.round(base.fragments * mult)),
    gold: Math.max(1, Math.round(base.gold * mult)),
  };
}

export function getTotalInvestedFragments(
  item: EquipmentItem,
  enhancementLevel = 0
): number {
  const lv = Math.min(MAX_ENHANCEMENT_LEVEL, Math.max(0, Math.floor(enhancementLevel)));
  let total = 0;
  for (let i = 0; i < lv; i++) {
    total += getForgeUpgradeCost(item, i)?.fragments ?? 0;
  }
  return total;
}

/**
 * Calcula quantos Fragmentos de Essência um equipamento gera ao ser desfragmentado.
 * Escala pela raridade (qualidade), poder de força (soma dos atributos) + 50% de reembolso de Forja.
 */
export function getItemSalvageFragments(
  item: EquipmentItem,
  enhancementLevel = 0
): number {
  const power = getItemBasePower(item);
  if (power < 1) return 0;

  const rarity = getItemRarity(item);
  let base = 1;
  switch (rarity) {
    case 'common':
      base = Math.max(1, Math.round(1 + power * 0.35));
      break;
    case 'uncommon':
      base = Math.round(4 + power * 0.55);
      break;
    case 'rare':
      base = Math.round(10 + power * 0.85);
      break;
    case 'epic':
      base = Math.round(24 + power * 1.35);
      break;
    case 'legendary':
      base = Math.round(50 + power * 2.0);
      break;
  }

  const refund = Math.round(getTotalInvestedFragments(item, enhancementLevel) * 0.5);
  return base + refund;
}
