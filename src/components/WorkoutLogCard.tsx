'use client';

import React, { useState } from 'react';
import { Check, Dumbbell, Flame, Plus, Sparkles, Trash2 } from 'lucide-react';
import { PlayerStats, previewWorkoutReward } from '@/lib/game/formulas';
import { Attributes } from '@/lib/game/items';
import {
  CARDIO_OPTIONS,
  CardioType,
  formatCardioEntryBadge,
  getCardioEquivalentKm,
  getCardioOption,
} from '@/lib/game/cardio';

export interface WorkoutEntry {
  id: string;
  cardio: boolean;
  musculacao: boolean;
  cardioType?: CardioType;
  km?: number;
  durationMinutes?: number;
  muscleGroup?: string;
  notes?: string;
  createdAt: string;
  loggedAt?: string;
}

interface WorkoutLogCardProps {
  entries: WorkoutEntry[];
  stats: PlayerStats;
  totalAttributes: Attributes;
  bossAttack: number;
  todayHasCardio?: boolean;
  todayHasMusculacao?: boolean;
  onAddWorkout: (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => void;
  onDeleteWorkout: (id: string) => void;
}

type WorkoutTab = 'musculacao' | 'cardio';

export function WorkoutLogCard({
  entries,
  stats,
  totalAttributes,
  bossAttack,
  todayHasCardio = false,
  todayHasMusculacao = false,
  onAddWorkout,
  onDeleteWorkout,
}: WorkoutLogCardProps) {
  const [activeTab, setActiveTab] = useState<WorkoutTab>('musculacao');
  const [cardioType, setCardioType] = useState<CardioType>('running');
  const [valueInput, setValueInput] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedOpt = getCardioOption(cardioType);
  const parsedRaw = Math.max(0, parseFloat(valueInput.replace(',', '.')) || 0);

  const cardioKmEq =
    activeTab === 'cardio'
      ? getCardioEquivalentKm({
          cardio: true,
          cardioType,
          km: selectedOpt.unit === 'km' ? parsedRaw : undefined,
          durationMinutes: selectedOpt.unit === 'min' ? parsedRaw : undefined,
        })
      : 0;

  const canSubmit = activeTab === 'musculacao' || (activeTab === 'cardio' && cardioKmEq > 0);

  const hasDualDailyBonus =
    (activeTab === 'musculacao' && todayHasCardio && !todayHasMusculacao) ||
    (activeTab === 'cardio' && todayHasMusculacao && !todayHasCardio);

  const preview = previewWorkoutReward(
    stats,
    activeTab === 'cardio',
    activeTab === 'musculacao',
    totalAttributes,
    bossAttack,
    undefined,
    cardioKmEq,
    hasDualDailyBonus
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (activeTab === 'musculacao') {
      onAddWorkout({
        cardio: false,
        musculacao: true,
        muscleGroup: muscleGroup.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setMuscleGroup('');
      setNotes('');
    } else {
      onAddWorkout({
        cardio: true,
        musculacao: false,
        cardioType,
        km: selectedOpt.unit === 'km' ? Math.min(selectedOpt.maxRaw, parsedRaw) : undefined,
        durationMinutes:
          selectedOpt.unit === 'min' ? Math.min(selectedOpt.maxRaw, Math.round(parsedRaw)) : undefined,
        notes: notes.trim() || undefined,
      });
      setValueInput('');
      setNotes('');
    }
  };

  const totalRunEqKm =
    Math.round(entries.reduce((acc, w) => acc + getCardioEquivalentKm(w), 0) * 10) / 10;
  const totalMuscCount = entries.filter((w) => w.musculacao).length;
  const totalCardioCount = entries.filter((w) => w.cardio).length;

  return (
    <section className="flex flex-col bg-[#23202a] border border-[#342e40] rounded-md overflow-hidden shadow-lg">
      {/* Cabeçalho da Coluna */}
      <div className="bg-[#2c2836] border-b border-[#3a3447] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-[#24cc8f]" />
          <h2 className="font-condensed font-bold text-base tracking-wide text-white uppercase">
            Treino Físico
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-[#36205d] border border-[#6133b4] text-[11px] font-condensed font-bold text-[#d6c7ff]">
            {entries.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-condensed text-[#a8a1b5]">
          <span className="bg-[#1a181d] border border-[#3a3447] px-2 py-0.5 rounded text-[#d6c7ff] font-bold">
            {totalMuscCount} musc.
          </span>
          <span className="bg-[#1a181d] border border-[#3a3447] px-2 py-0.5 rounded text-[#ffbe5d] font-bold">
            {totalCardioCount} cárdio · {totalRunEqKm.toFixed(1).replace('.', ',')} km eq.
          </span>
        </div>
      </div>

      {/* Sub-abas Dedicadas: Musculação | Cárdio */}
      <div className="bg-[#1f1c26] border-b border-[#342e40] px-3.5 pt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('musculacao')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t text-xs font-condensed font-bold uppercase tracking-wide border-b-2 transition cursor-pointer ${
            activeTab === 'musculacao'
              ? 'bg-[#2c2836] text-[#d6c7ff] border-[#925cf3]'
              : 'text-[#a8a1b5] border-transparent hover:text-white hover:bg-[#23202a]'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          Musculação
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cardio')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-t text-xs font-condensed font-bold uppercase tracking-wide border-b-2 transition cursor-pointer ${
            activeTab === 'cardio'
              ? 'bg-[#2c2836] text-[#ffbe5d] border-[#ffbe5d]'
              : 'text-[#a8a1b5] border-transparent hover:text-white hover:bg-[#23202a]'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Cárdio
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3.5 space-y-3 text-sm shadow-inner"
        >
          {activeTab === 'musculacao' ? (
            <div>
              <label className="block text-xs font-condensed font-bold text-[#cfc8dc] mb-1">
                Grupo Muscular / Foco (opcional)
              </label>
              <input
                type="text"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                placeholder="Ex.: Peito e Tríceps, Costas, Pernas, Full Body..."
                className="w-full bg-[#23202a] border border-[#3a3447] rounded px-3 py-2 text-sm text-[#f3f1f7] placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
              />
            </div>
          ) : (
            <>
              {/* Seletor de Modalidade de Cárdio */}
              <div>
                <label className="block text-xs font-condensed font-bold text-[#cfc8dc] mb-1.5">
                  Modalidade de Cárdio*
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CARDIO_OPTIONS.map((opt) => {
                    const selected = cardioType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setCardioType(opt.id);
                          setValueInput('');
                        }}
                        className={`px-2.5 py-2 rounded border text-left transition cursor-pointer ${
                          selected
                            ? 'bg-[#ffbe5d]/15 border-[#ffbe5d] text-white'
                            : 'bg-[#23202a] border-[#3a3447] text-[#cfc8dc] hover:border-[#6133b4]'
                        }`}
                      >
                        <div className="text-xs font-condensed font-bold flex items-center gap-1.5">
                          <span>{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </div>
                        <div className="text-[10px] text-[#8a8299] mt-0.5 truncate">
                          {opt.unit === 'min' ? 'Em min' : `${opt.factor === 1 ? '1,0x' : opt.factor === 0.5 ? '0,5x' : '0,33x'} km eq.`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-condensed font-bold text-[#ffbe5d]">
                    {selectedOpt.unit === 'min' ? 'Duração (minutos)*' : 'Distância percorrida (km)*'}
                  </label>
                  <span className="text-[11px] text-[#a8a1b5]">
                    Equivalente:{' '}
                    <strong className="text-[#24cc8f]">
                      {cardioKmEq.toFixed(2).replace('.', ',')} km eq.
                    </strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step={selectedOpt.unit === 'min' ? '1' : '0.1'}
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder={selectedOpt.placeholder}
                  className="w-full bg-[#23202a] border border-[#ffbe5d]/40 rounded px-3 py-2 text-sm text-[#f3f1f7] placeholder-[#6e677d] focus:outline-none focus:border-[#ffbe5d]"
                />
                <p className="text-[11px] text-[#8a8299] mt-1">{selectedOpt.hint}</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-condensed font-bold text-[#cfc8dc] mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                activeTab === 'musculacao'
                  ? 'Ex.: Carga progressiva, 50 min de treino'
                  : 'Ex.: Ritmo leve, parque ou esteira'
              }
              className="w-full bg-[#23202a] border border-[#3a3447] rounded px-3 py-2 text-sm text-[#f3f1f7] placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
            />
          </div>

          {hasDualDailyBonus && (
            <div className="bg-[#24cc8f]/15 border border-[#24cc8f]/40 rounded px-3 py-1.5 flex items-center gap-2 text-[11px] font-condensed font-bold text-[#24cc8f]">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Bônus Treino Duplo do Dia ativo! (+25 XP base, +6 GP, +10 Dano)
            </div>
          )}

          {/* Prévia em Tempo Real */}
          <div className="bg-[#23202a] border border-[#342e40] rounded px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-condensed">
            <span className="text-[#a8a1b5]">Estimativa base:</span>
            {canSubmit ? (
              <div className="flex flex-wrap items-center gap-2.5 font-bold">
                <span className="text-[#ffbe5d]">+{preview.xp} XP</span>
                <span className="text-[#ffbe5d]">+{preview.gold} GP</span>
                <span className="text-[#24cc8f]">-{preview.bossDamage} Boss HP</span>
                <span className="text-[#ff8b8e]">-{preview.staminaLost} STA</span>
              </div>
            ) : (
              <span className="text-[#6e677d]">
                {activeTab === 'cardio' ? 'Informe a distância ou duração' : 'Pronto para registrar'}
              </span>
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
            {activeTab === 'musculacao'
              ? 'Registrar Musculação & Atacar Boss'
              : `Registrar ${selectedOpt.label} & Atacar Boss`}
          </button>
        </form>

        {/* Lista de Cartões de Treinos Registrados */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
          {entries.length === 0 ? (
            <div className="bg-[#1a181d]/60 border border-dashed border-[#3a3447] rounded-md py-8 px-4 text-center">
              <p className="text-xs text-[#8a8299]">
                Nenhum treino registrado.
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
                            {formatCardioEntryBadge(entry)}
                          </span>
                        )}
                        {entry.musculacao && (
                          <span className="text-xs font-condensed font-bold px-2 py-0.5 rounded bg-[#925cf3]/20 text-[#d6c7ff] border border-[#925cf3]/40">
                            Musculação{entry.muscleGroup ? ` · ${entry.muscleGroup}` : ''}
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
