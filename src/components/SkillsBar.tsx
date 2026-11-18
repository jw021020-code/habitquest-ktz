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
  Zap,
} from 'lucide-react';
import { CombatHeroClass, PlayableHeroClass } from '@/lib/game/items';
import { CLASS_INFO, CLASS_SKILLS, CLASS_UNLOCK_LEVEL, ClassSkill } from '@/lib/game/skills';

interface SkillsBarProps {
  heroClass: PlayableHeroClass;
  level: number;
  mp: number;
  onChangeClass: (next: CombatHeroClass) => void;
  onCastSkill: (skill: ClassSkill) => void;
}

const COMBAT_CLASSES: CombatHeroClass[] = ['warrior', 'wizard', 'rogue', 'healer'];

function getSkillIcon(kind: ClassSkill['kind']) {
  switch (kind) {
    case 'damage':
      return <Sword className="w-5 h-5 text-[#ff6165]" />;
    case 'heal':
      return <Heart className="w-5 h-5 text-[#24cc8f]" />;
    case 'xp':
      return <Sparkles className="w-5 h-5 text-[#ffbe5d]" />;
    case 'gold':
      return <Coins className="w-5 h-5 text-[#ffbe5d]" />;
    case 'buff':
      return <Shield className="w-5 h-5 text-[#925cf3]" />;
  }
}

export function SkillsBar({
  heroClass,
  level,
  mp,
  onChangeClass,
  onCastSkill,
}: SkillsBarProps) {
  const [expanded, setExpanded] = useState(true);
  const canChooseClass = level >= CLASS_UNLOCK_LEVEL;
  const skills = CLASS_SKILLS[heroClass] ?? [];
  const levelsRemaining = Math.max(0, CLASS_UNLOCK_LEVEL - level);

  return (
    <section className="max-w-7xl w-full mx-auto px-4 pt-3 select-none">
      <div className="bg-[#23202a] border border-[#3a3447] rounded-md overflow-hidden shadow-md">
        {/* Topo da Gaveta de Habilidades estilo Habitica */}
        <div className="bg-[#2c2836] border-b border-[#3a3447] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mr-1">
              Classe:
            </span>

            {heroClass === 'apprentice' && (
              <span
                className={`px-2.5 py-1 rounded text-xs font-condensed font-bold border ${CLASS_INFO.apprentice.badgeClass}`}
              >
                🌱 Aprendiz
              </span>
            )}

            {COMBAT_CLASSES.map((cls) => {
              const info = CLASS_INFO[cls];
              const active = heroClass === cls;
              return (
                <button
                  key={cls}
                  disabled={!canChooseClass}
                  onClick={() => onChangeClass(cls)}
                  title={
                    canChooseClass
                      ? `Mudar para ${info.label}`
                      : `Alcançe o Nível ${CLASS_UNLOCK_LEVEL} para liberar ${info.label}`
                  }
                  className={`px-2.5 py-1 rounded text-xs font-condensed font-bold border flex items-center gap-1 transition ${
                    active
                      ? info.badgeClass
                      : canChooseClass
                        ? 'bg-[#1a181d] text-[#cfc8dc] border-[#3a3447] hover:text-white hover:border-[#925cf3]'
                        : 'bg-[#1a181d]/60 text-[#6e677d] border-[#2c2836] cursor-not-allowed'
                  }`}
                >
                  {!canChooseClass && <Lock className="w-3 h-3" />}
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-condensed font-bold text-[#d6c7ff] hover:text-white px-2 py-1 rounded bg-[#1a181d] border border-[#3a3447]"
          >
            <Zap className="w-3.5 h-3.5 text-[#50b5e9] fill-[#50b5e9]" />
            <span>
              {heroClass === 'apprentice' ? 'Evolução de Classe' : `Magias (${mp} MP)`}
            </span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Conteúdo da Gaveta */}
        {expanded && (
          <div className="p-3">
            {heroClass === 'apprentice' ? (
              !canChooseClass ? (
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-[#cfc8dc]">
                    <span className="font-condensed font-bold text-white uppercase mr-1.5">
                      🌱 Jornada do Aprendiz:
                    </span>
                    Registre seus estudos e treinos para subir até o{' '}
                    <strong className="text-[#ffbe5d]">Nível {CLASS_UNLOCK_LEVEL}</strong> e
                    desbloquear sua Classe definitiva (Guerreiro, Mago, Ladino ou Curandeiro) e suas
                    Habilidades de Mana!
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#271b3d] border border-[#6133b4] text-[#ffbe5d] font-condensed font-bold shrink-0">
                    Faltam {levelsRemaining} {levelsRemaining === 1 ? 'nível' : 'níveis'} (Nv.{level}/
                    {CLASS_UNLOCK_LEVEL})
                  </span>
                </div>
              ) : (
                <div className="bg-[#271b3d] border border-[#ffbe5d]/60 rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-white">
                    <span className="font-condensed font-bold text-[#ffbe5d] uppercase mr-1.5">
                      ✨ Nível {CLASS_UNLOCK_LEVEL} Alcançado!
                    </span>
                    Escolha agora uma das 4 classes acima (<strong>Guerreiro</strong>,{' '}
                    <strong>Mago</strong>, <strong>Ladino</strong> ou <strong>Curandeiro</strong>)
                    para desbloquear suas Habilidades!
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skills.map((skill) => {
                  const canCast = mp >= skill.mpCost;
                  return (
                    <div
                      key={skill.id}
                      className={`flex items-stretch rounded-md border overflow-hidden transition ${
                        canCast
                          ? 'bg-[#1a181d] border-[#3a3447] hover:border-[#50b5e9]/60'
                          : 'bg-[#1a181d]/60 border-[#2c2836] opacity-60'
                      }`}
                    >
                      <div className="w-12 bg-[#271b3d] border-r border-[#3a3447] flex items-center justify-center shrink-0">
                        {getSkillIcon(skill.kind)}
                      </div>

                      <div className="flex-1 px-3 py-2 min-w-0 flex flex-col justify-center">
                        <div className="text-xs sm:text-sm font-condensed font-bold text-white truncate">
                          {skill.name}
                        </div>
                        <div className="text-[11px] text-[#a8a1b5] truncate">
                          {skill.description}
                        </div>
                      </div>

                      <button
                        disabled={!canCast}
                        onClick={() => onCastSkill(skill)}
                        title={`${skill.name}: ${skill.description}`}
                        className={`w-20 shrink-0 flex flex-col items-center justify-center gap-0.5 border-l font-condensed font-bold transition ${
                          canCast
                            ? 'bg-[#50b5e9]/15 hover:bg-[#50b5e9]/30 border-[#50b5e9]/40 text-[#50b5e9] cursor-pointer'
                            : 'bg-[#23202a] border-[#3a3447] text-[#6e677d] cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>{skill.mpCost}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider">Usar MP</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
