# Guia de Deploy Online — HabitQuest (Supabase + Vercel)

Siga estes 3 passos para colocar o app online e enviar o link para seus amigos jogarem juntos pelo navegador do PC ou celular:

---

## 1. Configurar o Banco de Dados (Supabase)
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto gratuito.
2. No menu lateral, abra **SQL Editor** → **New query**.
3. Copie todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
4. Em **Project Settings → API**, copie:
   - `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

*(Opcional: em **Authentication → Providers → Email**, você pode desmarcar "Confirm email" para seus amigos entrarem imediatamente sem precisar confirmar o e-mail).*

---

## 2. Testar Online Localmente (opcional)
Crie o arquivo `app/.env.local` baseado em `.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```
Reinicie `npm run dev` e clique em **Entrar** no topo para criar sua conta e testar a Party.

---

## 3. Publicar na Vercel (Grátis)
1. Suba a pasta `app/` para um repositório no GitHub (ou use `npx vercel` direto na pasta `app/`).
2. Na **Vercel**, importe o projeto (Root Directory: `app` se o repositório for a pasta pai).
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Clique em **Deploy** e envie a URL gerada (`https://seu-app.vercel.app`) para seus amigos!
   - No celular (Android/iOS), basta abrir o link no navegador e tocar em **"Adicionar à tela inicial"** para usar como app.
