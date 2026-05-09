
-- Phase 1: extend user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS workout_days_per_week integer,
  ADD COLUMN IF NOT EXISTS workout_time_min integer,
  ADD COLUMN IF NOT EXISTS liked_foods text,
  ADD COLUMN IF NOT EXISTS water_goal_liters numeric,
  ADD COLUMN IF NOT EXISTS step_goal integer,
  ADD COLUMN IF NOT EXISTS sleep_goal_hours numeric,
  ADD COLUMN IF NOT EXISTS budget_level text,
  ADD COLUMN IF NOT EXISTS meal_prep_style text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Phase 2: daily_tasks
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_date date NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  target_value numeric,
  completed_value numeric DEFAULT 0,
  unit text,
  is_completed boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 10,
  priority integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_tasks_user_date_idx ON public.daily_tasks (user_id, task_date);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own daily tasks select" ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own daily tasks insert" ON public.daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily tasks update" ON public.daily_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own daily tasks delete" ON public.daily_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER daily_tasks_set_updated_at
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Phase 4: daily_evaluations
CREATE TABLE IF NOT EXISTS public.daily_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  evaluation_date date NOT NULL,
  completion_score integer NOT NULL DEFAULT 0,
  tasks_completed integer NOT NULL DEFAULT 0,
  tasks_total integer NOT NULL DEFAULT 0,
  tasks_missed jsonb,
  protein_status text,
  calorie_status text,
  water_status text,
  workout_status text,
  steps_status text,
  sleep_status text,
  compared_to_yesterday text,
  compared_to_7_day_average text,
  ai_feedback_message text,
  improvement_suggestions jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, evaluation_date)
);

ALTER TABLE public.daily_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own daily evals select" ON public.daily_evaluations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own daily evals insert" ON public.daily_evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily evals update" ON public.daily_evaluations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own daily evals delete" ON public.daily_evaluations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER daily_evaluations_set_updated_at
  BEFORE UPDATE ON public.daily_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
