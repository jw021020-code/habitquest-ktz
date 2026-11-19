'use client';

import React from 'react';
import { CalendarCheck, CheckCircle2, Coins, Flame, Gift, Heart, X, Zap } from 'lucide-react';
import {
  CheckInState,
  computeCheckInReward,
  getProjectedStreak,
} from '@/lib/game/checkin';

interface DailyCheckInModalProps {
  open: boolean;
  onClose: () => void;
  level: number;
  maxHp: number;
  maxMp: number;
  checkinState?: CheckInState;
  canClaimToday: boolean;
  onClaimCheckIn: () => void;
}

export function DailyCheckInModal({
  open,
  onClose,
  level,
  maxHp,
  maxMp,
  checkinState,
  canClaimToday,
  onClaimCheckIn,
}: DailyCheckInModalProps) {
  if (!open) return null;

  const projectedStreak = getProjectedStreak(checkinState);
  const currentCycleDay = ((projectedStreak - 1) % 7) + 1;
  const reward = computeCheckInReward(level, maxHp, maxMp, projectedStreak);
  const totalCheckIns = checkinState?.totalCheckIns ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#23202a] border-2 border-[#6133b4] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="bg-[#36205d] border-b border-[#4f2a93] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-5 h-5 text-[#ffbe5d]" />
            <h2 className="font-condensed font-bold text-base sm:text-lg text-white leading-none">
              Check-in Diário (Nv. {level})
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#271b3d] hover:bg-[#432874] text-[#d6c7ff] hover:text-white transition"
            aria-label="Fechar Check-in"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status de Sequência */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-2.5">
              <div className="text-[11px] font-condensed uppercase text-[#a8a1b5]">
                Sequência Atual
              </div>
              <div className="text-lg font-condensed font-bold text-[#ffbe5d] flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-4 h-4 text-[#ffbe5d]" />
                {projectedStreak} {projectedStreak === 1 ? 'dia' : 'dias'}
              </div>
            </div>

            <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-2.5">
              <div className="text-[11px] font-condensed uppercase text-[#a8a1b5]">
                Multiplicador
              </div>
              <div className="text-lg font-condensed font-bold text-[#24cc8f] mt-0.5">
                {reward.streakMult.toFixed(1)}x
              </div>
            </div>

            <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-2.5">
              <div className="text-[11px] font-condensed uppercase text-[#a8a1b5]">
                Total Check-ins
              </div>
              <div className="text-lg font-condensed font-bold text-white mt-0.5">
                {totalCheckIns}
              </div>
            </div>
          </div>

          {/* Trilha de 7 Dias */}
          <div>
            <p className="text-xs font-condensed font-bold text-[#cfc8dc] mb-2">
              Ciclo de 7 dias
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                const isPast =
                  canClaimToday ? dayNum < currentCycleDay : dayNum <= currentCycleDay;
                const isToday = canClaimToday && dayNum === currentCycleDay;
                const bonusTag =
                  dayNum === 3
                    ? 'Ovo/Poção'
                    : dayNum === 5
                    ? 'Ovo+Poção'
                    : dayNum === 7
                    ? 'Armoire'
                    : null;

                return (
                  <div
                    key={dayNum}
                    className={`rounded-md border p-2 text-center flex flex-col items-center justify-between min-h-[70px] transition ${
                      isToday
                        ? 'bg-[#36205d] border-[#ffbe5d] ring-1 ring-[#ffbe5d]/60'
                        : isPast
                        ? 'bg-[#1c2b29] border-[#24cc8f]/60'
                        : 'bg-[#1a181d] border-[#3a3447] opacity-75'
                    }`}
                  >
                    <span className="text-[10px] font-condensed font-bold uppercase text-[#cfc8dc]">
                      Dia {dayNum}
                    </span>
                    <span className="text-xs font-condensed font-bold text-[#ffbe5d] my-0.5">
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-[#24cc8f]" />
                      ) : bonusTag ? (
                        bonusTag
                      ) : (
                        `${(1 + (dayNum - 1) * 0.1).toFixed(1)}x`
                      )}
                    </span>
                    <span className="text-[9px] text-[#a8a1b5]">
                      {isToday ? 'Hoje' : isPast ? 'Feito' : 'Bônus'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recompensa de Hoje */}
          <div className="bg-[#1a181d] border border-[#432874] rounded-md p-3.5 space-y-2.5">
            <span className="block text-xs font-condensed font-bold text-[#d6c7ff]">
              {canClaimToday ? `Recompensa de hoje (Nv. ${level})` : 'Check-in de hoje concluído'}
            </span>

            <div className="flex flex-wrap items-center gap-2 text-xs font-condensed font-bold">
              <span className="px-2.5 py-1 rounded bg-[#ffbe5d]/15 border border-[#ffbe5d]/40 text-[#ffbe5d] flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />+{reward.gold} GP
              </span>
              <span className="px-2.5 py-1 rounded bg-[#ff6165]/15 border border-[#ff6165]/40 text-[#ff8b8e] flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />+{reward.staRestore} STA (20%)
              </span>
              <span className="px-2.5 py-1 rounded bg-[#50b5e9]/15 border border-[#50b5e9]/40 text-[#50b5e9] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />+{reward.mpRestore} MP (20%)
              </span>
            </div>

            {reward.milestoneLabel && (
              <div className="pt-2 border-t border-[#3a3447] text-xs font-condensed font-bold text-[#ffbe5d] flex items-center gap-1.5">
                <Gift className="w-4 h-4 shrink-0" />
                <span>Bônus do Dia {currentCycleDay}: {reward.milestoneLabel}</span>
              </div>
            )}
          </div>

          {/* Botão Principal */}
          {canClaimToday ? (
            <button
              onClick={onClaimCheckIn}
              className="w-full py-3 rounded-md bg-[#24cc8f] hover:brightness-110 text-[#1a181d] font-condensed font-bold text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              Resgatar Check-in Diário
            </button>
          ) : (
            <div className="w-full py-2.5 rounded-md bg-[#1f1c26] border border-[#24cc8f]/40 text-[#24cc8f] font-condensed font-bold text-xs text-center">
              Check-in de hoje concluído.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
