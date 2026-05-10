
ALTER TABLE public.grocery_items
  ADD COLUMN IF NOT EXISTS already_have boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_meal text,
  ADD COLUMN IF NOT EXISTS estimated_cost numeric,
  ADD COLUMN IF NOT EXISTS note text;
