CREATE TABLE IF NOT EXISTS public.adaptive_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_date date NOT NULL DEFAULT (now()::date),
  type text NOT NULL,
  title text NOT NULL,
  reason text NOT NULL,
  suggested_action text NOT NULL,
  priority integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adaptive_insights_user_date
  ON public.adaptive_insights (user_id, insight_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_adaptive_insights_user_date_type
  ON public.adaptive_insights (user_id, insight_date, type);

ALTER TABLE public.adaptive_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own insights select"
  ON public.adaptive_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own insights insert"
  ON public.adaptive_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own insights update"
  ON public.adaptive_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "own insights delete"
  ON public.adaptive_insights FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_adaptive_insights_updated_at
  BEFORE UPDATE ON public.adaptive_insights
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();