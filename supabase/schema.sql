create extension if not exists "pgcrypto";


-- =========================================
-- PROFILES
-- =========================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  username text unique,
  full_name text,
  avatar_url text,

  language text not null default 'en'
    check (language in ('en', 'om', 'am')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================
-- TRADES
-- =========================================

create table public.trades (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  pair text not null
    check (
      pair in (
        'XAUUSD',
        'EURUSD',
        'GBPUSD',
        'USDJPY',
        'AUDUSD'
      )
    ),

  direction text not null
    check (
      direction in ('BUY', 'SELL')
    ),

  sl numeric(12,2) not null default 0
    check (sl >= 0),

  tp numeric(12,2) not null default 0
    check (tp >= 0),

  lot_size numeric(10,2) not null
    check (lot_size > 0),

  strategy text not null,

  notes text,

  screenshot_url text,

  result text not null
    check (
      result in ('WIN', 'LOSS', 'BREAKEVEN')
    ),

  profit_loss numeric(12,2) not null default 0,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- =========================================
-- CHALLENGES
-- =========================================

create table public.challenges (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null default 'Forex Challenge',

  starting_balance numeric(14,2) not null default 0,

  target_balance numeric(14,2) not null default 0,

  current_balance numeric(14,2) not null default 0,

  max_drawdown numeric(14,2) not null default 0,

  status text not null default 'ACTIVE'
    check (
      status in ('ACTIVE', 'PASSED', 'FAILED', 'COMPLETED')
    ),

  started_at timestamptz not null default now(),

  completed_at timestamptz
);


-- =========================================
-- INDEXES
-- =========================================

create index trades_user_id_idx
on public.trades(user_id);

create index trades_created_at_idx
on public.trades(created_at desc);

create index trades_pair_idx
on public.trades(pair);

create index challenges_user_id_idx
on public.challenges(user_id);


-- =========================================
-- NEW USER PROFILE
-- =========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$

begin

  insert into public.profiles (
    id,
    full_name
  )

  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      ''
    )
  );

  return new;

end;

$$;


drop trigger if exists on_auth_user_created
on auth.users;


create trigger on_auth_user_created

after insert on auth.users

for each row

execute procedure public.handle_new_user();