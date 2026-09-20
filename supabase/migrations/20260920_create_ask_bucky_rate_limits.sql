create table if not exists public.ask_bucky_rate_limits (
  identifier_hash text primary key,
  request_count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint ask_bucky_rate_limits_count_check
    check (request_count >= 0),
  constraint ask_bucky_rate_limits_identifier_check
    check (char_length(identifier_hash) between 1 and 128)
);

alter table public.ask_bucky_rate_limits enable row level security;

revoke all on table public.ask_bucky_rate_limits from anon, authenticated;
grant select, insert, update, delete
  on table public.ask_bucky_rate_limits
  to service_role;

create or replace function public.reserve_ask_bucky_daily_limit(
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  current_count integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz;
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_identifier_hash is null
    or char_length(p_identifier_hash) not between 1 and 128
    or p_limit < 1
    or p_window_seconds < 1 then
    raise exception 'Invalid rate-limit reservation input.'
      using errcode = '22023';
  end if;

  loop
    v_now := clock_timestamp();

    select limits.request_count, limits.reset_at
      into v_count, v_reset_at
      from public.ask_bucky_rate_limits as limits
      where limits.identifier_hash = p_identifier_hash
      for update;

    if found then
      if v_reset_at <= v_now then
        update public.ask_bucky_rate_limits as limits
          set request_count = 1,
              reset_at = v_now + make_interval(secs => p_window_seconds),
              updated_at = v_now
          where limits.identifier_hash = p_identifier_hash
          returning limits.request_count, limits.reset_at
            into v_count, v_reset_at;

        return query select true, v_count, v_reset_at;
        return;
      end if;

      if v_count >= p_limit then
        return query select false, v_count, v_reset_at;
        return;
      end if;

      update public.ask_bucky_rate_limits as limits
        set request_count = limits.request_count + 1,
            updated_at = v_now
        where limits.identifier_hash = p_identifier_hash
        returning limits.request_count, limits.reset_at
          into v_count, v_reset_at;

      return query select true, v_count, v_reset_at;
      return;
    end if;

    begin
      insert into public.ask_bucky_rate_limits (
        identifier_hash,
        request_count,
        reset_at,
        updated_at
      ) values (
        p_identifier_hash,
        1,
        v_now + make_interval(secs => p_window_seconds),
        v_now
      )
      returning ask_bucky_rate_limits.request_count,
        ask_bucky_rate_limits.reset_at
        into v_count, v_reset_at;

      return query select true, v_count, v_reset_at;
      return;
    exception when unique_violation then
      -- A concurrent insert won. Retry and lock that row.
    end;
  end loop;
end;
$$;

create or replace function public.release_ask_bucky_daily_limit(
  p_identifier_hash text,
  p_reset_at timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.ask_bucky_rate_limits as limits
    set request_count = greatest(limits.request_count - 1, 0),
        updated_at = clock_timestamp()
    where limits.identifier_hash = p_identifier_hash
      and limits.reset_at = p_reset_at
    returning limits.request_count into v_count;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.reserve_ask_bucky_daily_limit(text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.release_ask_bucky_daily_limit(text, timestamptz)
  from public, anon, authenticated;

grant execute on function public.reserve_ask_bucky_daily_limit(text, integer, integer)
  to service_role;
grant execute on function public.release_ask_bucky_daily_limit(text, timestamptz)
  to service_role;
