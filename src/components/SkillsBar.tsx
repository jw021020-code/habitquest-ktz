'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Coins,
  Heart,
  Lock,
  Shield,
  Sparkles,
  Sword,
  Users,
  Zap,
} from 'lucide-react';
import { CombatHeroClass, PlayableHeroClass } from '@/lib/game/items';
import { CLASS_INFO, CLASS_SKILLS, CLASS_UNLOCK_LEVEL, ClassSkill } from '@/lib/game/skills';

interface SkillsBarProps {
  heroClass: PlayableHeroClass;
  level: number;
  mp: number;
  guardCharges?: number;
  critGuarantee?: boolean;
  shadowCharges?: number;
  dailySkillCounts?: Record<string, number>;
  onChangeClass: (next: CombatHeroClass) => void;
  onCastSkill: (skill: ClassSkill) => void;
}

const COMBAT_CLASSES: CombatHeroClass[] = ['healer', 'warrior', 'rogue', 'wizard'];

function getSkillIcon(kind: ClassSkill['kind']) {
  switch (kind) {
    case 'damage':
      return <Sword className="w-5 h-5 text-[#ff6165]" />;
    case 'heal':
      return <Heart className="w-5 h-5 text-[#24cc8f]" />;
    case 'gold':
      return <Coins className="w-5 h-5 text-[#ffbe5d]" />;
    case 'stance':
      return <Sparkles className="w-5 h-5 text-[#ffbe5d]" />;
    case 'buff':
      return <Shield className="w-5 h-5 text-[#925cf3]" />;
  }
}

export function SkillsBar({
  heroClass,
  level,
  mp,
  guardCharges = 0,
  critGuarantee = false,
  shadowCharges = 0,
  dailySkillCounts = {},
  onChangeClass,
  onCastSkill,
}: SkillsBarProps) {
  const [expanded, setExpanded] = useState(true);
  const [pendingClass, setPendingClass] = useState<CombatHeroClass | null>(null);

  const canChooseClass = level >= CLASS_UNLOCK_LEVEL && heroClass === 'apprentice';
  const isLocked = heroClass !== 'apprentice';
  const skills = CLASS_SKILLS[heroClass] ?? [];
  const levelsRemaining = Math.max(0, CLASS_UNLOCK_LEVEL - level);
  const currentMeta = CLASS_INFO[heroClass];

  return (
    <section className="max-w-7xl w-full mx-auto px-4 pt-3 select-none">
      <div className="bg-[#23202a] border border-[#3a3447] rounded-md overflow-hidden shadow-md">
        {/* Topo da Gaveta de Habilidades */}
        <div className="bg-[#2c2836] border-b border-[#3a3447] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mr-1">
              Classe:
            </span>

            {heroClass === 'apprentice' ? (
              <>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-condensed font-bold border ${CLASS_INFO.apprentice.badgeClass}`}
                >
                  🌱 Aprendiz
                </span>

                {COMBAT_CLASSES.map((cls) => {
                  const info = CLASS_INFO[cls];
                  return (
                    <button
                      key={cls}
                      disabled={!canChooseClass}
                      onClick={() => setPendingClass(cls)}
                      title={
                        canChooseClass
                          ? `Escolher ${info.label} (${info.subtitle} · ${info.primaryAttr})`
                          : `Alcance o Nível ${CLASS_UNLOCK_LEVEL} para liberar ${info.label}`
                      }
                      className={`px-2.5 py-1 rounded text-xs font-condensed font-bold border flex items-center gap-1 transition ${
                        canChooseClass
                          ? 'bg-[#1a181d] text-[#cfc8dc] border-[#3a3447] hover:text-white hover:border-[#925cf3]'
                          : 'bg-[#1a181d]/60 text-[#6e677d] border-[#2c2836] cursor-not-allowed'
                      }`}
                    >
                      {!canChooseClass && <Lock className="w-3 h-3" />}
                      <span>{info.label}</span>
                      <span className="text-[10px] opacity-75">({info.primaryAttr})</span>
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-condensed font-bold border ${currentMeta.badgeClass}`}
                >
                  {currentMeta.label} · {currentMeta.subtitle} ({currentMeta.primaryAttr})
                </span>
                <span
                  className="text-[11px] font-condensed text-[#a8a1b5] flex items-center gap-1"
                  title="Após escolher sua classe inicial, só é possível trocar usando o Orbe do Renascimento."
                >
                  <Lock className="w-3 h-3 text-[#ffbe5d]" />
                  Travada até o Renascimento
                </span>
              </div>
            )}

            {/* Indicadores de Posturas/Buffs Ativos */}
            {guardCharges > 0 && (
              <span className="text-[10px] font-condensed font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                🛡️ Barreira ({guardCharges}x)
              </span>
            )}
            {critGuarantee && (
              <span className="text-[10px] font-condensed font-bold px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-500/40">
                🎯 Crítico Garantido
              </span>
            )}
            {shadowCharges > 0 && (
              <span className="text-[10px] font-condensed font-bold px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/40">
                🌑 Passos Sombrios ({shadowCharges}x)
              </span>
            )}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-condensed font-bold text-[#d6c7ff] hover:text-white px-2 py-1 rounded bg-[#1a181d] border border-[#3a3447]"
          >
            <Zap className="w-3.5 h-3.5 text-[#50b5e9] fill-[#50b5e9]" />
            <span>Habilidades ({mp} MP)</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Confirmação de Escolha Definitiva de Classe */}
        {pendingClass && canChooseClass && (
          <div className="bg-[#271b3d] border-b border-[#925cf3] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-white">
              <strong className="text-[#ffbe5d] uppercase font-condensed mr-1.5">
                Confirmar Classe Definitiva: {CLASS_INFO[pendingClass].label}?
              </strong>
              <span className="text-[#d6c7ff]">
                ({CLASS_INFO[pendingClass].subtitle} · Foco em{' '}
                {CLASS_INFO[pendingClass].primaryAttr} · +50% em itens da classe). Após escolher,{' '}
                <strong>não será possível trocar</strong> até realizar o Renascimento!
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  onChangeClass(pendingClass);
                  setPendingClass(null);
                }}
                className="px-3 py-1.5 rounded bg-[#24cc8f] hover:brightness-110 text-[#1a181d] font-condensed font-bold uppercase"
              >
                Confirmar {CLASS_INFO[pendingClass].label}
              </button>
              <button
                onClick={() => setPendingClass(null)}
                className="px-3 py-1.5 rounded bg-[#1a181d] border border-[#3a3447] text-[#a8a1b5] hover:text-white font-condensed font-bold uppercase"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo da Gaveta */}
        {expanded && (
          <div className="p-3 space-y-2.5">
            {heroClass === 'apprentice' && (
              <div
                className={`rounded-md px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border ${
                  canChooseClass
                    ? 'bg-[#271b3d] border-[#ffbe5d]/60 text-white'
                    : 'bg-[#1a181d] border-[#3a3447] text-[#cfc8dc]'
                }`}
              >
                {canChooseClass ? (
                  <div>
                    <span className="font-condensed font-bold text-[#ffbe5d] uppercase mr-1.5">
                      ✨ Nível {CLASS_UNLOCK_LEVEL} Alcançado!
                    </span>
                    Escolha acima sua 1ª Classe (<strong>Escudeiro</strong>,{' '}
                    <strong>Espadachim</strong>, <strong>Batedor</strong> ou{' '}
                    <strong>Noviço Arcano</strong>). A escolha é permanente até o Renascimento!
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="font-condensed font-bold text-white uppercase mr-1.5">
                        🌱 Jornada do Aprendiz:
                      </span>
                      Use suas habilidades básicas abaixo e alcance o{' '}
                      <strong className="text-[#ffbe5d]">Nível {CLASS_UNLOCK_LEVEL}</strong> para
                      escolher sua 1ª Classe!
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-[#271b3d] border border-[#6133b4] text-[#ffbe5d] font-condensed font-bold shrink-0">
                      Nv.{level}/{CLASS_UNLOCK_LEVEL} (Faltam {levelsRemaining})
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {skills.map((skill) => {
                const usedToday = dailySkillCounts[skill.id] ?? 0;
                const remainingToday = skill.dailyLimit ? Math.max(0, skill.dailyLimit - usedToday) : null;
                const limitReached = remainingToday !== null && remainingToday <= 0;
                const canCast = mp >= skill.mpCost && !limitReached;
                return (
                  <div
                    key={skill.id}
                    className={`flex items-stretch rounded-md border overflow-hidden transition ${
                      canCast
                        ? 'bg-[#1a181d] border-[#3a3447] hover:border-[#50b5e9]/60'
                        : 'bg-[#1a181d]/60 border-[#2c2836] opacity-60'
                    }`}
                  >
                    <div className="w-11 bg-[#271b3d] border-r border-[#3a3447] flex items-center justify-center shrink-0">
                      {getSkillIcon(skill.kind)}
                    </div>

                    <div className="flex-1 px-3 py-2 min-w-0 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-condensed font-bold text-white truncate">
                          {skill.name}
                        </span>
                        {skill.isGroup && (
                          <span className="text-[9px] font-condensed font-bold uppercase px-1.5 py-0.2 rounded bg-[#36205d] text-[#d6c7ff] border border-[#925cf3]/50 flex items-center gap-0.5 shrink-0">
                            <Users className="w-2.5 h-2.5" />
                            Grupo KTZ
                          </span>
                        )}
                        {remainingToday !== null && (
                          <span
                            className={`text-[9px] font-condensed font-bold uppercase px-1.5 py-0.2 rounded border shrink-0 ${
                              limitReached
                                ? 'bg-[#ff6165]/15 text-[#ff8b8e] border-[#ff6165]/40'
                                : 'bg-[#24cc8f]/15 text-[#24cc8f] border-[#24cc8f]/40'
                            }`}
                          >
                            {remainingToday}/{skill.dailyLimit} hoje
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#a8a1b5] line-clamp-2">
                        {skill.description}
                      </div>
                    </div>

                    <button
                      disabled={!canCast}
                      onClick={() => onCastSkill(skill)}
                      title={`${skill.name}: ${skill.description}`}
                      className={`w-18 sm:w-20 shrink-0 flex flex-col items-center justify-center gap-0.5 border-l font-condensed font-bold transition ${
                        canCast
                          ? 'bg-[#50b5e9]/15 hover:bg-[#50b5e9]/30 border-[#50b5e9]/40 text-[#50b5e9] cursor-pointer'
                          : 'bg-[#23202a] border-[#3a3447] text-[#6e677d] cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{skill.mpCost}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider">
                        {limitReached ? 'Limite' : 'Usar MP'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {isLocked && (
              <p className="text-[10px] text-[#8a8299]">
                💡 Itens da sua classe concedem <strong className="text-[#24cc8f]">+50% de atributos</strong>. Habilidades de Grupo beneficiam toda a Guilda KTZ em tempo real!
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
