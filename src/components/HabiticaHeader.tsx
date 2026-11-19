'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckSquare,
  Coins,
  Heart,
  Palette,
  PawPrint,
  ScrollText,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Sword,
  Trophy,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { PlayerStats } from '@/lib/game/formulas';
import { Attributes, CharacterAppearance, EquippedGear, HeroClass } from '@/lib/game/items';
import { ALL_PET_IDS } from '@/lib/game/pets';
import { CLASS_INFO } from '@/lib/game/skills';
import { RemoteProfile } from '@/lib/supabase/data';
import { CharacterAvatar } from './CharacterAvatar';

export type ActiveSection = 'registro' | 'quests' | 'inventario' | 'loja' | 'ktz';
export type InventorySubTab = 'equipment' | 'stable' | 'appearance';
export type ShopSubTab = HeroClass | 'all';

interface HabiticaHeaderProps {
  heroName: string;
  userEmail: string | null;
  stats: PlayerStats;
  unallocatedPoints: number;
  appearance: CharacterAppearance;
  equipped: EquippedGear;
  costume?: EquippedGear;
  useCostume?: boolean;
  petId?: string;
  ownedEquipmentCount: number;
  ownedPetsCount: number;
  totalAttributes: Attributes;
  bossStage: number;
  bossName: string;
  bossSprite: string;
  bossHp: number;
  bossMaxHp: number;
  bossAttack: number;
  remoteMembers: RemoteProfile[];
  activeSection: ActiveSection;
  invTab: InventorySubTab;
  shopFilter: ShopSubTab;
  readyQuestsCount?: number;
  supabaseReady: boolean;
  onSelectSection: (section: ActiveSection) => void;
  onSelectInvTab: (tab: InventorySubTab) => void;
  onSelectShopFilter: (filter: ShopSubTab) => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
}

const SHOP_SUBTABS: { id: ShopSubTab; label: string }[] = [
  { id: 'all', label: 'Mercado Geral' },
  { id: 'healer', label: 'Escudeiro' },
  { id: 'warrior', label: 'Espadachim' },
  { id: 'rogue', label: 'Batedor' },
  { id: 'wizard', label: 'Noviço Arcano' },
  { id: 'cosmetic', label: 'Cosméticos' },
];

export function HabiticaHeader({
  heroName,
  userEmail,
  stats,
  unallocatedPoints,
  appearance,
  equipped,
  costume,
  useCostume,
  petId,
  ownedEquipmentCount,
  ownedPetsCount,
  totalAttributes,
  bossStage,
  bossName,
  bossSprite,
  bossHp,
  bossMaxHp,
  bossAttack,
  remoteMembers,
  activeSection,
  invTab,
  shopFilter,
  readyQuestsCount = 0,
  supabaseReady,
  onSelectSection,
  onSelectInvTab,
  onSelectShopFilter,
  onOpenStats,
  onOpenAuth,
}: HabiticaHeaderProps) {
  const staminaPct = Math.max(0, Math.min(100, Math.round((stats.hp / stats.max_hp) * 100)));
  const xpPct = Math.max(0, Math.min(100, Math.round((stats.xp / stats.xp_to_next) * 100)));
  const mpPct = Math.max(0, Math.min(100, Math.round((stats.mp / stats.max_mp) * 100)));
  const bossPct = Math.max(0, Math.min(100, Math.round((bossHp / bossMaxHp) * 100)));
  const classMeta = CLASS_INFO[stats.heroClass];
  const isExhausted = stats.hp <= 0;

  return (
    <header className="w-full select-none">
      {/* 1. Barra de Navegação Principal do Habitica (#432874) */}
      <nav className="bg-[#432874] border-b border-[#36205d] px-4 shadow-md">
        <div className="max-w-7xl mx-auto h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 h-full">
            {/* Logo HabitQuest */}
            <button
              onClick={() => onSelectSection('registro')}
              className="flex items-center gap-2.5 focus:outline-none group"
            >
              <div className="w-8 h-8 rounded-md bg-[#36205d] border border-[#925cf3]/60 flex items-center justify-center group-hover:border-[#ffbe5d] transition shadow-inner">
                <Shield className="w-4 h-4 text-[#ffbe5d]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-condensed font-bold text-lg tracking-wide text-white leading-none">
                    HabitQuest
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#271b3d] text-[#d6c7ff] border border-[#6133b4]/60">
                    {supabaseReady && userEmail ? 'Online' : 'Local'}
                  </span>
                </div>
              </div>
            </button>

            {/* Abas Principais Desktop (Estilo Habitica com barra inferior ativa) */}
            <div className="hidden md:flex items-stretch h-full gap-1 text-sm font-condensed font-bold tracking-wide">
              {[
                {
                  id: 'registro' as ActiveSection,
                  label: 'Registro',
                  icon: <CheckSquare className="w-4 h-4" />,
                },
                {
                  id: 'quests' as ActiveSection,
                  label: 'Missões PRF',
                  icon: <ScrollText className="w-4 h-4" />,
                  badge: readyQuestsCount,
                },
                {
                  id: 'inventario' as ActiveSection,
                  label: 'Inventário',
                  icon: <ShoppingBag className="w-4 h-4" />,
                },
                {
                  id: 'loja' as ActiveSection,
                  label: 'Lojas',
                  icon: <Store className="w-4 h-4" />,
                },
                {
                  id: 'ktz' as ActiveSection,
                  label: 'KTZ - Know The Zero',
                  icon: <Users className="w-4 h-4" />,
                },
              ].map((tab) => {
                const active = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onSelectSection(tab.id)}
                    className={`px-2.5 lg:px-3.5 whitespace-nowrap flex items-center gap-1.5 lg:gap-2 border-b-4 transition ${
                      active
                        ? 'border-[#925cf3] bg-[#36205d]/75 text-white'
                        : 'border-transparent text-[#e2d8ff]/80 hover:text-white hover:bg-[#36205d]/40'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge && tab.badge > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#ffbe5d] text-[#1a181d] text-[10px] font-extrabold leading-tight">
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indicadores Direita: Moedas de Ouro, Atributos/Conquistas e Conta */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Contador de Ouro estilo Habitica */}
            <button
              onClick={() => onSelectSection('loja')}
              title="Abrir Loja"
              className="flex items-center gap-1.5 bg-[#271b3d] hover:bg-[#36205d] border border-[#6133b4] px-3 py-1.5 rounded-full text-xs sm:text-sm font-condensed font-bold text-[#ffbe5d] tabular-nums transition shadow-inner"
            >
              <Coins className="w-4 h-4 text-[#ffbe5d] shrink-0" />
              <span>{stats.gold}</span>
            </button>

            {/* Botão Atributos & Conquistas (com indicador de pontos livres) */}
            <button
              onClick={onOpenStats}
              className="relative flex items-center gap-1.5 text-xs font-condensed font-bold px-3 py-1.5 rounded-md bg-[#36205d] hover:bg-[#271b3d] text-[#ede8ff] border border-[#925cf3]/40 transition"
              title="Atributos, Conquistas e Backup"
            >
              <Trophy className="w-3.5 h-3.5 text-[#ffbe5d]" />
              <span className="hidden sm:inline">Perfil & Conquistas</span>
              {unallocatedPoints > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#24cc8f] text-[#1a181d] text-[10px] font-extrabold animate-pulse">
                  +{unallocatedPoints}
                </span>
              )}
            </button>

            {/* Botão Conta / Sincronização */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 text-xs font-condensed font-bold px-3 py-1.5 rounded-md bg-[#36205d] hover:bg-[#271b3d] text-[#ede8ff] border border-[#925cf3]/40 transition"
              title="Perfil e Conta Online"
            >
              <User className="w-3.5 h-3.5 text-[#d6c7ff]" />
              <span className="hidden sm:inline">{userEmail ? 'Sincronizado' : 'Entrar'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Sub-Navbar Contextual do Habitica (#36205d) */}
      {(activeSection === 'inventario' || activeSection === 'loja') && (
        <div className="bg-[#36205d] border-b border-[#271b3d] px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-1.5 text-xs font-condensed font-bold tracking-wide">
            {activeSection === 'inventario' && (
              <>
                <button
                  onClick={() => onSelectInvTab('equipment')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition shrink-0 ${
                    invTab === 'equipment'
                      ? 'bg-[#6133b4] text-white shadow-sm'
                      : 'text-[#d6c7ff]/80 hover:text-white hover:bg-[#432874]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Equipamentos ({ownedEquipmentCount})
                </button>
                <button
                  onClick={() => onSelectInvTab('stable')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition shrink-0 ${
                    invTab === 'stable'
                      ? 'bg-[#6133b4] text-white shadow-sm'
                      : 'text-[#d6c7ff]/80 hover:text-white hover:bg-[#432874]'
                  }`}
                >
                  <PawPrint className="w-3.5 h-3.5" />
                  Estábulo — Mascotes ({ownedPetsCount}/{ALL_PET_IDS.length})
                </button>
                <button
                  onClick={() => onSelectInvTab('appearance')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition shrink-0 ${
                    invTab === 'appearance'
                      ? 'bg-[#6133b4] text-white shadow-sm'
                      : 'text-[#d6c7ff]/80 hover:text-white hover:bg-[#432874]'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Customizar Avatar & Cenários
                </button>
              </>
            )}

            {activeSection === 'loja' &&
              SHOP_SUBTABS.map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSelectShopFilter(st.id)}
                  className={`px-3 py-1.5 rounded-md transition shrink-0 ${
                    shopFilter === st.id
                      ? 'bg-[#6133b4] text-white shadow-sm'
                      : 'text-[#d6c7ff]/80 hover:text-white hover:bg-[#432874]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 3. Hero & Party Banner Oficial Estilo Habitica (#271b3d) */}
      <div className="bg-[#271b3d] border-b border-[#3a2859] px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Esquerda: Palco 140x140 do Avatar + 3 Barras Empilhadas */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  onSelectSection('inventario');
                  onSelectInvTab('appearance');
                }}
                className="group relative focus:outline-none shrink-0"
                title="Customizar Avatar e Fundo de Cenário"
              >
                <CharacterAvatar
                  appearance={appearance}
                  equipped={equipped}
                  costume={costume}
                  useCostume={useCostume}
                  petId={petId}
                  size="stage"
                  className="border-2 border-[#6133b4] group-hover:border-[#ffbe5d] transition shadow-xl"
                />
              </button>

              {/* Nome/Classe no Mobile ao lado do Avatar */}
              <div className="sm:hidden space-y-1.5 min-w-0">
                <button
                  onClick={onOpenAuth}
                  className="font-condensed font-bold text-lg text-white hover:text-[#ffbe5d] truncate block"
                >
                  {heroName}
                </button>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-condensed font-bold px-2 py-0.5 rounded bg-[#36205d] text-[#ffbe5d] border border-[#6133b4]">
                    Nível {stats.level}
                  </span>
                  <span
                    className={`text-[11px] font-condensed font-bold px-2 py-0.5 rounded border ${classMeta.badgeClass}`}
                  >
                    {classMeta.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Barras Grossas Empilhadas (Estamina, Experiência, Mana) + Identificação do Herói */}
            <div className="flex-1 max-w-md space-y-2.5">
              {/* Topo Desktop: Nome do Herói + Classe + Nível + Status Exausto */}
              <div className="hidden sm:flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenAuth}
                    className="font-condensed font-bold text-lg text-white hover:text-[#ffbe5d] leading-none transition"
                    title="Editar nome do herói"
                  >
                    {heroName}
                  </button>
                  <span
                    className={`text-[11px] font-condensed font-bold px-2 py-0.5 rounded border ${classMeta.badgeClass}`}
                  >
                    {classMeta.label} · Nv. {stats.level}
                  </span>
                </div>

                {isExhausted && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#ff6165]/25 text-[#ffd4d5] border border-[#ff6165]/60"
                    title="Estamina zerada: -30% de Ouro e Dano no Boss (XP normal!)"
                  >
                    <AlertTriangle className="w-3 h-3 text-[#ff6165]" />
                    Exausto (-30% GP/Dano)
                  </span>
                )}
              </div>

              {/* Barra 1: Estamina (STA) */}
              <div className="flex items-center gap-2.5" title="Estamina (STA)">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isExhausted || staminaPct <= 25
                      ? 'bg-[#ff6165]/20'
                      : staminaPct <= 50
                        ? 'bg-[#ffbe5d]/20'
                        : 'bg-[#24cc8f]/20'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isExhausted || staminaPct <= 25
                        ? 'text-[#ff6165] fill-[#ff6165]'
                        : staminaPct <= 50
                          ? 'text-[#ffbe5d] fill-[#ffbe5d]'
                          : 'text-[#24cc8f] fill-[#24cc8f]'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="h-3.5 bg-[#191129] rounded-full overflow-hidden border border-[#3a2859] p-[1px]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExhausted || staminaPct <= 25
                          ? 'bg-[#ff6165]'
                          : staminaPct <= 50
                            ? 'bg-[#ffbe5d]'
                            : 'bg-[#24cc8f]'
                      }`}
                      style={{ width: `${staminaPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-condensed font-bold text-[#e6dcff] tabular-nums w-24 text-right">
                  {stats.hp} / {stats.max_hp} STA
                </span>
              </div>

              {/* Barra 2: Experiência (XP) */}
              <div className="flex items-center gap-2.5" title="Experiência (XP)">
                <div className="w-5 h-5 rounded-full bg-[#ffbe5d]/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#ffbe5d] fill-[#ffbe5d]" />
                </div>
                <div className="flex-1">
                  <div className="h-3.5 bg-[#191129] rounded-full overflow-hidden border border-[#3a2859] p-[1px]">
                    <div
                      className="h-full rounded-full bg-[#ffbe5d] transition-all duration-300"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-condensed font-bold text-[#e6dcff] tabular-nums w-24 text-right">
                  {stats.xp} / {stats.xp_to_next} XP
                </span>
              </div>

              {/* Barra 3: Mana (MP) */}
              <div className="flex items-center gap-2.5" title="Mana (MP)">
                <div className="w-5 h-5 rounded-full bg-[#50b5e9]/20 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-[#50b5e9] fill-[#50b5e9]" />
                </div>
                <div className="flex-1">
                  <div className="h-3.5 bg-[#191129] rounded-full overflow-hidden border border-[#3a2859] p-[1px]">
                    <div
                      className="h-full rounded-full bg-[#50b5e9] transition-all duration-300"
                      style={{ width: `${mpPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-condensed font-bold text-[#e6dcff] tabular-nums w-24 text-right">
                  {stats.mp} / {stats.max_mp} MP
                </span>
              </div>

              {/* Pílulas de Atributos + Alerta Exausto Mobile */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-condensed">
                <button
                  onClick={onOpenStats}
                  className="bg-[#191129] hover:bg-[#36205d] border border-[#432874] px-2 py-0.5 rounded text-rose-300 font-bold transition"
                >
                  STR {totalAttributes.str}
                </button>
                <button
                  onClick={onOpenStats}
                  className="bg-[#191129] hover:bg-[#36205d] border border-[#432874] px-2 py-0.5 rounded text-sky-300 font-bold transition"
                >
                  INT {totalAttributes.int}
                </button>
                <button
                  onClick={onOpenStats}
                  className="bg-[#191129] hover:bg-[#36205d] border border-[#432874] px-2 py-0.5 rounded text-emerald-300 font-bold transition"
                >
                  CON {totalAttributes.con}
                </button>
                <button
                  onClick={onOpenStats}
                  className="bg-[#191129] hover:bg-[#36205d] border border-[#432874] px-2 py-0.5 rounded text-amber-300 font-bold transition"
                >
                  PER {totalAttributes.per}
                </button>
                {isExhausted && (
                  <span className="sm:hidden inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-[#ff6165]/25 text-[#ffd4d5] border border-[#ff6165]/60">
                    <AlertTriangle className="w-3 h-3 text-[#ff6165]" />
                    Exausto (-30% GP/Dano)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Direita: Banner do Clã KTZ + Mini-Avatares + Card do Boss Progressivo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Mini-Avatares dos membros online da KTZ (estilo Party Banner do Habitica) */}
            {remoteMembers.length > 0 && (
              <button
                onClick={() => onSelectSection('ktz')}
                className="hidden xl:flex items-center -space-x-2 hover:space-x-1 transition-all pr-1"
                title="Ver membros da KTZ - Know The Zero"
              >
                {remoteMembers.slice(0, 4).map((m) => (
                  <div key={m.id} className="relative">
                    <CharacterAvatar
                      appearance={m.appearance}
                      equipped={m.equipped}
                      costume={m.costume}
                      useCostume={m.use_costume}
                      petId={m.stable?.equippedPet}
                      size="sm"
                      className="border-2 border-[#432874] shadow-md"
                    />
                  </div>
                ))}
              </button>
            )}

            {/* Card Oficial do Boss Ativo da KTZ */}
            <button
              onClick={() => onSelectSection('ktz')}
              className="flex items-center gap-3.5 bg-[#191129]/90 hover:bg-[#36205d]/90 border border-[#6133b4] rounded-lg px-3.5 py-2.5 text-left transition min-w-[290px] sm:min-w-[330px] shadow-lg group"
            >
              <div className="relative w-14 h-14 rounded-md bg-[#271b3d] border border-[#4f2a93] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-[#ff6165] transition">
                <img
                  src={bossSprite}
                  alt={bossName}
                  className="w-12 h-12 object-contain [image-rendering:pixelated]"
                />
                <span className="absolute bottom-0 right-0 text-[9px] font-condensed font-bold px-1 bg-black/75 text-[#ffbe5d]">
                  #{bossStage}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-condensed font-bold uppercase tracking-wider text-[#d6c7ff]">
                    KTZ · Missão de Boss
                  </span>
                  <span className="text-[10px] font-condensed font-bold text-[#ffbe5d]">
                    ⚔️ Atq {bossAttack} STA
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-condensed font-bold text-white mb-1.5">
                  <span className="flex items-center gap-1 truncate">
                    <Sword className="w-3.5 h-3.5 text-[#ff6165] shrink-0" />
                    {bossName}
                  </span>
                  <span className="text-[#ffd4d5] tabular-nums text-xs shrink-0">
                    {bossHp} / {bossMaxHp} HP
                  </span>
                </div>

                <div className="w-full h-2.5 bg-[#271b3d] rounded-full overflow-hidden border border-[#432874]">
                  <div
                    className="h-full bg-[#ff6165] transition-all duration-300"
                    style={{ width: `${bossPct}%` }}
                  />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
