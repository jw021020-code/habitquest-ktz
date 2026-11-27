'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Lock, Sparkles, Ticket, Trophy } from 'lucide-react';
import {
  DEFAULT_ROULETTE_STATE,
  getRoulettePrizeMeta,
  isRouletteUnlocked,
  ROULETTE_PRIZES,
  ROULETTE_SLOTS_100,
  ROULETTE_UNLOCK_MS,
  RouletteSpinResult,
  RouletteState,
} from '@/lib/game/roulette';
import { getEquipmentShopIconPath } from '@/lib/game/items';

interface RoulettePanelProps {
  roulette: RouletteState;
  onSpin: () => RouletteSpinResult;
}

const SLOT_W = 88;
const SLOT_GAP = 8;
const SLOT_STEP = SLOT_W + SLOT_GAP;

function formatCountdown(msRemaining: number): string {
  const totalSec = Math.max(0, Math.floor(msRemaining / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function RoulettePanel({ roulette = DEFAULT_ROULETTE_STATE, onSpin }: RoulettePanelProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<number>(50);
  const [revealedResult, setRevealedResult] = useState<RouletteSpinResult | null>(null);
  const [trackOffsetX, setTrackOffsetX] = useState<number>(0);
  const [trackTransition, setTrackTransition] = useState<string>('none');

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlocked = nowMs !== null ? isRouletteUnlocked(new Date(nowMs)) : false;
  const msRemaining = nowMs !== null ? Math.max(0, ROULETTE_UNLOCK_MS - nowMs) : 0;

  // Atualiza cronômetro regressivo até 27/11 00h00 BRT
  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Limpa timer de animação ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Recalcula posição centralizada quando idle ou ao redimensionar
  useEffect(() => {
    const updateCenter = () => {
      if (isSpinning || !viewportRef.current) return;
      const vw = viewportRef.current.clientWidth;
      const offset = vw / 2 - (currentSlot * SLOT_STEP + SLOT_W / 2);
      setTrackTransition('none');
      setTrackOffsetX(offset);
    };
    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, [currentSlot, isSpinning]);

  // 4 voltas de 100 casas = 400 cartas na esteira para giro fluido de 2 voltas completas
  const repeatedSlots = useMemo(() => {
    const out: { globalIdx: number; slotIdx: number; prizeId: (typeof ROULETTE_SLOTS_100)[number] }[] = [];
    for (let lap = 0; lap < 4; lap++) {
      for (let i = 0; i < ROULETTE_SLOTS_100.length; i++) {
        out.push({
          globalIdx: lap * 100 + i,
          slotIdx: i,
          prizeId: ROULETTE_SLOTS_100[i],
        });
      }
    }
    return out;
  }, []);

  const handleStartSpin = () => {
    if (!unlocked || isSpinning || roulette.tokens < 1) return;
    const res = onSpin();
    if (!res.ok) return;

    const vw = viewportRef.current?.clientWidth ?? 640;
    const startIdx = currentSlot;
    const targetIdx = 200 + res.slotIndex; // 2 voltas completas à frente
    const jitter = Math.round((Math.random() - 0.5) * 28);

    const startOffset = vw / 2 - (startIdx * SLOT_STEP + SLOT_W / 2);
    const targetOffset = vw / 2 - (targetIdx * SLOT_STEP + SLOT_W / 2) + jitter;

    setRevealedResult(null);
    setIsSpinning(true);
    setTrackTransition('none');
    setTrackOffsetX(startOffset);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTrackTransition('transform 4500ms cubic-bezier(0.08, 0.85, 0.12, 1)');
        setTrackOffsetX(targetOffset);
      });
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsSpinning(false);
      setCurrentSlot(res.slotIndex);
      setRevealedResult(res);
      setTrackTransition('none');
      const settledOffset = vw / 2 - (res.slotIndex * SLOT_STEP + SLOT_W / 2);
      setTrackOffsetX(settledOffset);
    }, 4580);
  };

  const energyPct = Math.max(0, Math.min(100, Math.round(roulette.energy)));
  const pityPct = Math.max(0, Math.min(100, Math.round((roulette.pityCounter / 10) * 100)));

  return (
    <div className="space-y-5">
      {/* Banner de Bloqueio / Preview antes de 27/11 00h00 BRT */}
      {!unlocked && (
        <div className="bg-gradient-to-r from-[#36205d] via-[#4f2a93] to-[#36205d] border-2 border-[#ffbe5d]/70 rounded-lg p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#1a181d]/70 border border-[#ffbe5d]/50 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#ffbe5d]" />
            </div>
            <div>
              <div className="text-xs font-condensed font-bold uppercase tracking-wider text-[#ffbe5d]">
                Estreia Sincronizada da Guilda KTZ
              </div>
              <h2 className="text-base sm:text-lg font-condensed font-extrabold text-white">
                Roleta de Produção libera em 27/11 às 00h00 (Brasília)
              </h2>
              <p className="text-xs text-[#e6dcff]/90 mt-0.5">
                Para garantir igualdade total, registros feitos antes da meia-noite ainda não acumulam
                energia na Roleta. Explore a esteira de 100 casas e as chances abaixo!
              </p>
            </div>
          </div>
          <div className="bg-[#191129] border border-[#ffbe5d]/60 rounded-lg px-4 py-2.5 text-center shrink-0 min-w-[160px]">
            <div className="text-[10px] font-condensed uppercase tracking-wider text-[#a8a1b5] flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-[#ffbe5d]" />
              Abre em
            </div>
            <div className="text-xl sm:text-2xl font-condensed font-extrabold text-[#ffbe5d] tabular-nums">
              {formatCountdown(msRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho de Energia, Fichas e Pity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs font-condensed font-bold mb-1.5">
            <span className="text-[#d6c7ff] uppercase">Energia de Produção</span>
            <span className="text-[#24cc8f] tabular-nums">{roulette.energy.toFixed(1)} / 100</span>
          </div>
          <div className="h-3 bg-[#191129] rounded-full overflow-hidden border border-[#432874] p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#24cc8f] to-[#50b5e9] transition-all duration-300"
              style={{ width: `${energyPct}%` }}
            />
          </div>
          <p className="text-[11px] text-[#a8a1b5] mt-1.5">
            Estudos e treinos enchem a barra linearmente. Ao chegar em 100, você ganha 1 Ficha.
          </p>
        </div>

        <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-condensed font-bold uppercase text-[#a8a1b5]">
              Fichas Disponíveis
            </div>
            <div className="text-2xl font-condensed font-extrabold text-[#ffbe5d] flex items-center gap-2 mt-0.5">
              <Ticket className="w-6 h-6 text-[#ffbe5d]" />
              <span>{roulette.tokens}</span>
            </div>
            <div className="text-[11px] text-[#8a8299] mt-0.5">
              {roulette.totalSpins} giro(s) realizados
            </div>
          </div>
          <button
            type="button"
            disabled={!unlocked || isSpinning || roulette.tokens < 1}
            onClick={handleStartSpin}
            className={`px-4 py-2.5 rounded-md font-condensed font-extrabold text-sm uppercase tracking-wide transition shadow-lg cursor-pointer ${
              !unlocked || isSpinning || roulette.tokens < 1
                ? 'bg-[#342e40] text-[#8a8299] border border-[#433b52] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#ffbe5d] to-[#f59e0b] hover:brightness-110 text-[#1a181d] border border-amber-200'
            }`}
          >
            {!unlocked
              ? '🔒 Aguardando 00h00'
              : isSpinning
                ? '🎡 Girando...'
                : '🎡 Girar (1 Ficha)'}
          </button>
        </div>

        <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs font-condensed font-bold mb-1.5">
            <span className="text-[#d6c7ff] uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Anti-Azar (Pity Jackpot)
            </span>
            <span className="text-purple-300 tabular-nums">{roulette.pityCounter} / 10</span>
          </div>
          <div className="h-3 bg-[#191129] rounded-full overflow-hidden border border-[#432874] p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300"
              style={{ width: `${pityPct}%` }}
            />
          </div>
          <p className="text-[11px] text-[#a8a1b5] mt-1.5">
            {roulette.pityCounter >= 9
              ? '🔥 Próximo giro garante Épico ou Lendário!'
              : 'Do 6º ao 9º giro a chance sobe; no 10º é Jackpot garantido.'}
          </p>
        </div>
      </div>

      {/* Esteira Animada de 100 Casas */}
      <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-condensed font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#ffbe5d]" />
            Esteira de 100 Casas (1 Casa = 1% Real)
          </h3>
          <span className="text-[11px] font-condensed text-[#a8a1b5]">
            Casa atual: #{currentSlot + 1}/100
          </span>
        </div>

        <div className="relative">
          {/* Ponteiro dourado fixo no centro */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center justify-between">
            <div className="w-0 h-0 border-l-[9px] border-r-[9px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#ffbe5d] drop-shadow" />
            <div className="w-[2px] flex-1 bg-[#ffbe5d]/70" />
            <div className="w-0 h-0 border-l-[9px] border-r-[9px] border-b-[12px] border-l-transparent border-r-transparent border-b-[#ffbe5d] drop-shadow" />
          </div>

          {/* Sombras laterais */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#191129] to-transparent z-10 rounded-l-md" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#191129] to-transparent z-10 rounded-r-md" />

          <div
            ref={viewportRef}
            className="overflow-hidden bg-[#191129] border-2 border-[#432874] rounded-md py-4"
          >
            <div
              className="flex items-center"
              style={{
                gap: `${SLOT_GAP}px`,
                transform: `translate3d(${trackOffsetX}px, 0, 0)`,
                transition: trackTransition,
                willChange: 'transform',
              }}
            >
              {repeatedSlots.map((slot) => {
                const meta = getRoulettePrizeMeta(slot.prizeId);
                return (
                  <div
                    key={slot.globalIdx}
                    style={{ width: `${SLOT_W}px`, minWidth: `${SLOT_W}px` }}
                    className={`h-24 rounded-md border-2 p-2 flex flex-col items-center justify-between text-center select-none ${meta.bgClass} ${meta.borderClass}`}
                  >
                    <span className="text-[9px] font-condensed font-bold text-[#a8a1b5] tabular-nums">
                      #{slot.slotIdx + 1}
                    </span>
                    <span className="text-2xl leading-none">{meta.emoji}</span>
                    <span className={`text-[10px] font-condensed font-extrabold leading-tight ${meta.textClass}`}>
                      {meta.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card de Resultado do Giro */}
        {revealedResult && (
          <div className="mt-4 bg-[#1a181d] border-2 border-[#ffbe5d]/70 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {revealedResult.reward.item ? (
                <img
                  src={getEquipmentShopIconPath(revealedResult.reward.item.id)}
                  alt={revealedResult.reward.item.name}
                  className="w-12 h-12 rounded bg-[#271b3d] border border-[#6133b4] p-1 [image-rendering:pixelated]"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-[#271b3d] border border-[#6133b4] flex items-center justify-center text-2xl">
                  {revealedResult.prize.emoji}
                </div>
              )}
              <div>
                <div className="text-[11px] font-condensed font-bold uppercase text-[#ffbe5d]">
                  Casa #{revealedResult.slotIndex + 1}/100 · {revealedResult.prize.label}
                  {revealedResult.hitPity ? ' · ✨ Pity Ativado!' : ''}
                </div>
                <div className="text-sm font-condensed font-extrabold text-white">
                  {revealedResult.nextState.lastPrizeLabel}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-condensed text-[#24cc8f] font-bold">
              ✓ Recompensa entregue!
            </span>
          </div>
        )}
      </div>

      {/* Tabela Transparente de Probabilidades (100 Casas) + Fontes de Energia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-4">
          <h4 className="font-condensed font-bold text-xs uppercase tracking-wider text-[#d6c7ff] mb-2.5">
            Tabela Oficial de Prêmios (100 Casas = 100%)
          </h4>
          <div className="space-y-1.5">
            {ROULETTE_PRIZES.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs bg-[#1a181d] border border-[#342e40] rounded px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span>{p.emoji}</span>
                  <span className={`font-condensed font-bold ${p.textClass}`}>{p.label}</span>
                  <span className="text-[#a8a1b5] hidden sm:inline">— {p.description}</span>
                </div>
                <span className="font-condensed font-extrabold text-white tabular-nums">
                  {p.count}% ({p.count} {p.count === 1 ? 'casa' : 'casas'})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#23202a] border border-[#3a3447] rounded-lg p-4">
          <h4 className="font-condensed font-bold text-xs uppercase tracking-wider text-[#d6c7ff] mb-2.5">
            Como Carregar Energia da Roleta (100% Linear)
          </h4>
          <div className="space-y-2 text-xs text-[#d6c7ff]">
            <div className="flex items-center justify-between bg-[#1a181d] border border-[#342e40] rounded px-3 py-2">
              <span>📚 Estudo (Teoria)</span>
              <strong className="text-[#24cc8f]">0,5 Energia / minuto</strong>
            </div>
            <div className="flex items-center justify-between bg-[#1a181d] border border-[#342e40] rounded px-3 py-2">
              <span>🎯 Questões</span>
              <strong className="text-[#24cc8f]">1,2 Energia / questão</strong>
            </div>
            <div className="flex items-center justify-between bg-[#1a181d] border border-[#342e40] rounded px-3 py-2">
              <span>✍️ Redação</span>
              <strong className="text-[#24cc8f]">30 Energia / redação</strong>
            </div>
            <div className="flex items-center justify-between bg-[#1a181d] border border-[#342e40] rounded px-3 py-2">
              <span>🏋️ Musculação</span>
              <strong className="text-[#24cc8f]">35 Energia / treino</strong>
            </div>
            <div className="flex items-center justify-between bg-[#1a181d] border border-[#342e40] rounded px-3 py-2">
              <span>🏃 Cárdio (km equivalente)</span>
              <strong className="text-[#24cc8f]">15 Energia / km eq.</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
