-- Ensure one daily recommendation per user per date
CREATE UNIQUE INDEX IF NOT EXISTS daily_recommendations_user_date_uniq
  ON public.daily_recommendations(user_id, for_date);

CREATE INDEX IF NOT EXISTS daily_recommendations_user_date_idx
  ON public.daily_recommendations(user_id, for_date DESC);

-- Progress logs
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL,
  weight_kg numeric,
  calories_consumed integer,
  protein_consumed integer,
  water_liters numeric,
  workout_completed boolean NOT NULL DEFAULT false,
  meal_plan_completed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS progress_logs_user_date_idx
  ON public.progress_logs(user_id, log_date DESC);

ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own progress select" ON public.progress_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own progress insert" ON public.progress_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress update" ON public.progress_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own progress delete" ON public.progress_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER progress_logs_set_updated_at
  BEFORE UPDATE ON public.progress_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();