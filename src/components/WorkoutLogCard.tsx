'use client';

import React, { useState } from 'react';
import { Check, Dumbbell, Flame, Plus, Trash2 } from 'lucide-react';
import { PlayerStats, previewWorkoutReward } from '@/lib/game/formulas';
import { Attributes } from '@/lib/game/items';

export interface WorkoutEntry {
  id: string;
  cardio: boolean;
  musculacao: boolean;
  km?: number;
  notes?: string;
  createdAt: string;
  loggedAt?: string;
}

interface WorkoutLogCardProps {
  entries: WorkoutEntry[];
  stats: PlayerStats;
  totalAttributes: Attributes;
  bossAttack: number;
  onAddWorkout: (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => void;
  onDeleteWorkout: (id: string) => void;
}

export function WorkoutLogCard({
  entries,
  stats,
  totalAttributes,
  bossAttack,
  onAddWorkout,
  onDeleteWorkout,
}: WorkoutLogCardProps) {
  const [cardio, setCardio] = useState(false);
  const [musculacao, setMusculacao] = useState(false);
  const [kmInput, setKmInput] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canSubmit = cardio || musculacao;
  const parsedKmPreview = cardio ? Math.max(0, parseFloat(kmInput.replace(',', '.')) || 0) : 0;
  const preview = previewWorkoutReward(
    stats,
    cardio,
    musculacao,
    totalAttributes,
    bossAttack,
    undefined,
    parsedKmPreview
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const parsedKm = cardio ? Math.max(0, parseFloat(kmInput.replace(',', '.')) || 0) : 0;

    onAddWorkout({
      cardio,
      musculacao,
      km: cardio && parsedKm > 0 ? Math.round(parsedKm * 100) / 100 : undefined,
      notes: notes.trim() || undefined,
    });

    setCardio(false);
    setMusculacao(false);
    setKmInput('');
    setNotes('');
  };

  const comboCount = entries.filter((e) => e.cardio && e.musculacao).length;

  return (
    <section className="flex flex-col bg-[#23202a] border border-[#342e40] rounded-md overflow-hidden shadow-lg">
      {/* Cabeçalho da Coluna estilo Habitica */}
      <div className="bg-[#2c2836] border-b border-[#3a3447] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-[#24cc8f]" />
          <h2 className="font-condensed font-bold text-base tracking-wide text-white uppercase">
            Treinamento Físico Diário
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-[#36205d] border border-[#6133b4] text-[11px] font-condensed font-bold text-[#d6c7ff]">
            {entries.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-condensed text-[#a8a1b5]">
          <span className="bg-[#1a181d] border border-[#3a3447] px-2 py-0.5 rounded text-[#24cc8f] font-bold">
            💪 {entries.length} treinos
          </span>
          {comboCount > 0 && (
            <span className="bg-[#1a181d] border border-[#3a3447] px-2 py-0.5 rounded text-[#ffbe5d] font-bold">
              🔥 {comboCount} combos
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Caixa de Registro Rápido estilo Habitica Dailies */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3.5 space-y-3 text-sm shadow-inner"
        >
          <p className="text-[11px] font-condensed font-bold uppercase tracking-wider text-[#cfc8dc]">
            Selecione as modalidades realizadas no dia (pode marcar ambas):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Cartão Checkbox Cárdio estilo Habitica Daily */}
            <label
              className={`flex items-stretch rounded-md border overflow-hidden cursor-pointer select-none transition ${
                cardio
                  ? 'bg-[#24cc8f]/15 border-[#24cc8f] text-white'
                  : 'bg-[#23202a] border-[#3a3447] text-[#cfc8dc] hover:border-[#6133b4]'
              }`}
            >
              <div
                className={`w-10 flex items-center justify-center shrink-0 transition ${
                  cardio ? 'bg-[#24cc8f] text-[#1a181d]' : 'bg-[#2c2836] text-[#8a8299]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={cardio}
                  onChange={(e) => setCardio(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    cardio
                      ? 'bg-[#1a181d]/20 border-[#1a181d]/40'
                      : 'bg-[#1a181d] border-[#4f4663]'
                  }`}
                >
                  {cardio && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <div className="p-2.5 flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-[#ffbe5d] shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-condensed font-bold">Cárdio</div>
                  <div className="text-[11px] text-[#a8a1b5]">Corrida, bike, caminhada</div>
                </div>
              </div>
            </label>

            {/* Cartão Checkbox Musculação estilo Habitica Daily */}
            <label
              className={`flex items-stretch rounded-md border overflow-hidden cursor-pointer select-none transition ${
                musculacao
                  ? 'bg-[#24cc8f]/15 border-[#24cc8f] text-white'
                  : 'bg-[#23202a] border-[#3a3447] text-[#cfc8dc] hover:border-[#6133b4]'
              }`}
            >
              <div
                className={`w-10 flex items-center justify-center shrink-0 transition ${
                  musculacao ? 'bg-[#24cc8f] text-[#1a181d]' : 'bg-[#2c2836] text-[#8a8299]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={musculacao}
                  onChange={(e) => setMusculacao(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    musculacao
                      ? 'bg-[#1a181d]/20 border-[#1a181d]/40'
                      : 'bg-[#1a181d] border-[#4f4663]'
                  }`}
                >
                  {musculacao && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <div className="p-2.5 flex items-center gap-2.5">
                <Dumbbell className="w-4 h-4 text-[#925cf3] shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-condensed font-bold">Musculação</div>
                  <div className="text-[11px] text-[#a8a1b5]">Treino de força / academia</div>
                </div>
              </div>
            </label>
          </div>

          {cardio && (
            <div>
              <label className="block text-[11px] font-condensed font-bold uppercase tracking-wider text-[#ffbe5d] mb-1">
                🏃 Distância Corrida (km) — opcional (conta para Missões PRF)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={kmInput}
                onChange={(e) => setKmInput(e.target.value)}
                placeholder="Ex.: 3.0"
                className="w-full bg-[#23202a] border border-[#ffbe5d]/40 rounded px-3 py-2 text-sm text-[#f3f1f7] placeholder-[#6e677d] focus:outline-none focus:border-[#ffbe5d]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-condensed font-bold uppercase tracking-wider text-[#cfc8dc] mb-1">
              Observações do Treino (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: 5km corrida + treino superior..."
              className="w-full bg-[#23202a] border border-[#3a3447] rounded px-3 py-2 text-sm text-[#f3f1f7] placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
            />
          </div>

          {/* Prévia em Tempo Real de Recompensa e Contra-Ataque */}
          <div className="bg-[#23202a] border border-[#342e40] rounded px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-condensed">
            <span className="text-[#a8a1b5]">Estimativa base:</span>
            {canSubmit ? (
              <div className="flex flex-wrap items-center gap-2.5 font-bold">
                <span className="text-[#ffbe5d]">+{preview.xp} XP</span>
                <span className="text-[#ffbe5d]">+{preview.gold} GP</span>
                <span className="text-[#24cc8f]">⚔️ -{preview.bossDamage} Boss HP</span>
                <span className="text-[#ff8b8e]">⚡ -{preview.staminaLost} STA</span>
              </div>
            ) : (
              <span className="text-[#6e677d]">Marque Cárdio e/ou Musculação para calcular</span>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider transition shadow-md ${
              canSubmit
                ? 'bg-[#24cc8f] hover:brightness-110 text-[#1a181d] cursor-pointer'
                : 'bg-[#23202a] text-[#6e677d] border border-[#3a3447] cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            {cardio && musculacao
              ? 'Registrar Combo (Cárdio + Musculação)'
              : 'Registrar Treino Físico'}
          </button>
        </form>

        {/* Lista de Cartões de Treinos Registrados estilo Habitica */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
          {entries.length === 0 ? (
            <div className="bg-[#1a181d]/60 border border-dashed border-[#3a3447] rounded-md py-8 px-4 text-center">
              <p className="text-xs text-[#8a8299]">
                Nenhum treino físico registrado ainda. Marque Cárdio e/ou Musculação acima!
              </p>
            </div>
          ) : (
            entries.map((entry) => {
              const isCombo = entry.cardio && entry.musculacao;
              const isConfirming = confirmDeleteId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="group flex items-stretch bg-[#2c2836] hover:bg-[#322d3d] border border-[#3a3447] rounded-md overflow-hidden transition shadow-sm"
                >
                  <div className="w-10 bg-[#24cc8f] flex items-center justify-center shrink-0 text-[#1a181d]">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>

                  <div className="flex-1 px-3 py-2.5 min-w-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {entry.cardio && (
                          <span className="text-xs font-condensed font-bold px-2 py-0.5 rounded bg-[#ffbe5d]/20 text-[#ffbe5d] border border-[#ffbe5d]/30">
                            🏃 Cárdio{entry.km && entry.km > 0 ? ` (${entry.km} km)` : ''}
                          </span>
                        )}
                        {entry.musculacao && (
                          <span className="text-xs font-condensed font-bold px-2 py-0.5 rounded bg-[#925cf3]/20 text-[#d6c7ff] border border-[#925cf3]/40">
                            🏋️ Musculação
                          </span>
                        )}
                        {isCombo && (
                          <span className="text-[10px] font-condensed font-bold px-1.5 py-0.5 rounded bg-[#24cc8f]/20 text-[#24cc8f]">
                            Combo do Dia
                          </span>
                        )}
                        <span className="text-[11px] text-[#8a8299] ml-1">{entry.createdAt}</span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-[#cfc8dc] mt-1 truncate">{entry.notes}</p>
                      )}
                    </div>

                    {isConfirming ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            onDeleteWorkout(entry.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 rounded bg-[#ff6165] text-white text-[10px] font-condensed font-bold uppercase"
                        >
                          Apagar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded bg-[#1a181d] text-[#a8a1b5] text-[10px] font-condensed font-bold"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="p-1.5 rounded text-[#8a8299] hover:text-[#ff6165] hover:bg-[#1a181d] shrink-0 transition"
                        title="Remover do histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
