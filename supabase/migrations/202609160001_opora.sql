-- Opora only. Does not modify existing tables or authentication settings.
begin;
create table if not exists public.opora_training (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"sessions":{},"history":[]}'::jsonb,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint opora_data_object check (jsonb_typeof(data) = 'object' and jsonb_typeof(data->'sessions') = 'object' and jsonb_typeof(data->'history') = 'array')
);
alter table public.opora_training enable row level security;
revoke all on public.opora_training from anon;
grant select, insert, update on public.opora_training to authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='opora_training' and policyname='opora_select_own') then
    create policy "opora_select_own" on public.opora_training for select to authenticated using ((select auth.uid()) = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='opora_training' and policyname='opora_insert_own') then
    create policy "opora_insert_own" on public.opora_training for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='opora_training' and policyname='opora_update_own') then
    create policy "opora_update_own" on public.opora_training for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end $$;
-- Compare-and-swap prevents an older device from overwriting newer data.
create or replace function public.opora_save(p_data jsonb, p_revision bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_revision bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_revision = 0 then
    insert into public.opora_training(user_id, data) values(auth.uid(), p_data)
    on conflict(user_id) do nothing returning revision into v_revision;
  else
    update public.opora_training set data = p_data, revision = revision + 1, updated_at = now()
    where user_id = auth.uid() and revision = p_revision returning revision into v_revision;
  end if;
  return jsonb_build_object('ok', v_revision is not null, 'revision', v_revision);
end;
$$;
revoke all on function public.opora_save(jsonb,bigint) from public, anon;
grant execute on function public.opora_save(jsonb,bigint) to authenticated;
commit;
