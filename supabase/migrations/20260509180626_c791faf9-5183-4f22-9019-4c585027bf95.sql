
CREATE TABLE public.coach_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  intent text,
  action_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chat select" ON public.coach_chat_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own chat insert" ON public.coach_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chat update" ON public.coach_chat_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own chat delete" ON public.coach_chat_messages
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_coach_chat_user_created
  ON public.coach_chat_messages (user_id, created_at DESC);

CREATE TRIGGER set_coach_chat_updated_at
  BEFORE UPDATE ON public.coach_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
