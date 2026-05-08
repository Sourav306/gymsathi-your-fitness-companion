-- Phase 4: weekly_plans table for weekly calendar planning
CREATE TABLE public.weekly_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  meal_plan_id uuid NULL,
  workout_plan_id uuid NULL,
  plan_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own weekly plans select" ON public.weekly_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own weekly plans insert" ON public.weekly_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own weekly plans update" ON public.weekly_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own weekly plans delete" ON public.weekly_plans
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER weekly_plans_set_updated_at
  BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_weekly_plans_user_week ON public.weekly_plans (user_id, week_start DESC);