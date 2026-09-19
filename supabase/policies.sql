-- =========================================
-- ENABLE RLS
-- =========================================

alter table public.profiles
enable row level security;

alter table public.trades
enable row level security;

alter table public.challenges
enable row level security;


-- =========================================
-- PROFILES
-- =========================================

create policy "Users can view own profile"

on public.profiles

for select

to authenticated

using (
  auth.uid() = id
);


create policy "Users can update own profile"

on public.profiles

for update

to authenticated

using (
  auth.uid() = id
)

with check (
  auth.uid() = id
);


-- =========================================
-- TRADES
-- =========================================

create policy "Users can view own trades"

on public.trades

for select

to authenticated

using (
  auth.uid() = user_id
);


create policy "Users can create own trades"

on public.trades

for insert

to authenticated

with check (
  auth.uid() = user_id
);


create policy "Users can update own trades"

on public.trades

for update

to authenticated

using (
  auth.uid() = user_id
)

with check (
  auth.uid() = user_id
);


create policy "Users can delete own trades"

on public.trades

for delete

to authenticated

using (
  auth.uid() = user_id
);


-- =========================================
-- CHALLENGES
-- =========================================

create policy "Users can view own challenges"

on public.challenges

for select

to authenticated

using (
  auth.uid() = user_id
);


create policy "Users can create own challenges"

on public.challenges

for insert

to authenticated

with check (
  auth.uid() = user_id
);


create policy "Users can update own challenges"

on public.challenges

for update

to authenticated

using (
  auth.uid() = user_id
)

with check (
  auth.uid() = user_id
);


create policy "Users can delete own challenges"

on public.challenges

for delete

to authenticated

using (
  auth.uid() = user_id
);