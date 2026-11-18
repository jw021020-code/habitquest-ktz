'use client';

import React from 'react';
import {
  CharacterAppearance,
  EquippedGear,
  getAppearanceSpritePath,
  getEquipmentById,
  getEquipmentSpriteOffset,
  getEquipmentSpritePath,
} from '@/lib/game/items';
import { getPetSpritePath } from '@/lib/game/pets';

interface CharacterAvatarProps {
  appearance: CharacterAppearance;
  equipped: EquippedGear;
  costume?: EquippedGear;
  useCostume?: boolean;
  petId?: string;
  size?: 'sm' | 'md' | 'lg' | 'stage';
  className?: string;
}

const SIZE_BOX: Record<
  NonNullable<CharacterAvatarProps['size']>,
  { cls: string; px: number }
> = {
  sm: { cls: 'w-14 h-14', px: 56 },
  md: { cls: 'w-20 h-20', px: 80 },
  lg: { cls: 'w-28 h-28', px: 112 },
  stage: { cls: 'w-[141px] h-[147px]', px: 141 },
};

/**
 * Renderiza o palco oficial 141x147 pixel-art do Habitica em coordenadas 1:1 reais:
 * - O palco interno tem sempre 141px x 147px, escalonado uniformemente para caber no tamanho pedido.
 * - O grupo .character-sprites é ancorado em left: 24px, top: 24px.
 * - Todas as camadas dentro de .character-sprites têm position: absolute, top: 0, left: 0
 *   e tamanho nativo (width: auto, height: auto), garantindo alinhamento perfeito entre
 *   sprites de 90x90 (corpo/cabelo) e sprites largos de 114x90 (arcos, coroas, máscaras, capas).
 */
export function CharacterAvatar({
  appearance,
  equipped,
  costume,
  useCostume = false,
  petId,
  size = 'md',
  className = '',
}: CharacterAvatarProps) {
  const {
    skin,
    bodySize,
    shirt,
    hairStyle,
    hairBangs,
    hairColor,
    hairFlower,
    hairBeard,
    hairMustache,
    background,
  } = appearance;
  const visualGear = useCostume && costume ? costume : equipped;
  const hasBg = Boolean(background && background !== 'none');

  const charLayers: {
    key: string;
    src: string;
    offset?: { marginLeft?: number; marginTop?: number };
  }[] = [];

  if (visualGear.back) {
    charLayers.push({
      key: 'back',
      src: getEquipmentSpritePath(visualGear.back, bodySize),
      offset: getEquipmentSpriteOffset(visualGear.back),
    });
  }

  charLayers.push(
    { key: 'skin', src: getAppearanceSpritePath(`skin_${skin}.png`) },
    { key: 'shirt', src: getAppearanceSpritePath(`${bodySize}_shirt_${shirt}.png`) }
  );

  if (visualGear.armor) {
    charLayers.push({
      key: 'armor',
      src: getEquipmentSpritePath(visualGear.armor, bodySize),
      offset: getEquipmentSpriteOffset(visualGear.armor),
    });
  }

  if (hairBangs > 0) {
    charLayers.push({
      key: 'hair_bangs',
      src: getAppearanceSpritePath(`hair_bangs_${hairBangs}_${hairColor}.png`),
    });
  }

  if (hairStyle > 0) {
    charLayers.push({
      key: 'hair_base',
      src: getAppearanceSpritePath(`hair_base_${hairStyle}_${hairColor}.png`),
    });
  }

  if (hairMustache && hairMustache > 0) {
    charLayers.push({
      key: 'hair_mustache',
      src: getAppearanceSpritePath(`hair_mustache_${hairMustache}_${hairColor}.png`),
    });
  }

  if (hairBeard && hairBeard > 0) {
    charLayers.push({
      key: 'hair_beard',
      src: getAppearanceSpritePath(`hair_beard_${hairBeard}_${hairColor}.png`),
    });
  }

  if (visualGear.body) {
    charLayers.push({
      key: 'body',
      src: getEquipmentSpritePath(visualGear.body, bodySize),
      offset: getEquipmentSpriteOffset(visualGear.body),
    });
  }

  if (visualGear.eyewear) {
    charLayers.push({
      key: 'eyewear',
      src: getEquipmentSpritePath(visualGear.eyewear, bodySize),
      offset: getEquipmentSpriteOffset(visualGear.eyewear),
    });
  }

  if (visualGear.head) {
    charLayers.push({
      key: 'head',
      src: getEquipmentSpritePath(visualGear.head, bodySize),
      offset: getEquipmentSpriteOffset(visualGear.head),
    });
  }

  if (visualGear.headAccessory) {
    charLayers.push({
      key: 'headAccessory',
      src: getEquipmentSpritePath(visualGear.headAccessory, bodySize),
      offset: getEquipmentSpriteOffset(visualGear.headAccessory),
    });
  }

  if (hairFlower && hairFlower > 0) {
    charLayers.push({
      key: 'hair_flower',
      src: getAppearanceSpritePath(`hair_flower_${hairFlower}.png`),
    });
  }

  const weaponIsTwoHanded = Boolean(
    visualGear.weapon && getEquipmentById(visualGear.weapon)?.twoHanded
  );

  if (visualGear.shield && !weaponIsTwoHanded) {
    charLayers.push({
      key: 'shield',
      src: getEquipmentSpritePath(visualGear.shield, bodySize),
      offset: getEquipmentSpriteOffset(visualGear.shield),
    });
  }

  if (visualGear.weapon) {
    charLayers.push({
      key: 'weapon',
      src: getEquipmentSpritePath(visualGear.weapon, bodySize),
      offset: getEquipmentSpriteOffset(visualGear.weapon),
    });
  }

  const box = SIZE_BOX[size];
  const scale = box.px / 141;

  return (
    <div
      className={`relative shrink-0 rounded-md bg-[#271b3d] border border-[#4f2a93] overflow-hidden select-none shadow-inner ${box.cls} ${className}`}
    >
      {/* Palco Oficial Habitica 141x147 escalonado proporcionalmente */}
      <div
        className="absolute top-1/2 left-1/2 w-[141px] h-[147px] [image-rendering:pixelated]"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Camada de Fundo (141x147) */}
        {hasBg ? (
          <img
            src={getAppearanceSpritePath(`background_${background}.png`)}
            alt=""
            draggable={false}
            className="absolute top-0 left-0 w-[141px] h-[147px] max-w-none max-h-none"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#36205d] via-[#2a174a] to-[#1f1238]" />
        )}

        {/* Camadas do Personagem e Equipamentos em tamanho nativo 1:1 a partir de (24, 24) */}
        <div className="absolute top-[24px] left-[24px] w-[90px] h-[90px]">
          {charLayers.map((layer) => (
            <img
              key={layer.key}
              src={layer.src}
              alt=""
              draggable={false}
              className="absolute top-0 left-0 w-auto h-auto max-w-none max-h-none"
              style={
                layer.offset
                  ? {
                      marginLeft: layer.offset.marginLeft,
                      marginTop: layer.offset.marginTop,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {/* Mascote no canto inferior esquerdo do palco 141x147 em tamanho nativo 1:1 */}
        {petId && (
          <img
            src={getPetSpritePath(petId)}
            alt="Mascote"
            draggable={false}
            className="absolute bottom-0 left-0 w-auto h-auto max-w-none max-h-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)]"
          />
        )}
      </div>

      {/* Indicador discreto de Fantasia Ativa */}
      {useCostume && (
        <span
          className="absolute top-1 right-1 text-[9px] font-condensed font-bold uppercase px-1 py-0.2 rounded bg-black/65 text-[#24cc8f] border border-[#24cc8f]/40 z-10"
          title="Modo Fantasia Ativo"
        >
          Cos
        </span>
      )}
    </div>
  );
}
