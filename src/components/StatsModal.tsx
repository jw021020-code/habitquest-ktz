'use client';

import React, { useRef, useState } from 'react';
import { BarChart3, Database, Download, Plus, RotateCcw, Trophy, Upload, X } from 'lucide-react';
import {
  ACHIEVEMENT_CATEGORIES,
  AchievementCategory,
  ACHIEVEMENTS,
  buildAchievementContext,
  HeroMetrics,
} from '@/lib/game/achievements';
import { Attributes } from '@/lib/game/items';
import { StudyEntry } from './StudyLogCard';
import { WorkoutEntry } from './WorkoutLogCard';

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  level: number;
  rebirths: number;
  unallocatedPoints: number;
  petsCount: number;
  attributes: Attributes;
  metrics: HeroMetrics;
  studyEntries?: StudyEntry[];
  workoutEntries?: WorkoutEntry[];
  onAllocateStat: (stat: keyof Attributes) => void;
  onRebirth: () => void;
  onResetLocal?: () => void;
  onExportSave: () => void;
  onImportSave: (jsonText: string) => void;
}

type ProfileTab = 'stats' | 'achievements' | 'backup';

export function StatsModal({
  open,
  onClose,
  level,
  rebirths,
  unallocatedPoints,
  petsCount,
  attributes,
  metrics,
  studyEntries = [],
  workoutEntries = [],
  onAllocateStat,
  onRebirth,
  onResetLocal,
  onExportSave,
  onImportSave,
}: StatsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ProfileTab>('stats');
  const [achFilter, setAchFilter] = useState<'all' | AchievementCategory>('all');
  const [confirmRebirth, setConfirmRebirth] = useState(false);
  const [confirmResetLocal, setConfirmResetLocal] = useState(false);

  if (!open) return null;

  const ctx = buildAchievementContext(level, metrics, studyEntries, workoutEntries);
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(ctx)).length;
  const filteredAchievements = ACHIEVEMENTS.filter(
    (a) => achFilter === 'all' || a.category === achFilter
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImportSave(text);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#23202a] border border-[#432874] rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Cabeçalho Roxo Estilo Habitica Modal */}
        <div className="bg-[#432874] px-4 py-3 flex items-center justify-between border-b border-[#36205d]">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#ffbe5d]" />
            <h2 className="font-condensed font-bold text-base uppercase tracking-wide text-white">
              Perfil do Herói: Atributos e Conquistas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/20 text-white/80 hover:text-white"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-abas Estilo Perfil do Habitica */}
        <div className="grid grid-cols-3 bg-[#36205d] border-b border-[#271b3d] text-xs font-condensed font-bold uppercase tracking-wider">
          <button
            onClick={() => setTab('stats')}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
              tab === 'stats'
                ? 'border-[#ffbe5d] bg-[#271b3d]/70 text-white'
                : 'border-transparent text-[#d6c7ff]/80 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#ffbe5d]" />
            Atributos {unallocatedPoints > 0 ? `(+${unallocatedPoints})` : ''}
          </button>
          <button
            onClick={() => setTab('achievements')}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
              tab === 'achievements'
                ? 'border-[#ffbe5d] bg-[#271b3d]/70 text-white'
                : 'border-transparent text-[#d6c7ff]/80 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#24cc8f]" />
            Conquistas ({unlockedCount}/{ACHIEVEMENTS.length})
          </button>
          <button
            onClick={() => setTab('backup')}
            className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
              tab === 'backup'
                ? 'border-[#ffbe5d] bg-[#271b3d]/70 text-white'
                : 'border-transparent text-[#d6c7ff]/80 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#50b5e9]" />
            Backup & Orbe
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {tab === 'stats' && (
            <>
              {/* Atributos + Distribuição de Pontos Estilo Habitica */}
              <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#cfc8dc] font-condensed font-bold uppercase tracking-wider">
                    Atributos Totais (Equipamentos + Buffs + Pontos de Nível)
                  </span>
                  <span className="font-condensed font-bold text-[#24cc8f]">
                    Pontos Livres: {unallocatedPoints}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(
                    [
                      {
                        key: 'str',
                        label: 'Força (STR)',
                        desc: 'Aumenta o dano causado aos Bosses e chance de crítico.',
                        val: attributes.str,
                        color: 'text-rose-300',
                      },
                      {
                        key: 'int',
                        label: 'Inteligência (INT)',
                        desc: 'Aumenta a Mana máxima, a regeneração de MP e o dano arcano nos Bosses.',
                        val: attributes.int,
                        color: 'text-sky-300',
                      },
                      {
                        key: 'con',
                        label: 'Constituição (CON)',
                        desc: 'Mitiga o dano de Estamina sofrido nos contra-ataques do Boss.',
                        val: attributes.con,
                        color: 'text-emerald-300',
                      },
                      {
                        key: 'per',
                        label: 'Percepção (PER)',
                        desc: 'Aumenta o Ouro ganho e a chance de drops.',
                        val: attributes.per,
                        color: 'text-amber-300',
                      },
                    ] as {
                      key: keyof Attributes;
                      label: string;
                      desc: string;
                      val: number;
                      color: string;
                    }[]
                  ).map((st) => (
                    <div
                      key={st.key}
                      className="bg-[#23202a] border border-[#3a3447] rounded-md p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className={`text-xs font-condensed font-bold uppercase ${st.color}`}>
                          {st.label}
                        </div>
                        <div className="text-xl font-condensed font-bold text-white tabular-nums my-0.5">
                          {st.val}
                        </div>
                        <div className="text-[11px] text-[#a8a1b5]">{st.desc}</div>
                      </div>
                      {unallocatedPoints > 0 && (
                        <button
                          onClick={() => onAllocateStat(st.key)}
                          className="px-2.5 py-2 rounded bg-[#24cc8f] hover:brightness-110 text-[#1a181d] font-condensed font-bold text-xs flex items-center gap-1 shrink-0"
                          title={`Adicionar +1 em ${st.label}`}
                        >
                          <Plus className="w-3.5 h-3.5" />1
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Métricas Gerais */}
              <div>
                <h3 className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2">
                  Histórico de Batalha & Progresso
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: 'Registros', value: metrics.tasksCompleted },
                    { label: 'Bosses', value: metrics.bossesDefeated },
                    { label: 'Críticos', value: metrics.criticalHits },
                    { label: 'Ouro Total', value: metrics.totalGoldEarned },
                    { label: 'Armoires', value: metrics.armoireOpened },
                    { label: 'Renascimentos', value: rebirths },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="bg-[#1a181d] border border-[#3a3447] rounded-md p-2.5 text-center"
                    >
                      <div className="text-base font-condensed font-bold text-white tabular-nums">
                        {m.value}
                      </div>
                      <div className="text-[11px] text-[#a8a1b5]">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'achievements' && (
            <div className="space-y-3">
              {/* Filtro por Categoria */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setAchFilter('all')}
                  className={`px-2.5 py-1 rounded text-[11px] font-condensed font-bold transition cursor-pointer ${
                    achFilter === 'all'
                      ? 'bg-[#6133b4] text-white'
                      : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white border border-[#3a3447]'
                  }`}
                >
                  Todas ({ACHIEVEMENTS.length})
                </button>
                {ACHIEVEMENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setAchFilter(cat.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-condensed font-bold transition cursor-pointer ${
                      achFilter === cat.id
                        ? 'bg-[#6133b4] text-white'
                        : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white border border-[#3a3447]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredAchievements.map((ach) => {
                  const unlocked = ach.check(ctx);
                  const cur = ach.getCurrent(ctx);
                  const pct = Math.max(0, Math.min(100, Math.round((cur / ach.target) * 100)));
                  return (
                    <div
                      key={ach.id}
                      className={`p-3 rounded-md border flex items-start gap-3 ${
                        unlocked
                          ? 'bg-[#2c2240] border-[#925cf3]'
                          : 'bg-[#1a181d] border-[#3a3447]'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-md bg-[#23202a] border border-[#3a3447] flex items-center justify-center text-lg shrink-0 ${
                          unlocked ? '' : 'opacity-50 grayscale'
                        }`}
                      >
                        {ach.icon}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm font-condensed font-bold text-white truncate">
                            {ach.title}
                          </p>
                          <span
                            className={`text-[10px] font-condensed font-bold tabular-nums shrink-0 ${
                              unlocked ? 'text-[#24cc8f]' : 'text-[#ffbe5d]'
                            }`}
                          >
                            {ach.formatProgress(ctx)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#a8a1b5]">{ach.description}</p>
                        <div className="w-full h-1.5 rounded-full bg-[#23202a] border border-[#3a3447] overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              unlocked ? 'bg-[#24cc8f]' : 'bg-[#6133b4]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'backup' && (
            <div className="space-y-3">
              <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-condensed font-bold text-white">
                    Orbe do Renascimento
                  </p>
                  <p className="text-xs text-[#a8a1b5]">
                    Reinicia para o Nível 1 (exige Nível 10+) mantendo equipamentos e mascotes, e
                    concede +50 GP.
                  </p>
                </div>
                {level < 10 ? (
                  <span className="px-3 py-2 rounded bg-[#23202a] border border-[#3a3447] text-[#8a8299] text-xs font-condensed font-bold shrink-0">
                    Nv. 10+ necessário
                  </span>
                ) : confirmRebirth ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onRebirth();
                        setConfirmRebirth(false);
                      }}
                      className="px-3 py-2 rounded bg-[#ff6165] hover:brightness-110 text-white text-xs font-condensed font-bold uppercase"
                    >
                      Confirmar Reset
                    </button>
                    <button
                      onClick={() => setConfirmRebirth(false)}
                      className="px-2.5 py-2 rounded bg-[#23202a] border border-[#3a3447] text-[#a8a1b5] text-xs font-condensed font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRebirth(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#24cc8f]/20 hover:bg-[#24cc8f]/30 border border-[#24cc8f]/40 text-[#24cc8f] text-xs font-condensed font-bold uppercase shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Renascer
                  </button>
                )}
              </div>

              {onResetLocal && (
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-condensed font-bold text-white">
                      Zerar Progresso Local
                    </p>
                    <p className="text-xs text-[#a8a1b5]">
                      Limpa estudos, treinos, inventário e nível salvos neste navegador para iniciar do zero.
                    </p>
                  </div>
                  {confirmResetLocal ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onResetLocal();
                          setConfirmResetLocal(false);
                        }}
                        className="px-3 py-2 rounded bg-[#ff6165] hover:brightness-110 text-white text-xs font-condensed font-bold uppercase"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmResetLocal(false)}
                        className="px-2.5 py-2 rounded bg-[#23202a] border border-[#3a3447] text-[#a8a1b5] text-xs font-condensed font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmResetLocal(true)}
                      className="px-3 py-2 rounded bg-[#ff6165]/15 hover:bg-[#ff6165]/25 border border-[#ff6165]/40 text-[#ff8b8e] text-xs font-condensed font-bold uppercase shrink-0"
                    >
                      Zerar Local
                    </button>
                  )}
                </div>
              )}

              <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-condensed font-bold text-white">
                    Backup Local (.json)
                  </p>
                  <p className="text-xs text-[#a8a1b5]">
                    Exporte seu progresso completo ou restaure um arquivo salvo anteriormente.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={onExportSave}
                    className="flex items-center gap-1 px-3 py-2 rounded bg-[#6133b4] hover:bg-[#7241cc] text-white text-xs font-condensed font-bold uppercase"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-2 rounded bg-[#23202a] hover:bg-[#2c2836] border border-[#3a3447] text-slate-200 text-xs font-condensed font-bold uppercase"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Importar
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
