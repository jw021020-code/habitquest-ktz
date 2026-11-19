'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Crown, Gift, ScrollText, Sparkles, Sun, Target } from 'lucide-react';
import {
  getCycleTimeRemaining,
  MONTHLY_BONUS_REWARD,
  QuestCycle,
  QuestProgressItem,
} from '@/lib/game/quests';

interface QuestsPanelProps {
  dailyQuests: QuestProgressItem[];
  weeklyQuests: QuestProgressItem[];
  monthlyQuests: QuestProgressItem[];
  monthlyBonusClaimed: boolean;
  totalQuestsCompleted: number;
  dailyKey: string;
  weeklyKey: string;
  monthlyKey: string;
  onClaimQuest: (questId: string, cycle: QuestCycle) => void;
  onClaimMonthlyBonus: () => void;
  onPeriodTick?: () => void;
}

function CycleTimerBadge({
  cycle,
  nowMs,
}: {
  cycle: QuestCycle;
  nowMs: number | null;
}) {
  if (nowMs === null) return null;
  const { label, isUrgent, isCritical } = getCycleTimeRemaining(cycle, new Date(nowMs));
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-condensed font-bold tabular-nums ${
        isCritical
          ? 'bg-[#ff6165]/20 border-[#ff6165] text-[#ff8b8e] animate-pulse'
          : isUrgent
          ? 'bg-[#ffbe5d]/15 border-[#ffbe5d]/60 text-[#ffbe5d]'
          : 'bg-[#1a181d] border-[#3a3447] text-[#cfc8dc]'
      }`}
      title="Tempo restante até o reset deste ciclo (Horário de Brasília)"
    >
      <Clock className="w-3 h-3" />
      Restam {label}
    </span>
  );
}

function RewardChips({ item }: { item: QuestProgressItem }) {
  const { reward } = item.def;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-condensed font-bold">
      <span className="px-2 py-0.5 rounded bg-[#24cc8f]/15 text-[#24cc8f] border border-[#24cc8f]/30">
        +{reward.xp} XP
      </span>
      <span className="px-2 py-0.5 rounded bg-[#ffbe5d]/15 text-[#ffbe5d] border border-[#ffbe5d]/30">
        +{reward.gold} GP
      </span>
      {reward.eggOrPotionChance && (
        <span className="px-2 py-0.5 rounded bg-[#925cf3]/20 text-[#d6c7ff] border border-[#925cf3]/40">
          🥚 {Math.round(reward.eggOrPotionChance * 100)}% Ovo/Poção
        </span>
      )}
      {reward.guaranteedEggOrPotion && (
        <span className="px-2 py-0.5 rounded bg-[#925cf3]/20 text-[#d6c7ff] border border-[#925cf3]/40">
          🥚 1 Ovo ou Poção
        </span>
      )}
      {(reward.eggs || reward.potions) && (
        <span className="px-2 py-0.5 rounded bg-[#925cf3]/20 text-[#d6c7ff] border border-[#925cf3]/40">
          🥚 +{reward.eggs ?? 0} Ovo · 🧪 +{reward.potions ?? 0} Poção
        </span>
      )}
    </div>
  );
}

function QuestCard({
  item,
  onClaim,
}: {
  item: QuestProgressItem;
  onClaim: () => void;
}) {
  const canClaim = item.completed && !item.claimed;

  return (
    <div
      className={`rounded-md border p-4 transition shadow-md flex flex-col justify-between gap-3 ${
        item.claimed
          ? 'bg-[#1f1c26] border-[#24cc8f]/40 opacity-85'
          : canClaim
          ? 'bg-[#282138] border-[#ffbe5d] shadow-[#ffbe5d]/10'
          : 'bg-[#23202a] border-[#342e40]'
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <span className="text-2xl leading-none shrink-0 mt-0.5">{item.def.icon}</span>
            <div>
              <h3 className="font-condensed font-bold text-sm sm:text-base text-white leading-snug">
                {item.def.title}
              </h3>
              <p className="text-xs text-[#a8a1b5] mt-0.5">{item.def.description}</p>
            </div>
          </div>

          {item.claimed ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#24cc8f]/20 text-[#24cc8f] border border-[#24cc8f]/40 text-[10px] font-condensed font-bold uppercase">
              <CheckCircle2 className="w-3 h-3" />
              Resgatada
            </span>
          ) : item.completed ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffbe5d]/20 text-[#ffbe5d] border border-[#ffbe5d]/40 text-[10px] font-condensed font-bold uppercase animate-pulse">
              Pronta!
            </span>
          ) : (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#1a181d] text-[#a8a1b5] border border-[#3a3447] text-[10px] font-condensed font-bold tabular-nums">
              {item.pct}%
            </span>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-condensed font-bold">
            <span className="text-[#cfc8dc]">Progresso</span>
            <span className={item.completed ? 'text-[#24cc8f]' : 'text-[#ffbe5d]'}>
              {item.displayCurrent} / {item.displayTarget}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#1a181d] border border-[#3a3447] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                item.completed
                  ? 'bg-gradient-to-r from-[#24cc8f] to-[#50e3c2]'
                  : 'bg-gradient-to-r from-[#6133b4] to-[#925cf3]'
              }`}
              style={{ width: `${item.pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#342e40] flex flex-wrap items-center justify-between gap-2">
        <RewardChips item={item} />

        {canClaim && (
          <button
            onClick={onClaim}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ffbe5d] hover:brightness-110 text-[#1a181d] text-xs font-condensed font-bold uppercase tracking-wider transition shadow cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            Resgatar
          </button>
        )}
      </div>
    </div>
  );
}

export function QuestsPanel({
  dailyQuests,
  weeklyQuests,
  monthlyQuests,
  monthlyBonusClaimed,
  totalQuestsCompleted,
  dailyKey,
  weeklyKey,
  monthlyKey,
  onClaimQuest,
  onClaimMonthlyBonus,
  onPeriodTick,
}: QuestsPanelProps) {
  const [tab, setTab] = useState<'all' | QuestCycle>('all');
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => {
      const t = Date.now();
      setNowMs(t);
      if (getCycleTimeRemaining('daily', new Date(t)).totalMs <= 1000) {
        onPeriodTick?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [onPeriodTick]);

  const monthlyCompletedCount = monthlyQuests.filter((q) => q.completed).length;
  const allMonthlyDone = monthlyQuests.length === 4 && monthlyCompletedCount === 4;
  const canClaimBonus = allMonthlyDone && !monthlyBonusClaimed;

  const readyCount = [...dailyQuests, ...weeklyQuests, ...monthlyQuests].filter(
    (q) => q.completed && !q.claimed
  ).length + (canClaimBonus ? 1 : 0);

  return (
    <main className="max-w-7xl w-full mx-auto px-4 pt-4 pb-8 space-y-4">
      {/* Cabeçalho Missões PRF */}
      <section className="bg-[#23202a] border border-[#342e40] rounded-md overflow-hidden shadow-lg">
        <div className="bg-[#2c2836] border-b border-[#3a3447] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ScrollText className="w-5 h-5 text-[#ffbe5d]" />
            <div>
              <h2 className="font-condensed font-bold text-base sm:text-lg tracking-wide text-white uppercase leading-none">
                Missões de Aprovação PRF
              </h2>
              <p className="text-[11px] text-[#a8a1b5] mt-1">
                4 Pilares Diretos: Estudar X horas · Resolver X questões · Correr X KM · Realizar treino físico
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-condensed font-bold">
            {readyCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-[#ffbe5d]/20 border border-[#ffbe5d] text-[#ffbe5d] animate-pulse">
                🎁 {readyCount} {readyCount === 1 ? 'recompensa pronta' : 'recompensas prontas'}
              </span>
            )}
            <span className="px-2.5 py-1 rounded bg-[#1a181d] border border-[#3a3447] text-[#d6c7ff]">
              🏆 {totalQuestsCompleted} {totalQuestsCompleted === 1 ? 'missão concluída' : 'missões concluídas'}
            </span>
          </div>
        </div>

        {/* Filtro de Ciclo */}
        <div className="px-4 py-2.5 bg-[#1a181d] border-b border-[#342e40] flex flex-wrap gap-2">
          {[
            { id: 'all' as const, label: 'Visão Completa' },
            { id: 'daily' as const, label: '☀️ Diária (1/4)' },
            { id: 'weekly' as const, label: '📅 Semanais (2/4)' },
            { id: 'monthly' as const, label: '🏆 Metas Mensais (4/4)' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setTab(btn.id)}
              className={`px-3 py-1.5 rounded text-xs font-condensed font-bold uppercase tracking-wide transition cursor-pointer ${
                tab === btn.id
                  ? 'bg-[#6133b4] text-white border border-[#925cf3]'
                  : 'bg-[#23202a] text-[#a8a1b5] border border-[#342e40] hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </section>

      {/* 1. Missão Diária (1 sorteada dentre as 4) */}
      {(tab === 'all' || tab === 'daily') && (
        <section className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#ffbe5d]" />
              <h3 className="font-condensed font-bold text-sm sm:text-base uppercase tracking-wider text-white">
                Missão Diária Sorteada
              </h3>
              <span className="text-[11px] font-condensed text-[#a8a1b5] bg-[#23202a] border border-[#342e40] px-2 py-0.5 rounded">
                1 de 4 · {dailyKey}
              </span>
            </div>
            <CycleTimerBadge cycle="daily" nowMs={nowMs} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {dailyQuests.map((item) => (
              <QuestCard
                key={item.def.id}
                item={item}
                onClaim={() => onClaimQuest(item.def.id, 'daily')}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Missões Semanais (2 sorteadas dentre as 4) */}
      {(tab === 'all' || tab === 'weekly') && (
        <section className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#925cf3]" />
              <h3 className="font-condensed font-bold text-sm sm:text-base uppercase tracking-wider text-white">
                Missões Semanais Sorteadas
              </h3>
              <span className="text-[11px] font-condensed text-[#a8a1b5] bg-[#23202a] border border-[#342e40] px-2 py-0.5 rounded">
                2 de 4 · {weeklyKey}
              </span>
            </div>
            <CycleTimerBadge cycle="weekly" nowMs={nowMs} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weeklyQuests.map((item) => (
              <QuestCard
                key={item.def.id}
                item={item}
                onClaim={() => onClaimQuest(item.def.id, 'weekly')}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Metas Mensais PRF (Todas as 4 fixas no mês) */}
      {(tab === 'all' || tab === 'monthly') && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#24cc8f]" />
              <h3 className="font-condensed font-bold text-sm sm:text-base uppercase tracking-wider text-white">
                Metas Mensais de Aprovação PRF
              </h3>
              <span className="text-[11px] font-condensed text-[#a8a1b5] bg-[#23202a] border border-[#342e40] px-2 py-0.5 rounded">
                Todas as 4 ativas · {monthlyKey}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-condensed font-bold text-[#24cc8f]">
                {monthlyCompletedCount}/4 concluídas
              </span>
              <CycleTimerBadge cycle="monthly" nowMs={nowMs} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monthlyQuests.map((item) => (
              <QuestCard
                key={item.def.id}
                item={item}
                onClaim={() => onClaimQuest(item.def.id, 'monthly')}
              />
            ))}
          </div>

          {/* Card Bônus 4/4 Metas Mensais */}
          <div
            className={`rounded-md border p-4 flex flex-wrap items-center justify-between gap-3 transition ${
              monthlyBonusClaimed
                ? 'bg-[#1f1c26] border-[#24cc8f]/40 opacity-85'
                : canClaimBonus
                ? 'bg-gradient-to-r from-[#36205d] to-[#282138] border-[#ffbe5d] shadow-lg'
                : 'bg-[#1a181d] border-[#342e40]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#271b3d] border border-[#ffbe5d]/50 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-[#ffbe5d]" />
              </div>
              <div>
                <h4 className="font-condensed font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                  Baú de Honra PRF do Mês (4/4 Metas Concluídas)
                </h4>
                <p className="text-xs text-[#a8a1b5]">
                  Complete todas as 4 metas mensais ({monthlyCompletedCount}/4) para ganhar{' '}
                  <span className="text-[#24cc8f] font-bold">+{MONTHLY_BONUS_REWARD.xp} XP</span>,{' '}
                  <span className="text-[#ffbe5d] font-bold">+{MONTHLY_BONUS_REWARD.gold} GP</span> e{' '}
                  <span className="text-[#d6c7ff] font-bold">1 Equipamento Garantido (Incomum a Lendário)</span>!
                </p>
              </div>
            </div>

            {monthlyBonusClaimed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#24cc8f]/20 text-[#24cc8f] border border-[#24cc8f]/40 text-xs font-condensed font-bold uppercase">
                <CheckCircle2 className="w-4 h-4" />
                Baú Resgatado
              </span>
            ) : canClaimBonus ? (
              <button
                onClick={onClaimMonthlyBonus}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#ffbe5d] hover:brightness-110 text-[#1a181d] text-xs font-condensed font-bold uppercase tracking-wider transition shadow cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Abrir Baú de Honra
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded bg-[#23202a] border border-[#3a3447] text-xs font-condensed font-bold text-[#8a8299]">
                Faltam {4 - monthlyCompletedCount} metas
              </span>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

interface QuestsSummaryStripProps {
  dailyQuest?: QuestProgressItem;
  readyCount: number;
  onOpenQuests: () => void;
  onClaimDaily: (questId: string) => void;
}

export function QuestsSummaryStrip({
  dailyQuest,
  readyCount,
  onOpenQuests,
  onClaimDaily,
}: QuestsSummaryStripProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!dailyQuest) return null;
  const canClaimDaily = dailyQuest.completed && !dailyQuest.claimed;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 pt-3">
      <div className="bg-[#23202a] border border-[#342e40] rounded-md px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-lg leading-none shrink-0">{dailyQuest.def.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-condensed font-bold uppercase px-1.5 py-0.5 rounded bg-[#36205d] text-[#ffbe5d] border border-[#6133b4]">
                Missão Diária PRF
              </span>
              <span className="text-xs sm:text-sm font-condensed font-bold text-white truncate">
                {dailyQuest.def.title}
              </span>
              <span
                className={`text-xs font-condensed font-bold tabular-nums ${
                  dailyQuest.completed ? 'text-[#24cc8f]' : 'text-[#ffbe5d]'
                }`}
              >
                ({dailyQuest.displayCurrent} / {dailyQuest.displayTarget})
              </span>
              <CycleTimerBadge cycle="daily" nowMs={nowMs} />
            </div>
            <div className="w-full max-w-md h-1.5 rounded-full bg-[#1a181d] border border-[#3a3447] overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 ${
                  dailyQuest.completed ? 'bg-[#24cc8f]' : 'bg-[#925cf3]'
                }`}
                style={{ width: `${dailyQuest.pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canClaimDaily && (
            <button
              onClick={() => onClaimDaily(dailyQuest.def.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#ffbe5d] hover:brightness-110 text-[#1a181d] text-[11px] font-condensed font-bold uppercase tracking-wide cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              Resgatar
            </button>
          )}
          <button
            onClick={onOpenQuests}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#36205d] hover:bg-[#432874] border border-[#6133b4] text-[#e2d8ff] text-[11px] font-condensed font-bold uppercase tracking-wide transition cursor-pointer"
          >
            <ScrollText className="w-3.5 h-3.5 text-[#ffbe5d]" />
            Missões PRF
            {readyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#ffbe5d] text-[#1a181d] text-[10px] font-extrabold">
                {readyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
