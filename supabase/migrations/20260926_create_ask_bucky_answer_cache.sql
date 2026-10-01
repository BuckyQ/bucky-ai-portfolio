create table if not exists public.ask_bucky_answer_cache (
  cache_key text primary key,
  answer text,
  sources jsonb not null default '[]'::jsonb,
  answer_created_at timestamptz,
  expires_at timestamptz,
  lease_owner text,
  lease_expires_at timestamptz,
  hit_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ask_bucky_answer_cache_key_check
    check (char_length(cache_key) between 10 and 128),
  constraint ask_bucky_answer_cache_answer_check
    check (answer is null or char_length(answer) between 1 and 8000),
  constraint ask_bucky_answer_cache_sources_check
    check (jsonb_typeof(sources) = 'array'),
  constraint ask_bucky_answer_cache_answer_state_check
    check (
      (answer is null and answer_created_at is null and expires_at is null)
      or
      (answer is not null and answer_created_at is not null and expires_at is not null)
    ),
  constraint ask_bucky_answer_cache_lease_state_check
    check (
      (lease_owner is null and lease_expires_at is null)
      or
      (
        lease_owner is not null
        and lease_expires_at is not null
        and char_length(lease_owner) between 1 and 128
      )
    )
);

create index if not exists ask_bucky_answer_cache_expiry_idx
  on public.ask_bucky_answer_cache (expires_at);

alter table public.ask_bucky_answer_cache enable row level security;

revoke all on table public.ask_bucky_answer_cache from anon, authenticated;
grant select, insert, update, delete
  on table public.ask_bucky_answer_cache
  to service_role;

create or replace function public.claim_ask_bucky_answer_cache(
  p_cache_key text,
  p_lease_owner text,
  p_lease_seconds integer
)
returns table (
  cache_state text,
  cached_answer text,
  cached_sources jsonb,
  cached_created_at timestamptz,
  cached_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz;
  v_entry public.ask_bucky_answer_cache%rowtype;
begin
  if p_cache_key is null
    or char_length(p_cache_key) not between 10 and 128
    or p_lease_owner is null
    or char_length(p_lease_owner) not between 1 and 128
    or p_lease_seconds not between 1 and 300 then
    raise exception 'Invalid answer-cache claim input.'
      using errcode = '22023';
  end if;

  loop
    v_now := clock_timestamp();

    select cache.*
      into v_entry
      from public.ask_bucky_answer_cache as cache
      where cache.cache_key = p_cache_key
      for update;

    if found then
      if v_entry.answer is not null and v_entry.expires_at > v_now then
        update public.ask_bucky_answer_cache as cache
          set hit_count = cache.hit_count + 1,
              updated_at = v_now
          where cache.cache_key = p_cache_key
          returning cache.* into v_entry;

        return query select
          'hit'::text,
          v_entry.answer,
          v_entry.sources,
          v_entry.answer_created_at,
          v_entry.expires_at;
        return;
      end if;

      if v_entry.lease_expires_at is null
        or v_entry.lease_expires_at <= v_now then
        update public.ask_bucky_answer_cache as cache
          set answer = null,
              sources = '[]'::jsonb,
              answer_created_at = null,
              expires_at = null,
              lease_owner = p_lease_owner,
              lease_expires_at = v_now + make_interval(secs => p_lease_seconds),
              updated_at = v_now
          where cache.cache_key = p_cache_key;

        return query select
          'owner'::text,
          null::text,
          null::jsonb,
          null::timestamptz,
          null::timestamptz;
        return;
      end if;

      return query select
        'pending'::text,
        null::text,
        null::jsonb,
        null::timestamptz,
        null::timestamptz;
      return;
    end if;

    begin
      insert into public.ask_bucky_answer_cache (
        cache_key,
        lease_owner,
        lease_expires_at,
        updated_at
      ) values (
        p_cache_key,
        p_lease_owner,
        v_now + make_interval(secs => p_lease_seconds),
        v_now
      );

      return query select
        'owner'::text,
        null::text,
        null::jsonb,
        null::timestamptz,
        null::timestamptz;
      return;
    exception when unique_violation then
      -- Another request inserted the lease first. Retry and lock its row.
    end;
  end loop;
end;
$$;

create or replace function public.store_ask_bucky_answer_cache(
  p_cache_key text,
  p_lease_owner text,
  p_answer text,
  p_sources jsonb,
  p_ttl_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz;
  v_updated integer;
begin
  if p_answer is null
    or char_length(p_answer) not between 1 and 8000
    or p_sources is null
    or jsonb_typeof(p_sources) <> 'array'
    or p_ttl_seconds not between 60 and 31536000 then
    raise exception 'Invalid answer-cache store input.'
      using errcode = '22023';
  end if;

  v_now := clock_timestamp();

  update public.ask_bucky_answer_cache as cache
    set answer = p_answer,
        sources = p_sources,
        answer_created_at = v_now,
        expires_at = v_now + make_interval(secs => p_ttl_seconds),
        lease_owner = null,
        lease_expires_at = null,
        updated_at = v_now
    where cache.cache_key = p_cache_key
      and cache.lease_owner = p_lease_owner;

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.release_ask_bucky_answer_cache(
  p_cache_key text,
  p_lease_owner text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.ask_bucky_answer_cache as cache
    where cache.cache_key = p_cache_key
      and cache.lease_owner = p_lease_owner;

  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$$;

revoke all on function public.claim_ask_bucky_answer_cache(text, text, integer)
  from public, anon, authenticated;
revoke all on function public.store_ask_bucky_answer_cache(text, text, text, jsonb, integer)
  from public, anon, authenticated;
revoke all on function public.release_ask_bucky_answer_cache(text, text)
  from public, anon, authenticated;

grant execute on function public.claim_ask_bucky_answer_cache(text, text, integer)
  to service_role;
grant execute on function public.store_ask_bucky_answer_cache(text, text, text, jsonb, integer)
  to service_role;
grant execute on function public.release_ask_bucky_answer_cache(text, text)
  to service_role;
