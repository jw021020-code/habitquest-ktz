-- Script seguro para excluir apenas a conta duplicada 'netu' (Nv. 1, 0 XP, 0 GP)
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard/project/yxshlrzuosimxbkpdpjz/sql/new

do $$
declare
  target_id uuid;
begin
  select id into target_id
  from public.profiles
  where lower(username) = 'netu'
    and level = 1
    and xp = 0
    and gold = 0
  limit 1;

  if target_id is null then
    raise exception 'Conta duplicada netu (Nv. 1, 0 XP, 0 GP) não encontrada.';
  end if;

  delete from public.party_messages where user_id = target_id;
  delete from public.profiles where id = target_id;
  delete from auth.users where id = target_id;

  raise notice 'Conta duplicada netu (%) excluída com sucesso.', target_id;
end $$;
