
-- grocery_lists
CREATE TABLE public.grocery_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Grocery List',
  week_start date,
  source text NOT NULL DEFAULT 'manual', -- 'weekly_plan' | 'ai_meal_plan' | 'manual'
  source_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own grocery lists select" ON public.grocery_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own grocery lists insert" ON public.grocery_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own grocery lists update" ON public.grocery_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own grocery lists delete" ON public.grocery_lists FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_grocery_lists_updated BEFORE UPDATE ON public.grocery_lists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_grocery_lists_user ON public.grocery_lists(user_id, created_at DESC);

-- grocery_items
CREATE TABLE public.grocery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  list_id uuid NOT NULL REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Other',
  name text NOT NULL,
  quantity numeric,
  unit text,
  is_checked boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own grocery items select" ON public.grocery_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own grocery items insert" ON public.grocery_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own grocery items update" ON public.grocery_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own grocery items delete" ON public.grocery_items FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_grocery_items_updated BEFORE UPDATE ON public.grocery_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_grocery_items_list ON public.grocery_items(list_id, position);
CREATE INDEX idx_grocery_items_user ON public.grocery_items(user_id);

-- meal_prep_tasks
CREATE TABLE public.meal_prep_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_date date NOT NULL,
  title text NOT NULL,
  instructions text,
  storage text,
  reheating text,
  duration_min integer,
  position integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_prep_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prep tasks select" ON public.meal_prep_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own prep tasks insert" ON public.meal_prep_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prep tasks update" ON public.meal_prep_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own prep tasks delete" ON public.meal_prep_tasks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_meal_prep_tasks_updated BEFORE UPDATE ON public.meal_prep_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_meal_prep_tasks_user_date ON public.meal_prep_tasks(user_id, task_date);
