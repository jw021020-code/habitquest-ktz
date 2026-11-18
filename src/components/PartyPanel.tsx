'use client';

import React, { useState } from 'react';
import {
  Coins,
  Heart,
  History,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  Sword,
  Users,
  Zap,
} from 'lucide-react';
import { PlayerStats } from '@/lib/game/formulas';
import { CharacterAppearance, EquippedGear } from '@/lib/game/items';
import { CLASS_INFO } from '@/lib/game/skills';
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
  heroAppearance: CharacterAppearance;
  heroEquipped: EquippedGear;
  heroCostume?: EquippedGear;
  heroUseCostume?: boolean;
  heroPetId?: string;
  heroMountId?: string;
  remoteParty: RemoteParty | null;
  remoteMembers: RemoteProfile[];
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
  heroAppearance,
  heroEquipped,
  heroCostume,
  heroUseCostume,
  heroPetId,
  heroMountId,
  remoteParty,
  remoteMembers,
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
  onOpenAuth,
}: PartyPanelProps) {
  const [rightTab, setRightTab] = useState<'history' | 'chat'>('history');
  const [chatInput, setChatInput] = useState('');

  if (!visible) return null;

  const bossPct = Math.max(0, Math.min(100, Math.round((bossHp / bossMaxHp) * 100)));
  const historyLogs = messages.filter((m) => m.kind === 'system');
  const chatMessages = messages.filter((m) => m.kind === 'chat');

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
            <div className="bg-[#36205d] border-b border-[#4f2a93] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#ffbe5d]" />
                <h2 className="font-condensed font-bold text-base uppercase tracking-wide text-white">
                  KTZ — Missão de Boss #{bossStage}
                </h2>
              </div>
              <span className="text-[11px] font-condensed font-bold px-2 py-0.5 rounded bg-[#271b3d] text-[#ffbe5d] border border-[#6133b4]">
                Progressivo
              </span>
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

              {/* Detalhes do Contra-ataque e Recompensas */}
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
                    🏆 Recompensa ao Vencer
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-condensed font-bold">
                    <span className="flex items-center gap-1 text-[#ffbe5d]">
                      <Coins className="w-3 h-3" />+{rewardGold} GP
                    </span>
                    <span className="flex items-center gap-1 text-[#24cc8f]">
                      <Sparkles className="w-3 h-3" />+{rewardXp} XP
                    </span>
                    <span className="text-[#50b5e9]">100% Reset STA/MP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Membros do Clã KTZ */}
          <div className="bg-[#23202a] border border-[#3a3447] rounded-md overflow-hidden shadow-lg">
            <div className="bg-[#2c2836] border-b border-[#3a3447] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#925cf3]" />
                <h3 className="font-condensed font-bold text-sm uppercase tracking-wider text-white">
                  Membros da KTZ ({remoteParty && remoteMembers.length > 0 ? remoteMembers.length : 1})
                </h3>
              </div>
            </div>

            <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto">
              {remoteParty && remoteMembers.length > 0 ? (
                remoteMembers.map((member) => {
                  const mStaPct = Math.max(
                    0,
                    Math.min(100, Math.round((member.hp / Math.max(1, member.max_hp)) * 100))
                  );
                  const mMpPct = Math.max(
                    0,
                    Math.min(100, Math.round((member.mp / Math.max(1, member.max_mp)) * 100))
                  );
                  const clsMeta = CLASS_INFO[member.hero_class] ?? CLASS_INFO.warrior;
                  return (
                    <div
                      key={member.id}
                      className="bg-[#1a181d] border border-[#3a3447] rounded-md p-2.5 flex items-center gap-3"
                    >
                      <CharacterAvatar
                        appearance={member.appearance}
                        equipped={member.equipped}
                        costume={member.costume}
                        useCostume={member.use_costume}
                        petId={member.stable?.equippedPet}
                        mountId={member.stable?.equippedMount}
                        size="md"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs sm:text-sm font-condensed font-bold text-white truncate">
                            {member.username}
                          </span>
                          <span
                            className={`text-[10px] font-condensed font-bold px-1.5 py-0.2 rounded border ${clsMeta.badgeClass}`}
                          >
                            {clsMeta.label} · Nv.{member.level}
                          </span>
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
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Card do Herói Local quando offline */
                <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-2.5 flex items-center gap-3">
                  <CharacterAvatar
                    appearance={heroAppearance}
                    equipped={heroEquipped}
                    costume={heroCostume}
                    useCostume={heroUseCostume}
                    petId={heroPetId}
                    mountId={heroMountId}
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
    </section>
  );
}
