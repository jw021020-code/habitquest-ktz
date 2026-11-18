'use client';

import React from 'react';
import {
  CharacterAppearance,
  EquippedGear,
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

const SIZE_CLASS: Record<NonNullable<CharacterAvatarProps['size']>, string> = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  stage: 'w-[126px] h-[126px] sm:w-[140px] sm:h-[140px]',
};

/**
 * Renderiza o palco de avatar estilo Habitica (140x140 pixel-art)
 * seguindo a ordem oficial de camadas do Habitica para todos os 8 slots:
 * Background -> Back -> Skin -> Shirt -> Armor -> Hair -> Beard/Mustache
 * -> Body -> Eyewear -> Head -> HeadAccessory -> Shield -> Weapon -> Pet.
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
    hairBeard,
    hairMustache,
    background,
  } = appearance;
  const visualGear = useCostume && costume ? costume : equipped;

  const hasBg = Boolean(background && background !== 'none');
  const charLayers: { key: string; src: string }[] = [];

  if (visualGear.back) {
    charLayers.push({
      key: 'back',
      src: getEquipmentSpritePath(visualGear.back, bodySize),
    });
  }

  charLayers.push(
    { key: 'skin', src: `/sprites/skin_${skin}.png` },
    { key: 'shirt', src: `/sprites/${bodySize}_shirt_${shirt}.png` }
  );

  if (visualGear.armor) {
    charLayers.push({
      key: 'armor',
      src: getEquipmentSpritePath(visualGear.armor, bodySize),
    });
  }

  charLayers.push(
    { key: 'hair_base', src: `/sprites/hair_base_${hairStyle}_${hairColor}.png` },
    { key: 'hair_bangs', src: `/sprites/hair_bangs_${hairBangs}_${hairColor}.png` }
  );

  if (hairBeard && hairBeard > 0) {
    charLayers.push({
      key: 'hair_beard',
      src: `/sprites/hair_beard_${hairBeard}_${hairColor}.png`,
    });
  }

  if (hairMustache && hairMustache > 0) {
    charLayers.push({
      key: 'hair_mustache',
      src: `/sprites/hair_mustache_${hairMustache}_${hairColor}.png`,
    });
  }

  if (visualGear.body) {
    charLayers.push({
      key: 'body',
      src: getEquipmentSpritePath(visualGear.body, bodySize),
    });
  }

  if (visualGear.eyewear) {
    charLayers.push({
      key: 'eyewear',
      src: getEquipmentSpritePath(visualGear.eyewear, bodySize),
    });
  }

  if (visualGear.head) {
    charLayers.push({
      key: 'head',
      src: getEquipmentSpritePath(visualGear.head, bodySize),
    });
  }

  if (visualGear.headAccessory) {
    charLayers.push({
      key: 'headAccessory',
      src: getEquipmentSpritePath(visualGear.headAccessory, bodySize),
    });
  }

  if (visualGear.shield) {
    charLayers.push({
      key: 'shield',
      src: getEquipmentSpritePath(visualGear.shield, bodySize),
    });
  }

  if (visualGear.weapon) {
    charLayers.push({
      key: 'weapon',
      src: getEquipmentSpritePath(visualGear.weapon, bodySize),
    });
  }

  return (
    <div
      className={`relative shrink-0 rounded-md bg-[#271b3d] border border-[#4f2a93] overflow-hidden select-none shadow-inner ${SIZE_CLASS[size]} ${className}`}
    >
      {/* Camada de Fundo (Background Cenário Habitica) */}
      {hasBg ? (
        <img
          src={`/sprites/background_${background}.png`}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover [image-rendering:pixelated]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#36205d] via-[#2a174a] to-[#1f1238]" />
      )}

      {/* Camadas do Personagem */}
      <div className="absolute inset-0 flex items-center justify-center">
        {charLayers.map((layer) => (
          <img
            key={layer.key}
            src={layer.src}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain [image-rendering:pixelated]"
          />
        ))}
      </div>

      {/* Mascote no canto inferior esquerdo do palco (estilo Habitica) */}
      {petId && (
        <img
          src={getPetSpritePath(petId)}
          alt="Mascote"
          draggable={false}
          className="absolute bottom-0.5 left-0.5 w-[46%] h-[46%] object-contain [image-rendering:pixelated] drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)]"
        />
      )}

      {/* Indicador discreto de Fantasia Ativa */}
      {useCostume && (
        <span
          className="absolute top-1 right-1 text-[9px] font-condensed font-bold uppercase px-1 py-0.2 rounded bg-black/65 text-[#24cc8f] border border-[#24cc8f]/40"
          title="Modo Fantasia Ativo"
        >
          Cos
        </span>
      )}
    </div>
  );
}
