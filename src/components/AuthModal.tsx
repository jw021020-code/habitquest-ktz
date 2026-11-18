'use client';

import React, { useState } from 'react';
import { LogIn, LogOut, User, X } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  heroName: string;
  onChangeHeroName: (name: string) => void;
  userEmail: string | null;
  onAuthSuccess: () => void;
}

export function AuthModal({
  open,
  onClose,
  heroName,
  onChangeHeroName,
  userEmail,
  onAuthSuccess,
}: AuthModalProps) {
  const [editedName, setEditedName] = useState<string | null>(null);
  const [registerNick, setRegisterNick] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!open) return null;

  const currentName = editedName ?? heroName;
  const supabaseReady = isSupabaseConfigured();

  const handleClose = () => {
    setEditedName(null);
    setFeedback(null);
    onClose();
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = currentName.trim();
    if (!clean) return;
    onChangeHeroName(clean);
    setEditedName(null);
    setFeedback('Nome do herói atualizado!');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) return;
    setLoading(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await onAuthSuccess();
        handleClose();
      } else {
        const chosenNick = registerNick.trim() || email.split('@')[0] || 'Aprendiz';
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: chosenNick } },
        });
        if (error) throw error;
        onChangeHeroName(chosenNick);
        await onAuthSuccess();
        if (data.session) {
          handleClose();
        } else {
          setFeedback('Conta criada! Faça login (ou confirme seu e-mail se solicitado).');
          setMode('login');
        }
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabaseReady) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    await onAuthSuccess();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#23202a] border border-[#432874] rounded-md w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-[#432874] px-4 py-3 flex items-center justify-between border-b border-[#36205d]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#ffbe5d]" />
            <h2 className="font-condensed font-bold text-base uppercase tracking-wide text-white">
              Conta do Clã — KTZ Know The Zero
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-black/20 text-white/80 hover:text-white"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          {/* Edição rápida do Nome do Herói (quando já está logado ou no modo local) */}
          {(userEmail || !supabaseReady) && (
            <form onSubmit={handleSaveName} className="space-y-1.5">
              <label className="block text-xs font-condensed font-bold uppercase tracking-wider text-[#cfc8dc]">
                Nome do Herói
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 bg-[#1a181d] border border-[#3a3447] rounded px-3 py-1.5 text-[#f3f1f7] focus:outline-none focus:border-[#925cf3]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#6133b4] hover:bg-[#7241cc] text-white text-xs font-condensed font-bold uppercase tracking-wider"
                >
                  Salvar Nome
                </button>
              </div>
            </form>
          )}

          <div className={userEmail || !supabaseReady ? 'border-t border-[#3a3447] pt-3' : ''}>
            {!supabaseReady ? (
              <div className="bg-[#1a181d] border border-[#3a3447] rounded-md p-3 text-xs text-[#a8a1b5] space-y-1.5">
                <p className="font-condensed font-bold uppercase text-white">Modo Local Ativo</p>
                <p>
                  Conecte as variáveis do Supabase para sincronizar em tempo real com o clã{' '}
                  <strong className="text-[#ffbe5d]">KTZ - Know The Zero</strong>.
                </p>
              </div>
            ) : userEmail ? (
              <div className="bg-[#1a181d] border border-[#24cc8f]/40 rounded-md p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-[#24cc8f] font-condensed font-bold uppercase">
                    ✓ Membro Ativo da KTZ - Know The Zero
                  </p>
                  <p className="text-xs text-[#cfc8dc] truncate">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#2c2836] hover:bg-[#3a3447] text-xs font-condensed font-bold text-[#ff6165]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-3">
                <div className="grid grid-cols-2 gap-1.5 text-xs font-condensed font-bold uppercase">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`py-2 rounded border ${
                      mode === 'register'
                        ? 'bg-[#6133b4] border-[#925cf3] text-white'
                        : 'bg-[#1a181d] border-[#3a3447] text-[#a8a1b5]'
                    }`}
                  >
                    Criar Conta na KTZ
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`py-2 rounded border ${
                      mode === 'login'
                        ? 'bg-[#6133b4] border-[#925cf3] text-white'
                        : 'bg-[#1a181d] border-[#3a3447] text-[#a8a1b5]'
                    }`}
                  >
                    Já Tenho Conta
                  </button>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-condensed font-bold uppercase tracking-wider text-[#cfc8dc] mb-1">
                      Seu Apelido no Clã KTZ*
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={24}
                      value={registerNick}
                      onChange={(e) => setRegisterNick(e.target.value)}
                      placeholder="Ex.: BioBryy, Zero..."
                      className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-3 py-2 text-xs text-[#f3f1f7] focus:outline-none focus:border-[#925cf3]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-condensed font-bold uppercase tracking-wider text-[#cfc8dc] mb-1">
                    E-mail*
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-3 py-2 text-xs text-[#f3f1f7] focus:outline-none focus:border-[#925cf3]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-condensed font-bold uppercase tracking-wider text-[#cfc8dc] mb-1">
                    Senha*
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#1a181d] border border-[#3a3447] rounded px-3 py-2 text-xs text-[#f3f1f7] focus:outline-none focus:border-[#925cf3]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded bg-[#24cc8f] hover:brightness-110 text-[#1a181d] text-xs font-condensed font-bold uppercase tracking-wider shadow-md"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {loading
                    ? 'Conectando...'
                    : mode === 'login'
                      ? 'Entrar na KTZ'
                      : 'Criar Conta & Entrar no Clã'}
                </button>
              </form>
            )}
          </div>

          {feedback && (
            <p className="text-xs text-center text-[#ffbe5d] font-medium">{feedback}</p>
          )}
        </div>
      </div>
    </div>
  );
}
