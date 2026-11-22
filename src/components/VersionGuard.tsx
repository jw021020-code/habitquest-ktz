'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Rocket } from 'lucide-react';
import { APP_VERSION, CLIENT_BUILD_ID } from '@/lib/version';

interface VersionPayload {
  version: string;
  buildId: string;
}

const RELOAD_GUARD_KEY = 'hq_reloaded_build';

export function VersionGuard() {
  const [outdated, setOutdated] = useState<VersionPayload | null>(null);
  const [loopBlocked, setLoopBlocked] = useState(false);
  const checkingRef = useRef(false);

  const performHardReload = useCallback(async (targetBuildId?: string) => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
    } catch {
      // ignore cache API errors
    }

    if (typeof window !== 'undefined') {
      if (targetBuildId) {
        try {
          window.sessionStorage.setItem(RELOAD_GUARD_KEY, targetBuildId);
        } catch {
          // ignore storage errors
        }
      }
      const url = new URL(window.location.href);
      url.searchParams.set('_v', targetBuildId || String(Date.now()));
      window.location.replace(url.toString());
    }
  }, []);

  const checkVersion = useCallback(async () => {
    if (checkingRef.current) return;
    if (CLIENT_BUILD_ID === 'dev' || CLIENT_BUILD_ID.startsWith('local-')) return;

    checkingRef.current = true;
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;
      const data = (await res.json()) as VersionPayload;
      if (!data?.buildId) return;

      if (data.buildId !== CLIENT_BUILD_ID) {
        setOutdated(data);
        try {
          const alreadyTried = window.sessionStorage.getItem(RELOAD_GUARD_KEY);
          if (alreadyTried === data.buildId) {
            setLoopBlocked(true);
            return;
          }
        } catch {
          // ignore storage errors
        }
        setLoopBlocked(false);
      }
    } catch {
      // ignore transient offline errors
    } finally {
      checkingRef.current = false;
    }
  }, []);

  // Limpa parâmetro temporário _v da URL após o reload bem-sucedido
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('_v')) {
      url.searchParams.delete('_v');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Auto-reload em 2s assim que detectar versão nova (a menos que já tenha tentado este mesmo buildId)
  useEffect(() => {
    if (!outdated || loopBlocked) return;
    const timer = window.setTimeout(() => {
      performHardReload(outdated.buildId);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [outdated, loopBlocked, performHardReload]);

  // Gatilhos: mount, foco, visibilitychange, pageshow (bfcache) e polling de 60s
  useEffect(() => {
    checkVersion();

    const onVisibility = () => {
      if (!document.hidden) checkVersion();
    };
    const onFocus = () => checkVersion();
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkVersion();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);

    const interval = window.setInterval(() => {
      if (!document.hidden) checkVersion();
    }, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      window.clearInterval(interval);
    };
  }, [checkVersion]);

  if (!outdated) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#14111a]/95 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-guard-title"
    >
      <div className="w-full max-w-md bg-[#23202a] border-2 border-[#ffbe5d] rounded-lg shadow-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#ffbe5d]/15 border border-[#ffbe5d]/50 flex items-center justify-center mx-auto">
          <Rocket className="w-6 h-6 text-[#ffbe5d]" />
        </div>

        <div className="space-y-1.5">
          <h2 id="version-guard-title" className="font-condensed font-bold text-lg text-white">
            Nova atualização disponível (v{outdated.version})
          </h2>
          <p className="text-xs text-[#cfc8dc] leading-relaxed">
            Sua sessão estava na versão anterior (<span className="text-[#ff8b8e]">v{APP_VERSION}</span>).
            Para manter as regras de combate, loja e missões sincronizadas com a guilda KTZ, estamos
            atualizando o app automaticamente.
          </p>
        </div>

        <button
          onClick={() => performHardReload(outdated.buildId)}
          className="w-full py-2.5 px-4 rounded bg-[#ffbe5d] hover:brightness-110 text-[#1a181d] font-condensed font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 animate-spin" />
          {loopBlocked ? 'Tentar Atualizar Agora' : 'Atualizando em 2s... (Clique para acelerar)'}
        </button>
      </div>
    </div>
  );
}
