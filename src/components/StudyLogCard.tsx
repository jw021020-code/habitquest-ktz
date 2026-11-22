'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { PlayerStats, previewStudyReward } from '@/lib/game/formulas';
import { Attributes } from '@/lib/game/items';

export interface StudyEntry {
  id: string;
  subject: string;
  minutes: number;
  didQuestions: boolean;
  questionsDone: number;
  didEssay?: boolean;
  essaysDone?: number;
  createdAt: string;
  loggedAt?: string;
}

interface StudyLogCardProps {
  entries: StudyEntry[];
  stats: PlayerStats;
  totalAttributes: Attributes;
  bossAttack: number;
  onAddStudy: (entry: Omit<StudyEntry, 'id' | 'createdAt'>) => void;
  onDeleteStudy: (id: string) => void;
}

const TIME_PRESETS = [0, 15, 30, 60, 90, 120];

export function StudyLogCard({
  entries,
  stats,
  totalAttributes,
  bossAttack,
  onAddStudy,
  onDeleteStudy,
}: StudyLogCardProps) {
  const [subject, setSubject] = useState('');
  const [minutesInput, setMinutesInput] = useState<string>('30');
  const [didQuestions, setDidQuestions] = useState(false);
  const [questionsInput, setQuestionsInput] = useState<string>('10');
  const [didEssay, setDidEssay] = useState(false);
  const [essaysInput, setEssaysInput] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const parsedMinutes = Math.max(0, parseInt(minutesInput, 10) || 0);
  const parsedQuestions = Math.max(0, parseInt(questionsInput, 10) || 0);
  const parsedEssays = Math.max(0, parseInt(essaysInput, 10) || 0);

  const hasQuestions = didQuestions && parsedQuestions > 0;
  const hasEssays = didEssay && parsedEssays > 0;
  const hasEffort = parsedMinutes > 0 || hasQuestions || hasEssays;
  const canSubmit = hasEffort && (subject.trim().length > 0 || hasQuestions || hasEssays);

  const preview = previewStudyReward(
    stats,
    parsedMinutes,
    didQuestions,
    parsedQuestions,
    totalAttributes,
    bossAttack,
    undefined,
    didEssay,
    parsedEssays
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const cleanSubject =
      subject.trim() ||
      (hasEssays && !hasQuestions
        ? 'Redação'
        : hasQuestions && !hasEssays
          ? 'Bateria de Questões'
          : 'Questões e Redação');

    onAddStudy({
      subject: cleanSubject,
      minutes: parsedMinutes,
      didQuestions,
      questionsDone: didQuestions ? parsedQuestions : 0,
      didEssay,
      essaysDone: didEssay ? parsedEssays : 0,
    });

    setSubject('');
    setDidQuestions(false);
    setDidEssay(false);
  };

  const filteredEntries = entries.filter((e) =>
    e.subject.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const totalMinutes = entries.reduce((acc, cur) => acc + cur.minutes, 0);
  const totalQuestions = entries.reduce((acc, cur) => acc + (cur.questionsDone || 0), 0);
  const totalEssays = entries.reduce((acc, cur) => acc + (cur.essaysDone || 0), 0);

  return (
    <section className="flex flex-col bg-[#23202a] border border-[#342e40] rounded-md overflow-hidden shadow-lg">
      {/* Cabeçalho da Coluna estilo Habitica */}
      <div className="bg-[#2c2836] border-b border-[#3a3447] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#ffbe5d]" />
          <h2 className="font-condensed font-bold text-base tracking-wide text-white uppercase">
            Estudo Teórico
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-[#36205d] border border-[#6133b4] text-[11px] font-condensed font-bold text-[#d6c7ff]">
            {entries.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-condensed text-[#a8a1b5]">
          <span className="bg-[#1a181d] border border-[#3a3447] px-2 py-0.5 rounded text-[#ffbe5d] font-bold">
            {totalMinutes} min
          </span>
          <span className="bg-[#1a181d] border border-[#3a3447] px-2 py-0.5 rounded text-[#24cc8f] font-bold">
            {totalQuestions} questões
          </span>
          {totalEssays > 0 && (
            <span className="bg-[#1a181d] border border-[#3a3447] px-2 py-0.5 rounded text-[#d6c7ff] font-bold">
              {totalEssays} {totalEssays === 1 ? 'redação' : 'redações'}
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Caixa de Registro Rápido no topo da coluna */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3.5 space-y-3 text-sm shadow-inner"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-condensed font-bold text-[#cfc8dc] mb-1">
                Matéria{parsedMinutes > 0 ? '*' : ''}
              </label>
              <input
                type="text"
                required={parsedMinutes > 0 && !hasQuestions && !hasEssays}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex.: Português, Matemática, Direito..."
                className="w-full bg-[#23202a] border border-[#3a3447] rounded px-3 py-2 text-sm text-[#f3f1f7] placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
              />
            </div>

            <div>
              <label className="block text-xs font-condensed font-bold text-[#cfc8dc] mb-1">
                Tempo (min)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={minutesInput}
                onChange={(e) => setMinutesInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full bg-[#23202a] border border-[#3a3447] rounded px-3 py-2 text-sm text-[#ffbe5d] font-bold focus:outline-none focus:border-[#925cf3]"
              />
            </div>
          </div>

          {/* Botões rápidos de tempo */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[#8a8299] mr-1">Tempo rápido:</span>
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMinutesInput(String(preset))}
                className={`px-2 py-0.5 rounded text-[11px] font-condensed font-bold border transition ${
                  parsedMinutes === preset
                    ? 'bg-[#6133b4] border-[#925cf3] text-white'
                    : 'bg-[#23202a] border-[#3a3447] text-[#a8a1b5] hover:text-white'
                }`}
              >
                {preset}m
              </button>
            ))}
          </div>

          {/* Fez questões? */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#2c2836]">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#e6dcff]">
              <input
                type="checkbox"
                checked={didQuestions}
                onChange={(e) => setDidQuestions(e.target.checked)}
                className="w-4 h-4 rounded accent-[#6133b4]"
              />
              <HelpCircle className="w-3.5 h-3.5 text-[#50b5e9]" />
              <span className="font-medium">Fez questões nesse estudo?</span>
            </label>

            {didQuestions && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#a8a1b5]">Quantas feitas:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={questionsInput}
                  onChange={(e) => setQuestionsInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-24 bg-[#23202a] border border-[#3a3447] rounded px-2.5 py-1 text-sm text-[#24cc8f] font-bold text-center focus:outline-none focus:border-[#925cf3]"
                />
              </div>
            )}
          </div>

          {/* Fez redação? */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#2c2836]">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#e6dcff]">
              <input
                type="checkbox"
                checked={didEssay}
                onChange={(e) => setDidEssay(e.target.checked)}
                className="w-4 h-4 rounded accent-[#6133b4]"
              />
              <FileText className="w-3.5 h-3.5 text-[#d6c7ff]" />
              <span className="font-medium">Fez redação?</span>
            </label>

            {didEssay && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#a8a1b5]">Quantas:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={essaysInput}
                  onChange={(e) => setEssaysInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="1"
                  className="w-24 bg-[#23202a] border border-[#3a3447] rounded px-2.5 py-1 text-sm text-[#d6c7ff] font-bold text-center focus:outline-none focus:border-[#925cf3]"
                />
              </div>
            )}
          </div>

          {/* Prévia em Tempo Real de Recompensa e Contra-Ataque */}
          <div className="bg-[#23202a] border border-[#342e40] rounded px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-condensed">
            <span className="text-[#a8a1b5]">Estimativa base:</span>
            <div className="flex flex-wrap items-center gap-2.5 font-bold">
              <span className="text-[#ffbe5d]">+{preview.xp} XP</span>
              <span className="text-[#ffbe5d]">+{preview.gold} GP</span>
              <span className="text-[#24cc8f]">-{preview.bossDamage} Boss HP</span>
              <span className="text-[#ff8b8e]">-{preview.staminaLost} STA</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider transition shadow-md ${
              canSubmit
                ? 'bg-[#6133b4] hover:bg-[#7241cc] text-white cursor-pointer'
                : 'bg-[#23202a] text-[#6e677d] border border-[#3a3447] cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            Registrar Estudo & Atacar Boss
          </button>
        </form>

        {/* Filtro rápido de registros */}
        {entries.length > 2 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8a8299] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar histórico por matéria..."
              className="w-full bg-[#1a181d] border border-[#3a3447] rounded pl-8 pr-3 py-1.5 text-xs text-[#f3f1f7] placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
            />
          </div>
        )}

        {/* Lista de Cartões Estilo Habitica Task Card */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
          {filteredEntries.length === 0 ? (
            <div className="bg-[#1a181d]/60 border border-dashed border-[#3a3447] rounded-md py-8 px-4 text-center">
              <p className="text-xs text-[#8a8299]">
                Nenhum estudo registrado.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isConfirming = confirmDeleteId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="group flex items-stretch bg-[#2c2836] hover:bg-[#322d3d] border border-[#3a3447] rounded-md overflow-hidden transition shadow-sm"
                >
                  <div className="w-10 bg-[#ffbe5d] flex items-center justify-center shrink-0 text-[#1a181d]">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>

                  <div className="flex-1 px-3 py-2.5 min-w-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{entry.subject}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                        {entry.minutes > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#1a181d] text-[#ffbe5d] font-condensed font-bold">
                            <Clock className="w-3 h-3" />
                            {entry.minutes} min
                          </span>
                        )}
                        {entry.didQuestions && entry.questionsDone > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#1a181d] text-[#24cc8f] font-condensed font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {entry.questionsDone} questões feitas
                          </span>
                        )}
                        {entry.didEssay && (entry.essaysDone ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#1a181d] text-[#d6c7ff] font-condensed font-bold">
                            <FileText className="w-3 h-3" />
                            {entry.essaysDone} {(entry.essaysDone ?? 0) === 1 ? 'redação' : 'redações'}
                          </span>
                        )}
                        <span className="text-[#8a8299]">{entry.createdAt}</span>
                      </div>
                    </div>

                    {isConfirming ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            onDeleteStudy(entry.id);
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
