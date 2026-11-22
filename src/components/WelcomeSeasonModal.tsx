'use client';

import React from 'react';
import { BookOpen, Dumbbell, Shield, Sparkles, Swords, X } from 'lucide-react';

interface WelcomeSeasonModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeSeasonModal({ open, onClose }: WelcomeSeasonModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#23202a] border-2 border-[#ffbe5d]/70 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Temporada 1.0.0 */}
        <div className="bg-gradient-to-r from-[#36205d] via-[#432874] to-[#271b3d] border-b border-[#6133b4] px-5 py-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-block px-2 py-0.5 rounded bg-[#ffbe5d]/20 border border-[#ffbe5d]/60 text-[#ffbe5d] text-[10px] font-condensed font-bold uppercase tracking-wider">
              Versão 1.0.0 · Temporada Oficial
            </span>
            <h2 className="font-condensed font-bold text-xl sm:text-2xl text-white leading-tight">
              Bem-vindo à Temporada 1.0.0 da KTZ
            </h2>
            <p className="text-xs text-[#e2d8ff]">
              O servidor foi reiniciado. Todos começam juntos no Nível 1, rumo à evolução nos estudos e na saúde física.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#271b3d]/80 hover:bg-[#6133b4] text-[#d6c7ff] hover:text-white transition shrink-0"
            aria-label="Fechar boas-vindas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 space-y-1">
              <div className="font-condensed font-bold text-[#ffbe5d] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                Estudo Líquido Real
              </div>
              <p className="text-[#cfc8dc] leading-relaxed">
                Lance apenas horas líquidas focadas (áudio passivo não conta) e não some o tempo de
                questões nas horas teóricas.
              </p>
            </div>

            <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 space-y-1">
              <div className="font-condensed font-bold text-[#24cc8f] flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 shrink-0" />
                Treino Físico e Bem-Estar
              </div>
              <p className="text-[#cfc8dc] leading-relaxed">
                Cárdio + Musculação contam como 2 treinos (+ Combo 2,2x). Informe seus KM corridos
                para ganhar bônus de XP e dano.
              </p>
            </div>

            <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 space-y-1">
              <div className="font-condensed font-bold text-[#d6c7ff] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                Classes Equilibradas no Nv. 5
              </div>
              <p className="text-[#cfc8dc] leading-relaxed">
                Comece como Aprendiz e escolha no Nv. 5 entre Escudeiro, Espadachim, Batedor ou
                Noviço Arcano. Todas upam na mesma velocidade.
              </p>
            </div>

            <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 space-y-1">
              <div className="font-condensed font-bold text-[#50b5e9] flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 shrink-0" />
                101 Bosses e Drops Raros
              </div>
              <p className="text-[#cfc8dc] leading-relaxed">
                Cumpra Missões, faça o Check-in Diário e derrote Bosses em equipe para dropar
                itens Épicos e Lendários (fora da Loja).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-md bg-[#24cc8f] hover:brightness-110 text-[#1a181d] font-condensed font-bold text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Iniciar Temporada 1.0.0
          </button>
        </div>
      </div>
    </div>
  );
}
