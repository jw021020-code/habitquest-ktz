'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Coins,
  Crown,
  Eye,
  Heart,
  History,
  MessageSquare,
  Search,
  Send,
  Shield,
  Sparkles,
  Sword,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { PlayerStats } from '@/lib/game/formulas';
import { HeroMetrics } from '@/lib/game/achievements';
import { CharacterAppearance, EquippedGear } from '@/lib/game/items';
import {
  BOSS_CATALOG,
  BossCategory,
  CLASS_INFO,
  getBossAtIndexAndCycle,
  getBossById,
  getProgressiveBoss,
} from '@/lib/game/skills';
import { RemoteParty, RemoteProfile } from '@/lib/supabase/data';
import { CharacterAvatar } from './CharacterAvatar';

export interface PartyChatMessage {
  id: string;
  author: string;
  kind: 'chat' | 'system';
  text: string;
  time: string;
}

interface PartyPanelProps {
  visible: boolean;
  isOnline: boolean;
  heroName: string;
  heroStats: PlayerStats;
  heroMetrics: HeroMetrics;
  heroAppearance: CharacterAppearance;
  heroEquipped: EquippedGear;
  heroCostume?: EquippedGear;
  heroUseCostume?: boolean;
  heroPetId?: string;
  remoteParty: RemoteParty | null;
  remoteMembers: RemoteProfile[];
  bossId: string;
  bossStage: number;
  bossName: string;
  bossSprite: string;
  bossHp: number;
  bossMaxHp: number;
  bossAttack: number;
  rewardGold: number;
  rewardXp: number;
  messages: PartyChatMessage[];
  onSendChat: (text: string) => void;
  onSelectBossMission: (bossIndex: number, cycle: number) => void;
  onInspectMember: (member: RemoteProfile) => void;
  onInspectLocal?: () => void;
  onOpenAuth: () => void;
}

function getLogBorderStyle(text: string): string {
  if (text.includes('derrotou') || text.includes('Evoluiu') || text.includes('chocou')) {
    return 'border-l-4 border-l-[#24cc8f] bg-[#1a181d]';
  }
  if (text.includes('causou') || text.includes('Contra-ataque')) {
    return 'border-l-4 border-l-[#ff6165] bg-[#1a181d]';
  }
  if (text.includes('Armoire') || text.includes('comprou') || text.includes('Drop')) {
    return 'border-l-4 border-l-[#ffbe5d] bg-[#1a181d]';
  }
  return 'border-l-4 border-l-[#925cf3] bg-[#1a181d]';
}

export function PartyPanel({
  visible,
  isOnline,
  heroName,
  heroStats,
  heroMetrics,
  heroAppearance,
  heroEquipped,
  heroCostume,
  heroUseCostume,
  heroPetId,
  remoteParty,
  remoteMembers,
  bossId,
  bossStage,
  bossName,
  bossSprite,
  bossHp,
  bossMaxHp,
  bossAttack,
  rewardGold,
  rewardXp,
  messages,
  onSendChat,
  onSelectBossMission,
  onInspectMember,
  onInspectLocal,
  onOpenAuth,
}: PartyPanelProps) {
  const [rightTab, setRightTab] = useState<'history' | 'chat'>('history');
  const [chatInput, setChatInput] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [bossCatFilter, setBossCatFilter] = useState<'all' | BossCategory | 'potions'>('all');
  const [bossSearch, setBossSearch] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<number>(0);

  if (!visible) return null;

  const bossPct = Math.max(0, Math.min(100, Math.round((bossHp / bossMaxHp) * 100)));
  const bossMeta = getBossById(bossId);
  const bossDropCount = getProgressiveBoss(bossStage).dropCount;
  const historyLogs = messages.filter((m) => m.kind === 'system');
  const chatMessages = messages.filter((m) => m.kind === 'chat');

  const localBossDmg =
    heroMetrics.currentBossStage === bossStage ? (heroMetrics.currentBossDamage ?? 0) : 0;

  const maxMemberDmg =
    remoteParty && remoteMembers.length > 0
      ? Math.max(
          0,
          ...remoteMembers.map((m) =>
            m.metrics?.currentBossStage === bossStage ? (m.metrics?.currentBossDamage ?? 0) : 0
          )
        )
      : localBossDmg;

  const filteredBossCatalog = BOSS_CATALOG.map((b, index) => ({ b, index })).filter(({ b }) => {
    if (bossCatFilter === 'potions') {
      if (b.category !== 'hatchingPotion' && b.category !== 'timeTravelers') return false;
    } else if (bossCatFilter !== 'all' && b.category !== bossCatFilter) {
      return false;
    }
    const q = bossSearch.trim().toLowerCase();
    if (q) {
      return (
        b.name.toLowerCase().includes(q) ||
        b.questTitle.toLowerCase().includes(q) ||
        b.lore.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    onSendChat(text);
    setChatInput('');
  };

  const localStaPct = Math.max(
    0,
    Math.min(100, Math.round((heroStats.hp / Math.max(1, heroStats.max_hp)) * 100))
  );
  const localMpPct = Math.max(
    0,
    Math.min(100, Math.round((heroStats.mp / Math.max(1, heroStats.max_mp)) * 100))
  );
  const localClassMeta = CLASS_INFO[heroStats.heroClass];

  return (
    <section className="max-w-7xl w-full mx-auto px-4 pt-4 pb-8 select-none">
      {!isOnline && (
        <div className="mb-4 bg-[#23202a] border border-[#432874] rounded-md px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-md">
          <span className="text-[#cfc8dc]">
            Você está no <strong className="text-white">Modo Local</strong>. Entre na sua conta
            para sincronizar em tempo real com todos os integrantes da{' '}
            <strong className="text-[#ffbe5d]">KTZ - Know The Zero</strong>.
          </span>
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded bg-[#6133b4] hover:bg-[#7241cc] text-white font-condensed font-bold uppercase tracking-wider shrink-0 transition"
          >
            Entrar / Sincronizar Clã
          </button>
        </div>
      )}

      {/* Layout de 2 Colunas Estilo Party & Guild do Habitica */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ================================================================= */}
        {/* COLUNA ESQUERDA (5 cols): PERGAMINHO DO BOSS + MEMBROS DO CLÃ     */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Pergaminho da Missão de Boss Estilo Habitica */}
          <div className="bg-[#23202a] border border-[#432874] rounded-md overflow-hidden shadow-lg">
            <div className="bg-[#36205d] border-b border-[#4f2a93] px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="w-4 h-4 text-[#ffbe5d] shrink-0" />
                <h2 className="font-condensed font-bold text-base uppercase tracking-wide text-white truncate">
                  Boss #{bossStage}
                </h2>
              </div>
              <button
                onClick={() => setCatalogOpen(true)}
                className="px-2.5 py-1 rounded bg-[#6133b4] hover:bg-[#7241cc] border border-[#925cf3] text-white text-[11px] font-condensed font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition"
                title="Explorar e escolher entre todos os 101 Bosses do Habitica"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#ffbe5d]" />
                Catálogo ({BOSS_CATALOG.length})
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Palco Central do Boss */}
              <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-4 flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-md bg-[#271b3d] border-2 border-[#6133b4] flex items-center justify-center mb-3 shadow-inner">
                  <img
                    src={bossSprite}
                    alt={bossName}
                    className="w-24 h-24 object-contain [image-rendering:pixelated]"
                  />
                </div>

                <h3 className="font-condensed font-bold text-lg text-white flex items-center gap-1.5">
                  <Sword className="w-4 h-4 text-[#ff6165]" />
                  {bossName}
                </h3>
                {bossMeta && (
                  <p className="text-[11px] text-[#a8a1b5] mt-1 line-clamp-2 max-w-sm">
                    {bossMeta.lore || bossMeta.questTitle}
                  </p>
                )}

                {/* Barra Grossa de HP do Boss */}
                <div className="w-full mt-2.5">
                  <div className="flex items-center justify-between text-xs font-condensed font-bold mb-1">
                    <span className="text-[#ff8b8e]">HP do Boss</span>
                    <span className="text-white tabular-nums">
                      {bossHp} / {bossMaxHp} ({bossPct}%)
                    </span>
                  </div>
                  <div className="w-full h-4 bg-[#271b3d] rounded-full overflow-hidden border border-[#432874] p-[1px]">
                    <div
                      className="h-full rounded-full bg-[#ff6165] transition-all duration-300"
                      style={{ width: `${bossPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Detalhes do Contra-ataque e Recompensas Compartilhadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3">
                  <div className="font-condensed font-bold uppercase text-[#ff8b8e] mb-1">
                    ⚔️ Contra-Ataque
                  </div>
                  <p className="text-[11px] text-[#cfc8dc]">
                    Causa <strong className="text-white">{bossAttack} STA</strong> base por ataque
                    recebido (reduzido pela sua <strong className="text-emerald-300">CON</strong>).
                  </p>
                </div>

                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3">
                  <div className="font-condensed font-bold uppercase text-[#ffbe5d] mb-1">
                    🏆 Recompensa Compartilhada (KTZ)
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-condensed font-bold">
                    <span className="flex items-center gap-1 text-[#ffbe5d]">
                      <Coins className="w-3 h-3" />+{rewardGold} GP
                    </span>
                    <span className="flex items-center gap-1 text-[#24cc8f]">
                      <Sparkles className="w-3 h-3" />+{rewardXp} XP
                    </span>
                    <span className="text-[#d6c7ff]">
                      +{bossDropCount} Ovo · +{bossDropCount} Poção
                    </span>
                    <span className="text-[#50b5e9]">+25% STA · +15% MP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Membros do Clã KTZ com Ranking de Dano */}
          <div className="bg-[#23202a] border border-[#3a3447] rounded-md overflow-hidden shadow-lg">
            <div className="bg-[#2c2836] border-b border-[#3a3447] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#925cf3]" />
                <h3 className="font-condensed font-bold text-sm uppercase tracking-wider text-white">
                  Membros da KTZ ({remoteParty && remoteMembers.length > 0 ? remoteMembers.length : 1})
                </h3>
              </div>
              <span className="text-[10px] font-condensed text-[#a8a1b5] uppercase">
                Ranking da Luta
              </span>
            </div>

            <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto">
              {remoteParty && remoteMembers.length > 0 ? (
                [...remoteMembers]
                  .sort((a, b) => {
                    const da =
                      a.metrics?.currentBossStage === bossStage
                        ? (a.metrics?.currentBossDamage ?? 0)
                        : 0;
                    const db =
                      b.metrics?.currentBossStage === bossStage
                        ? (b.metrics?.currentBossDamage ?? 0)
                        : 0;
                    return db - da || b.level - a.level;
                  })
                  .map((member) => {
                    const mStaPct = Math.max(
                      0,
                      Math.min(100, Math.round((member.hp / Math.max(1, member.max_hp)) * 100))
                    );
                    const mMpPct = Math.max(
                      0,
                      Math.min(100, Math.round((member.mp / Math.max(1, member.max_mp)) * 100))
                    );
                    const clsMeta = CLASS_INFO[member.hero_class] ?? CLASS_INFO.warrior;
                    const dmg =
                      member.metrics?.currentBossStage === bossStage
                        ? (member.metrics?.currentBossDamage ?? 0)
                        : 0;
                    const dmgPct =
                      bossMaxHp > 0 ? Math.min(100, Math.round((dmg / bossMaxHp) * 100)) : 0;
                    const isMvp = maxMemberDmg > 0 && dmg === maxMemberDmg;
                    const isExhausted = member.hp <= 0;

                    return (
                      <div
                        key={member.id}
                        onClick={() => onInspectMember(member)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') onInspectMember(member);
                        }}
                        className={`rounded-md p-2.5 flex items-center gap-3 border cursor-pointer transition hover:border-[#925cf3] ${
                          isMvp
                            ? 'bg-[#2c2240]/60 border-[#ffbe5d]/50'
                            : 'bg-[#1a181d] border-[#3a3447]'
                        }`}
                        title={`Ver perfil completo de ${member.username}`}
                      >
                        <CharacterAvatar
                          appearance={member.appearance}
                          equipped={member.equipped}
                          costume={member.costume}
                          useCostume={member.use_costume}
                          petId={member.stable?.equippedPet}
                          size="md"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs sm:text-sm font-condensed font-bold text-white truncate flex items-center gap-1">
                              {isMvp && (
                                <Crown
                                  className="w-3.5 h-3.5 text-[#ffbe5d] shrink-0"
                                  aria-label="MVP da Luta"
                                />
                              )}
                              {member.username}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {isExhausted && (
                                <span className="text-[9px] font-condensed font-bold px-1 py-0.2 rounded bg-[#ff6165]/20 text-[#ff8b8e] border border-[#ff6165]/40 flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Exausto
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-condensed font-bold px-1.5 py-0.2 rounded border ${clsMeta.badgeClass}`}
                              >
                                {clsMeta.label} · Nv.{member.level}
                              </span>
                            </div>
                          </div>

                          {/* Barra STA */}
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3 h-3 text-[#ff6165] fill-[#ff6165] shrink-0" />
                            <div className="flex-1 h-2 bg-[#271b3d] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#ff6165]"
                                style={{ width: `${mStaPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[#a8a1b5] tabular-nums w-14 text-right">
                              {member.hp}/{member.max_hp}
                            </span>
                          </div>

                          {/* Barra MP */}
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-[#50b5e9] fill-[#50b5e9] shrink-0" />
                            <div className="flex-1 h-2 bg-[#271b3d] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#50b5e9]"
                                style={{ width: `${mMpPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[#a8a1b5] tabular-nums w-14 text-right">
                              {member.mp}/{member.max_mp}
                            </span>
                          </div>

                          {/* Contribuição na Luta Atual */}
                          <div className="flex items-center justify-between text-[10px] font-condensed pt-0.5">
                            <span className="text-[#ffbe5d] font-bold">
                              ⚔️ {dmg} dano ({dmgPct}%)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[#8a8299]">
                                {member.metrics?.bossesDefeated ?? 0} bosses
                              </span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#36205d] text-[#d6c7ff] border border-[#6133b4] font-bold">
                                <Eye className="w-2.5 h-2.5" />
                                Ver Perfil
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                /* Card do Herói Local quando offline */
                <div
                  onClick={onInspectLocal}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onInspectLocal) onInspectLocal();
                  }}
                  className="bg-[#1a181d] hover:border-[#925cf3] border border-[#3a3447] rounded-md p-2.5 flex items-center gap-3 cursor-pointer transition"
                >
                  <CharacterAvatar
                    appearance={heroAppearance}
                    equipped={heroEquipped}
                    costume={heroCostume}
                    useCostume={heroUseCostume}
                    petId={heroPetId}
                    size="md"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs sm:text-sm font-condensed font-bold text-white truncate">
                        {heroName} (Você)
                      </span>
                      <span
                        className={`text-[10px] font-condensed font-bold px-1.5 py-0.2 rounded border ${localClassMeta.badgeClass}`}
                      >
                        {localClassMeta.label} · Nv.{heroStats.level}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-[#ff6165] fill-[#ff6165] shrink-0" />
                      <div className="flex-1 h-2 bg-[#271b3d] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ff6165]"
                          style={{ width: `${localStaPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#a8a1b5] tabular-nums w-14 text-right">
                        {heroStats.hp}/{heroStats.max_hp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[#50b5e9] fill-[#50b5e9] shrink-0" />
                      <div className="flex-1 h-2 bg-[#271b3d] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#50b5e9]"
                          style={{ width: `${localMpPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#a8a1b5] tabular-nums w-14 text-right">
                        {heroStats.mp}/{heroStats.max_mp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-condensed pt-0.5">
                      <span className="text-[#ffbe5d] font-bold">
                        ⚔️ {localBossDmg} dano (
                        {bossMaxHp > 0 ? Math.min(100, Math.round((localBossDmg / bossMaxHp) * 100)) : 0}
                        %)
                      </span>
                      <span className="text-[#8a8299]">
                        {heroMetrics.bossesDefeated ?? 0} bosses vencidos
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLUNA DIREITA (7 cols): TAVERNA KTZ — HISTÓRICO DE AÇÕES & CHAT  */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 flex flex-col bg-[#23202a] border border-[#3a3447] rounded-md overflow-hidden shadow-lg">
          {/* Abas Superiores Estilo Habitica Tavern / Party Feed */}
          <div className="grid grid-cols-2 bg-[#2c2836] border-b border-[#3a3447] text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider">
            <button
              onClick={() => setRightTab('history')}
              className={`py-3 flex items-center justify-center gap-2 border-b-2 transition ${
                rightTab === 'history'
                  ? 'border-[#ffbe5d] bg-[#36205d]/70 text-white'
                  : 'border-transparent text-[#a8a1b5] hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-[#ffbe5d]" />
              Histórico de Ações ({historyLogs.length})
            </button>
            <button
              onClick={() => setRightTab('chat')}
              className={`py-3 flex items-center justify-center gap-2 border-b-2 transition ${
                rightTab === 'chat'
                  ? 'border-[#50b5e9] bg-[#36205d]/70 text-white'
                  : 'border-transparent text-[#a8a1b5] hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#50b5e9]" />
              Chat KTZ ({chatMessages.length})
            </button>
          </div>

          {/* Conteúdo da Aba 1: Histórico de Ações Colorido */}
          {rightTab === 'history' ? (
            <div className="p-4 flex-1 max-h-[540px] overflow-y-auto space-y-2 text-xs">
              {historyLogs.length === 0 ? (
                <div className="py-16 text-center text-[#8a8299]">
                  Nenhuma ação registrada ainda. Registre estudos, treinos ou use habilidades para
                  movimentar o histórico do clã!
                </div>
              ) : (
                historyLogs.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-md border border-[#342e40] px-3.5 py-2.5 flex items-start justify-between gap-3 ${getLogBorderStyle(
                      m.text
                    )}`}
                  >
                    <p className="text-[#f3f1f7] leading-relaxed">{m.text}</p>
                    <span className="text-[11px] font-condensed text-[#8a8299] shrink-0">
                      {m.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Conteúdo da Aba 2: Chat do Clã KTZ (Com caixa de envio no topo estilo Habitica) */
            <div className="p-4 flex flex-col gap-3 flex-1">
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Enviar mensagem para a guilda KTZ - Know The Zero..."
                  className="flex-1 bg-[#1a181d] border border-[#3a3447] rounded-md px-3.5 py-2 text-xs sm:text-sm text-[#f3f1f7] placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
                />
                <button
                  type="submit"
                  className="bg-[#6133b4] hover:bg-[#7241cc] text-white px-4 py-2 rounded-md text-xs font-condensed font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </form>

              <div className="flex-1 max-h-[470px] overflow-y-auto space-y-2 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="py-14 text-center text-[#8a8299]">
                    Nenhuma mensagem no chat ainda. Mande um salve para a KTZ!
                  </div>
                ) : (
                  chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className="bg-[#1a181d] border border-[#342e40] rounded-md px-3.5 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-condensed font-bold text-[#d6c7ff] text-xs sm:text-sm">
                          {m.author}
                        </span>
                        <span className="text-[11px] font-condensed text-[#8a8299]">{m.time}</span>
                      </div>
                      <p className="text-[#f3f1f7] leading-relaxed">{m.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Catálogo Completo dos 101 Bosses do Habitica */}
      {catalogOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#23202a] border border-[#432874] rounded-md w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#432874] px-4 py-3 flex items-center justify-between border-b border-[#36205d]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#ffbe5d]" />
                <h2 className="font-condensed font-bold text-base uppercase tracking-wide text-white">
                  Catálogo de Bosses do Habitica ({BOSS_CATALOG.length} Chefes)
                </h2>
              </div>
              <button
                onClick={() => setCatalogOpen(false)}
                className="p-1 rounded hover:bg-black/20 text-white/80 hover:text-white"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de Filtros, Busca e Ciclo/Dificuldade */}
            <div className="bg-[#2c2836] border-b border-[#3a3447] p-3 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: `Todos (${BOSS_CATALOG.length})` },
                    { id: 'unlockable', label: 'História (12)' },
                    { id: 'pet', label: 'Mascotes (61)' },
                    { id: 'potions', label: 'Poções & Viajantes (12)' },
                    { id: 'gold', label: 'Ouro & Masterclass (11)' },
                    { id: 'world', label: 'Chefes Mundiais (5)' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setBossCatFilter(cat.id)}
                    className={`px-2.5 py-1 rounded text-xs font-condensed font-bold transition ${
                      bossCatFilter === cat.id
                        ? 'bg-[#6133b4] text-white'
                        : 'bg-[#1a181d] text-[#a8a1b5] hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-condensed font-bold uppercase text-[#d6c7ff]">
                    Dificuldade:
                  </span>
                  <select
                    value={selectedCycle}
                    onChange={(e) => setSelectedCycle(Number(e.target.value))}
                    className="bg-[#1a181d] border border-[#3a3447] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#925cf3]"
                  >
                    <option value={0}>Normal (Ciclo 1 · 1.0x HP)</option>
                    <option value={1}>Veterano (Ciclo 2 · 1.5x HP)</option>
                    <option value={2}>Elite (Ciclo 3 · 2.0x HP)</option>
                    <option value={4}>Pesadelo (Ciclo 5 · 3.0x HP)</option>
                    <option value={9}>Lendário Late-Game (Ciclo 10 · 5.5x HP)</option>
                  </select>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-[#8a8299] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bossSearch}
                    onChange={(e) => setBossSearch(e.target.value)}
                    placeholder="Buscar Boss ou Missão..."
                    className="w-full bg-[#1a181d] border border-[#3a3447] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#6e677d] focus:outline-none focus:border-[#925cf3]"
                  />
                </div>
              </div>
            </div>

            {/* Grid dos Bosses */}
            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBossCatalog.map(({ b, index }) => {
                const scaled = getBossAtIndexAndCycle(index, selectedCycle);
                const isCurrent = bossId === b.id;
                return (
                  <div
                    key={b.id}
                    className={`rounded-md border p-3 flex flex-col justify-between gap-3 ${
                      isCurrent
                        ? 'bg-[#2c2240] border-[#ffbe5d]'
                        : 'bg-[#1a181d] border-[#3a3447]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded bg-[#271b3d] border border-[#432874] flex items-center justify-center shrink-0">
                        <img
                          src={scaled.sprite}
                          alt={scaled.name}
                          loading="lazy"
                          className="w-14 h-14 object-contain [image-rendering:pixelated]"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-condensed font-bold text-white line-clamp-1">
                          {scaled.name}
                        </p>
                        <p className="text-[11px] text-[#d6c7ff] line-clamp-1">{b.questTitle}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-[10px] font-condensed font-bold">
                          <span className="text-[#ff8b8e]">HP {scaled.maxHp}</span>
                          <span className="text-[#ffbe5d]">Atq {scaled.attack}</span>
                          <span className="text-[#24cc8f]">
                            +{scaled.rewardGold} GP · +{scaled.rewardXp} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    {b.lore && (
                      <p className="text-[11px] text-[#a8a1b5] line-clamp-2 leading-snug">
                        {b.lore}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#3a3447]">
                      <span className="text-[10px] font-condensed text-[#d6c7ff]">
                        Drop: +{b.dropCount} Ovo · +{b.dropCount} Poção
                      </span>
                      <button
                        onClick={() => {
                          onSelectBossMission(index, selectedCycle);
                          setCatalogOpen(false);
                        }}
                        className="px-3 py-1.5 rounded bg-[#6133b4] hover:bg-[#7241cc] text-white text-[11px] font-condensed font-bold uppercase tracking-wider transition"
                      >
                        {isCurrent ? 'Reiniciar Boss' : '⚔️ Desafiar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
