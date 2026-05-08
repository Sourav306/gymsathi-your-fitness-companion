
-- user_profiles
create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  age int,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  goal text,
  activity_level text,
  gym_access text,
  experience text,
  injuries text,
  diet_preference text,
  allergies text,
  disliked_foods text,
  cuisine_preference text,
  weekly_budget numeric,
  cooking_time_min int,
  meal_prep_days int,
  meals_per_day int,
  target_protein int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
create policy "own profile select" on public.user_profiles for select using (auth.uid() = user_id);
create policy "own profile insert" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.user_profiles for update using (auth.uid() = user_id);
create policy "own profile delete" on public.user_profiles for delete using (auth.uid() = user_id);

-- ai_meal_plans
create table public.ai_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text,
  plan jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.ai_meal_plans enable row level security;
create policy "own meal plans select" on public.ai_meal_plans for select using (auth.uid() = user_id);
create policy "own meal plans insert" on public.ai_meal_plans for insert with check (auth.uid() = user_id);
create policy "own meal plans update" on public.ai_meal_plans for update using (auth.uid() = user_id);
create policy "own meal plans delete" on public.ai_meal_plans for delete using (auth.uid() = user_id);

-- ai_workout_plans
create table public.ai_workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text,
  plan jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.ai_workout_plans enable row level security;
create policy "own workout plans select" on public.ai_workout_plans for select using (auth.uid() = user_id);
create policy "own workout plans insert" on public.ai_workout_plans for insert with check (auth.uid() = user_id);
create policy "own workout plans update" on public.ai_workout_plans for update using (auth.uid() = user_id);
create policy "own workout plans delete" on public.ai_workout_plans for delete using (auth.uid() = user_id);

-- daily_recommendations
create table public.daily_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  for_date date not null,
  recommendation jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, for_date)
);
alter table public.daily_recommendations enable row level security;
create policy "own daily recs select" on public.daily_recommendations for select using (auth.uid() = user_id);
create policy "own daily recs insert" on public.daily_recommendations for insert with check (auth.uid() = user_id);
create policy "own daily recs update" on public.daily_recommendations for update using (auth.uid() = user_id);
create policy "own daily recs delete" on public.daily_recommendations for delete using (auth.uid() = user_id);

-- updated_at trigger for user_profiles
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();
