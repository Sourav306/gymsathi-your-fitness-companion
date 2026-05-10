import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PrepTaskDraft } from "@/lib/grocery-generate";

export type MealPrepTask = {
  id: string;
  user_id: string;
  task_date: string;
  title: string;
  instructions: string | null;
  storage: string | null;
  reheating: string | null;
  duration_min: number | null;
  position: number;
  is_completed: boolean;
  source: string;
  source_id: string | null;
};

export function useMealPrepTasks(userId: string | undefined, range?: { from: string; to: string }) {
  const [tasks, setTasks] = useState<MealPrepTask[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let q = supabase.from("meal_prep_tasks").select("*").eq("user_id", userId);
    if (range) q = q.gte("task_date", range.from).lte("task_date", range.to);
    const { data } = await q.order("task_date").order("position");
    setTasks((data as MealPrepTask[]) || []);
    setLoading(false);
  }, [userId, range?.from, range?.to]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(async (id: string, completed: boolean) => {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, is_completed: completed } : t)));
    await supabase.from("meal_prep_tasks").update({ is_completed: completed }).eq("id", id);
  }, []);

  const remove = useCallback(async (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
    await supabase.from("meal_prep_tasks").delete().eq("id", id);
  }, []);

  const generate = useCallback(
    async (drafts: PrepTaskDraft[], opts?: { source?: string; sourceId?: string | null }) => {
      if (!userId || !drafts.length) return;
      // Remove any existing tasks for the same dates first to avoid duplicates
      const dates = Array.from(new Set(drafts.map((d) => d.task_date)));
      await supabase.from("meal_prep_tasks").delete().eq("user_id", userId).in("task_date", dates);
      const rows = drafts.map((d) => ({
        user_id: userId,
        task_date: d.task_date,
        title: d.title,
        instructions: d.instructions ?? null,
        storage: d.storage ?? null,
        reheating: d.reheating ?? null,
        duration_min: d.duration_min ?? null,
        position: d.position,
        source: opts?.source ?? "auto",
        source_id: opts?.sourceId ?? null,
      }));
      const { error } = await supabase.from("meal_prep_tasks").insert(rows);
      if (error) throw error;
      await reload();
    },
    [userId, reload],
  );

  return { tasks, loading, reload, toggle, remove, generate };
}
