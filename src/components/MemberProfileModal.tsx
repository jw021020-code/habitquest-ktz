'use client';

import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Coins,
  Dumbbell,
  Eye,
  Heart,
  PawPrint,
  Shield,
  Sparkles,
  Sword,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { ACHIEVEMENTS, DEFAULT_METRICS } from '@/lib/game/achievements';
import {
  Attributes,
  computeTotalAttributes,
  EQUIPMENT_CATALOG,
  EquipmentSlot,
  EquippedGear,
  getEquipmentById,
  getEquipmentShopIconPath,
  getItemEffectiveStats,
  getItemRarity,
  hasClassAffinity,
  RARITY_META,
} from '@/lib/game/items';
import { ALL_PET_IDS, formatPetName, getPetSpritePath } from '@/lib/game/pets';
import { CLASS_INFO } from '@/lib/game/skills';
import { RemoteProfile } from '@/lib/supabase/data';
import { CharacterAvatar } from './CharacterAvatar';

interface MemberProfileModalProps {
  member: RemoteProfile | null;
  bossStage: number;
  onClose: () => void;
}

const ALL_SLOTS: EquipmentSlot[] = [
  'weapon',
  'shield',
  'armor',
  'head',
  'headAccessory',
  'eyewear',
  'body',
  'back',
];

const SLOT_LABEL: Record<EquipmentSlot, string> = {
  weapon: 'Arma',
  shield: 'Escudo',
  armor: 'Armadura',
  head: 'Capacete',
  headAccessory: 'Acess. Cabeça',
  eyewear: 'Óculos',
  body: 'Acess. Corpo',
  back: 'Capa / Costas',
};

function formatEffectiveStats(stats: Attributes): string {
  const parts: string[] = [];
  if (stats.str) parts.push(`STR +${stats.str}`);
  if (stats.int) parts.push(`INT +${stats.int}`);
  if (stats.con) parts.push(`CON +${stats.con}`);
  if (stats.per) parts.push(`PER +${stats.per}`);
  return parts.join(' · ') || 'Visual';
}

function SlotGrid({
  gear,
  heroClass,
  isCostume,
}: {
  gear: EquippedGear;
  heroClass: RemoteProfile['hero_class'];
  isCostume?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {ALL_SLOTS.map((slot) => {
        const item = getEquipmentById(gear?.[slot]);
        const rarity = item ? getItemRarity(item) : null;
        const rarityMeta = rarity ? RARITY_META[rarity] : null;
        const affinity = item && !isCostume ? hasClassAffinity(item, heroClass) : false;
        const effStats = item && !isCostume ? getItemEffectiveStats(item, heroClass) : null;

        return (
          <div
            key={slot}
            className={`rounded-md border p-2.5 flex flex-col items-center text-center gap-1.5 ${
              item
                ? isCostume
                  ? 'bg-[#1c2b29] border-[#24cc8f]/45'
                  : 'bg-[#1a181d] border-[#6133b4]/60'
                : 'bg-[#1a181d]/50 border-[#342e40] opacity-65'
            }`}
          >
            <div className="w-12 h-12 rounded bg-[#271b3d] border border-[#432874] flex items-center justify-center shrink-0">
              {item ? (
                <img
                  src={getEquipmentShopIconPath(item.id)}
                  alt={item.name}
                  className="w-11 h-11 object-contain [image-rendering:pixelated]"
                />
              ) : (
                <span className="text-[10px] text-[#6e677d]">Vazio</span>
              )}
            </div>

            <div className="w-full min-w-0">
              <div className="text-[10px] font-condensed font-bold uppercase text-[#a8a1b5]">
                {SLOT_LABEL[slot]}
              </div>
              <div className="text-xs font-condensed font-bold text-white truncate">
                {item ? item.name : '—'}
              </div>
            </div>

            {item && rarityMeta && (
              <div className="flex flex-wrap items-center justify-center gap-1">
                <span
                  className={`text-[9px] font-condensed font-bold px-1.5 py-0.2 rounded border ${rarityMeta.badgeClass}`}
                >
                  {rarityMeta.label}
                </span>
                {affinity && (
                  <span className="text-[9px] font-condensed font-bold px-1.5 py-0.2 rounded bg-[#ffbe5d]/20 text-[#ffbe5d] border border-[#ffbe5d]/40">
                    ★ +50%
                  </span>
                )}
              </div>
            )}

            {effStats && (
              <div className="text-[10px] font-condensed font-bold text-[#24cc8f]">
                {formatEffectiveStats(effStats)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MemberProfileModal({
  member,
  bossStage,
  onClose,
}: MemberProfileModalProps) {
  const [tab, setTab] = useState<'gear' | 'history' | 'collection'>('gear');
  const [previewCostume, setPreviewCostume] = useState<boolean | null>(null);

  if (!member) return null;

  const showCostumeOnStage = previewCostume ?? member.use_costume;
  const clsMeta = CLASS_INFO[member.hero_class] ?? CLASS_INFO.apprentice;
  const metrics = { ...DEFAULT_METRICS, ...(member.metrics ?? {}) };
  const gearAttrs = computeTotalAttributes(member.equipped ?? {}, member.hero_class);
  const alloc = member.allocated_stats ?? { str: 0, int: 0, con: 0, per: 0 };
  const buffs = member.buffs ?? { str: 0, int: 0, con: 0, per: 0 };
  const totalAttrs: Attributes = {
    str: gearAttrs.str + (alloc.str ?? 0) + (buffs.str ?? 0),
    int: gearAttrs.int + (alloc.int ?? 0) + (buffs.int ?? 0),
    con: gearAttrs.con + (alloc.con ?? 0) + (buffs.con ?? 0),
    per: gearAttrs.per + (alloc.per ?? 0) + (buffs.per ?? 0),
  };

  const studyEntries = Array.isArray(member.study_entries) ? member.study_entries : [];
  const workoutEntries = Array.isArray(member.workout_entries) ? member.workout_entries : [];
  const ownedPetsCount = Object.keys(member.stable?.pets ?? {}).length;
  const ownedEquipCount = Array.isArray(member.inventory) ? member.inventory.length : 0;

  const totalStudyMinutes = studyEntries.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const totalQuestions = studyEntries.reduce(
    (acc, s) => acc + (s.didQuestions ? s.questionsDone || 0 : 0),
    0
  );
  const totalRunKm = workoutEntries.reduce(
    (acc, w) => acc + (w.cardio ? Number(w.km) || 0 : 0),
    0
  );
  const bossDmg =
    metrics.currentBossStage === bossStage ? (metrics.currentBossDamage ?? 0) : 0;

  const staPct = Math.max(0, Math.min(100, Math.round((member.hp / Math.max(1, member.max_hp)) * 100)));
  const mpPct = Math.max(0, Math.min(100, Math.round((member.mp / Math.max(1, member.max_mp)) * 100)));
  const xpPct = Math.max(0, Math.min(100, Math.round((member.xp / Math.max(1, member.xp_to_next)) * 100)));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#23202a] border-2 border-[#6133b4] rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="bg-[#36205d] border-b border-[#4f2a93] px-5 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Eye className="w-5 h-5 text-[#ffbe5d] shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-condensed font-bold text-lg text-white truncate">
                  {member.username}
                </h2>
                <span
                  className={`text-[10px] font-condensed font-bold px-2 py-0.5 rounded border ${clsMeta.badgeClass}`}
                >
                  {clsMeta.label} · Nv.{member.level}
                </span>
                {member.rebirths > 0 && (
                  <span className="text-[10px] font-condensed font-bold px-2 py-0.5 rounded bg-[#ffbe5d]/20 text-[#ffbe5d] border border-[#ffbe5d]/40">
                    🔄 {member.rebirths} Renasc.
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#271b3d] hover:bg-[#432874] text-[#d6c7ff] hover:text-white transition shrink-0"
            aria-label="Fechar Perfil"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Bloco Superior: Palco + Barras + Atributos */}
          <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4 flex flex-col items-center gap-2">
              <CharacterAvatar
                appearance={member.appearance}
                equipped={member.equipped ?? {}}
                costume={member.costume ?? {}}
                useCostume={showCostumeOnStage}
                petId={member.stable?.equippedPet}
                size="stage"
                className="border-2 border-[#6133b4] shadow-xl"
              />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewCostume(false)}
                  className={`px-2.5 py-1 rounded text-[11px] font-condensed font-bold transition cursor-pointer ${
                    !showCostumeOnStage
                      ? 'bg-[#6133b4] text-white'
                      : 'bg-[#23202a] text-[#a8a1b5] hover:text-white'
                  }`}
                >
                  Batalha
                </button>
                <button
                  onClick={() => setPreviewCostume(true)}
                  className={`px-2.5 py-1 rounded text-[11px] font-condensed font-bold transition cursor-pointer ${
                    showCostumeOnStage
                      ? 'bg-[#24cc8f]/25 border border-[#24cc8f] text-[#24cc8f]'
                      : 'bg-[#23202a] text-[#a8a1b5] hover:text-white'
                  }`}
                >
                  Fantasia
                </button>
              </div>
            </div>

            <div className="md:col-span-8 space-y-3">
              {/* Barras STA, MP, XP */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-condensed">
                  <Heart className="w-3.5 h-3.5 text-[#ff6165] fill-[#ff6165] shrink-0" />
                  <span className="w-12 text-[#cfc8dc] font-bold">STA</span>
                  <div className="flex-1 h-2.5 bg-[#271b3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ff6165]" style={{ width: `${staPct}%` }} />
                  </div>
                  <span className="w-16 text-right tabular-nums text-white font-bold">
                    {member.hp}/{member.max_hp}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-condensed">
                  <Zap className="w-3.5 h-3.5 text-[#50b5e9] fill-[#50b5e9] shrink-0" />
                  <span className="w-12 text-[#cfc8dc] font-bold">MP</span>
                  <div className="flex-1 h-2.5 bg-[#271b3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#50b5e9]" style={{ width: `${mpPct}%` }} />
                  </div>
                  <span className="w-16 text-right tabular-nums text-white font-bold">
                    {member.mp}/{member.max_mp}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-condensed">
                  <Sparkles className="w-3.5 h-3.5 text-[#ffbe5d] shrink-0" />
                  <span className="w-12 text-[#cfc8dc] font-bold">XP</span>
                  <div className="flex-1 h-2.5 bg-[#271b3d] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ffbe5d]" style={{ width: `${xpPct}%` }} />
                  </div>
                  <span className="w-20 text-right tabular-nums text-white font-bold">
                    {member.xp}/{member.xp_to_next}
                  </span>
                </div>
              </div>

              {/* Atributos Totais Efetivos */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: 'STR', val: totalAttrs.str, color: 'text-rose-400 border-rose-500/30' },
                  { label: 'INT', val: totalAttrs.int, color: 'text-sky-400 border-sky-500/30' },
                  { label: 'CON', val: totalAttrs.con, color: 'text-emerald-400 border-emerald-500/30' },
                  { label: 'PER', val: totalAttrs.per, color: 'text-amber-400 border-amber-500/30' },
                ].map((a) => (
                  <div
                    key={a.label}
                    className={`bg-[#23202a] border rounded-md py-2 px-2 text-center ${a.color}`}
                  >
                    <div className="text-[10px] font-condensed font-bold uppercase opacity-80">
                      {a.label}
                    </div>
                    <div className="text-base font-condensed font-bold tabular-nums">{a.val}</div>
                  </div>
                ))}
              </div>

              {/* Resumo Rápido */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-condensed font-bold pt-1">
                <span className="px-2.5 py-1 rounded bg-[#23202a] border border-[#3a3447] text-[#ffbe5d] flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> {member.gold} GP
                </span>
                <span className="px-2.5 py-1 rounded bg-[#23202a] border border-[#3a3447] text-[#24cc8f]">
                  ⚔️ Boss Atual: {bossDmg} dano
                </span>
                <span className="px-2.5 py-1 rounded bg-[#23202a] border border-[#3a3447] text-[#d6c7ff]">
                  🏆 {metrics.bossesDefeated} bosses vencidos
                </span>
              </div>
            </div>
          </div>

          {/* Sub-abas do Perfil */}
          <div className="flex flex-wrap gap-2 border-b border-[#3a3447] pb-2">
            {[
              { id: 'gear' as const, label: 'Equipamentos' },
              { id: 'history' as const, label: `Estudos (${studyEntries.length}) e Treinos (${workoutEntries.length})` },
              { id: 'collection' as const, label: 'Estábulo e Conquistas' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-1.5 rounded text-xs font-condensed font-bold uppercase tracking-wide transition cursor-pointer ${
                  tab === t.id
                    ? 'bg-[#6133b4] text-white'
                    : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white border border-[#342e40]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ABA 1: EQUIPAMENTOS (BATALHA + FANTASIA) */}
          {tab === 'gear' && (
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] flex items-center gap-1.5">
                    <Sword className="w-4 h-4 text-[#ffbe5d]" />
                    Equipamentos de Batalha (Atributos + Afinidade)
                  </h3>
                </div>
                <SlotGrid gear={member.equipped ?? {}} heroClass={member.hero_class} />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-condensed font-bold uppercase tracking-wider text-[#24cc8f] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Equipamentos Visuais / Fantasia
                  </h3>
                  <span
                    className={`text-[10px] font-condensed font-bold px-2 py-0.5 rounded border ${
                      member.use_costume
                        ? 'bg-[#24cc8f]/20 text-[#24cc8f] border-[#24cc8f]/40'
                        : 'bg-[#1a181d] text-[#8a8299] border-[#3a3447]'
                    }`}
                  >
                    {member.use_costume ? '✓ Fantasia Ativa no Avatar' : 'Fantasia Inativa'}
                  </span>
                </div>
                <SlotGrid
                  gear={member.costume ?? {}}
                  heroClass={member.hero_class}
                  isCostume
                />
              </div>
            </div>
          )}

          {/* ABA 2: HISTÓRICO DE ESTUDOS E TREINOS FÍSICOS */}
          {tab === 'history' && (
            <div className="space-y-4">
              {/* Totais PRF do Jogador */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 text-center">
                  <div className="text-[11px] font-condensed text-[#a8a1b5] uppercase">
                    Horas de Estudo
                  </div>
                  <div className="text-base font-condensed font-bold text-[#925cf3] mt-0.5">
                    {(totalStudyMinutes / 60).toFixed(1).replace('.', ',')}h ({totalStudyMinutes} min)
                  </div>
                </div>
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 text-center">
                  <div className="text-[11px] font-condensed text-[#a8a1b5] uppercase">
                    Questões Feitas
                  </div>
                  <div className="text-base font-condensed font-bold text-[#ffbe5d] mt-0.5">
                    {totalQuestions}
                  </div>
                </div>
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 text-center">
                  <div className="text-[11px] font-condensed text-[#a8a1b5] uppercase">
                    KM Corridos
                  </div>
                  <div className="text-base font-condensed font-bold text-[#24cc8f] mt-0.5">
                    {totalRunKm.toFixed(1).replace('.', ',')} km
                  </div>
                </div>
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 text-center">
                  <div className="text-[11px] font-condensed text-[#a8a1b5] uppercase">
                    Treinos Físicos
                  </div>
                  <div className="text-base font-condensed font-bold text-white mt-0.5">
                    {workoutEntries.length}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna Estudos */}
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md overflow-hidden">
                  <div className="bg-[#2c2836] border-b border-[#3a3447] px-3.5 py-2 flex items-center justify-between">
                    <span className="text-xs font-condensed font-bold uppercase text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#925cf3]" />
                      Histórico de Estudos ({studyEntries.length})
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2 max-h-72 overflow-y-auto">
                    {studyEntries.length === 0 ? (
                      <p className="text-xs text-[#8a8299] text-center py-6">
                        Nenhum estudo registrado ainda.
                      </p>
                    ) : (
                      studyEntries.map((s) => (
                        <div
                          key={s.id}
                          className="bg-[#23202a] border border-[#342e40] rounded px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-condensed font-bold text-white truncate">
                              {s.subject}
                            </span>
                            <span className="text-[10px] text-[#8a8299] shrink-0">
                              {s.createdAt}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-condensed">
                            <span className="text-[#d6c7ff]">⏱️ {s.minutes} min</span>
                            {s.didQuestions && (
                              <span className="text-[#ffbe5d]">📝 {s.questionsDone} questões</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Coluna Treinos Físicos */}
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md overflow-hidden">
                  <div className="bg-[#2c2836] border-b border-[#3a3447] px-3.5 py-2 flex items-center justify-between">
                    <span className="text-xs font-condensed font-bold uppercase text-white flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-[#24cc8f]" />
                      Histórico de Treinos ({workoutEntries.length})
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2 max-h-72 overflow-y-auto">
                    {workoutEntries.length === 0 ? (
                      <p className="text-xs text-[#8a8299] text-center py-6">
                        Nenhum treino registrado ainda.
                      </p>
                    ) : (
                      workoutEntries.map((w) => (
                        <div
                          key={w.id}
                          className="bg-[#23202a] border border-[#342e40] rounded px-3 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {w.cardio && (
                                <span className="px-1.5 py-0.5 rounded bg-[#ffbe5d]/20 text-[#ffbe5d] text-[10px] font-condensed font-bold">
                                  🏃 Cárdio{w.km && w.km > 0 ? ` (${w.km} km)` : ''}
                                </span>
                              )}
                              {w.musculacao && (
                                <span className="px-1.5 py-0.5 rounded bg-[#925cf3]/20 text-[#d6c7ff] text-[10px] font-condensed font-bold">
                                  🏋️ Musculação
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8a8299] shrink-0">
                              {w.createdAt}
                            </span>
                          </div>
                          {w.notes && (
                            <p className="text-[11px] text-[#cfc8dc] mt-1">{w.notes}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: ESTÁBULO & CONQUISTAS */}
          {tab === 'collection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 flex items-center gap-3">
                  {member.stable?.equippedPet ? (
                    <img
                      src={getPetSpritePath(member.stable.equippedPet)}
                      alt={member.stable.equippedPet}
                      className="w-12 h-12 object-contain [image-rendering:pixelated]"
                    />
                  ) : (
                    <PawPrint className="w-8 h-8 text-[#6e677d]" />
                  )}
                  <div>
                    <div className="text-[10px] font-condensed uppercase text-[#a8a1b5]">
                      Mascote Ativo
                    </div>
                    <div className="text-xs font-condensed font-bold text-white">
                      {member.stable?.equippedPet
                        ? formatPetName(member.stable.equippedPet)
                        : 'Nenhum equipado'}
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-[#925cf3]" />
                  <div>
                    <div className="text-[10px] font-condensed uppercase text-[#a8a1b5]">
                      Equipamentos
                    </div>
                    <div className="text-sm font-condensed font-bold text-white">
                      {ownedEquipCount} / {EQUIPMENT_CATALOG.length}
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-[#ffbe5d]" />
                  <div>
                    <div className="text-[10px] font-condensed uppercase text-[#a8a1b5]">
                      Mascotes no Estábulo
                    </div>
                    <div className="text-sm font-condensed font-bold text-white">
                      {ownedPetsCount} / {ALL_PET_IDS.length}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-condensed font-bold uppercase tracking-wider text-[#d6c7ff] mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#ffbe5d]" />
                  Conquistas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ACHIEVEMENTS.map((ach) => {
                    const unlocked = ach.check({
                      level: member.level,
                      petsCount: ownedPetsCount,
                      metrics,
                    });
                    return (
                      <div
                        key={ach.id}
                        className={`rounded-md border p-2.5 flex items-center gap-2.5 ${
                          unlocked
                            ? 'bg-[#2c2240]/60 border-[#925cf3]/60'
                            : 'bg-[#1a181d]/50 border-[#342e40] opacity-50'
                        }`}
                      >
                        <span className="text-xl shrink-0">{ach.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-condensed font-bold text-white truncate">
                            {ach.title}
                          </div>
                          <div className="text-[10px] text-[#a8a1b5] truncate">
                            {ach.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
