'use client';

import React from 'react';
import { Coins, Gift, Heart, Shield, Sparkles, Swords } from 'lucide-react';

export interface CompensationPackage {
  username: string;
  missedBosses: 3 | 4;
  xp: number;
  gold: number;
  eggs: number;
  potions: number;
  equipOddsLabel: string;
}

interface CompensationModalProps {
  open: boolean;
  pkg: CompensationPackage | null;
  onClaim: () => void;
}

export function CompensationModal({ open, pkg, onClaim }: CompensationModalProps) {
  if (!open || !pkg) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#23202a] border-2 border-[#ffbe5d] rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#36205d] via-[#432874] to-[#271b3d] border-b border-[#6133b4] px-5 py-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ffbe5d]/20 border border-[#ffbe5d]/60 text-[#ffbe5d] text-[10px] font-condensed font-bold uppercase tracking-wider">
            <Shield className="w-3 h-3" />
            Compensação Exclusiva · Jogo Limpo
          </div>
          <h2 className="font-condensed font-bold text-xl text-white leading-tight">
            Baú de Compensação para {pkg.username}
          </h2>
          <p className="text-xs text-[#e2d8ff]">
            Referente aos <strong className="text-[#ffbe5d]">{pkg.missedBosses} Bosses</strong> da KTZ derrotados durante o exploit anterior.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#cfc8dc] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#24cc8f]" />
                Experiência dos Bosses:
              </span>
              <span className="font-condensed font-bold text-[#24cc8f]">+{pkg.xp} XP</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#cfc8dc] flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#ffbe5d]" />
                Ouro + Bônus de Compensação:
              </span>
              <span className="font-condensed font-bold text-[#ffbe5d]">+{pkg.gold} GP</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#cfc8dc] flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#d6c7ff]" />
                Estábulo:
              </span>
              <span className="font-condensed font-bold text-[#d6c7ff]">
                +{pkg.eggs} Ovos · +{pkg.potions} Poções
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#cfc8dc] flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-[#925cf3]" />
                Equipamento Garantido:
              </span>
              <span className="font-condensed font-bold text-[#d6c7ff]">{pkg.equipOddsLabel}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#cfc8dc] flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#50b5e9]" />
                Restauração & Contagem:
              </span>
              <span className="font-condensed font-bold text-[#50b5e9]">
                100% STA/MP · +{pkg.missedBosses} Bosses
              </span>
            </div>
          </div>

          <button
            onClick={onClaim}
            className="w-full py-3 rounded-md bg-[#ffbe5d] hover:brightness-110 text-[#1a181d] font-condensed font-bold text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            Resgatar Compensação
          </button>
        </div>
      </div>
    </div>
  );
}
