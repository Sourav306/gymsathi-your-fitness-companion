import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MealPlan, WorkoutPlan } from "@/lib/ai/schemas";

export type SavedMealPlan = { id: string; name: string | null; created_at: string; plan: MealPlan };
export type SavedWorkoutPlan = { id: string; name: string | null; created_at: string; plan: WorkoutPlan };

export function useSavedMealPlans(userId: string | undefined) {
  const [items, setItems] = useState<SavedMealPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_meal_plans")
      .select("id,name,created_at,plan")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) setItems(data as unknown as SavedMealPlan[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("ai_meal_plans").delete().eq("id", id);
    if (!error) setItems((p) => p.filter((x) => x.id !== id));
    return !error;
  };

  return { items, loading, refresh, remove };
}

export function useSavedWorkoutPlans(userId: string | undefined) {
  const [items, setItems] = useState<SavedWorkoutPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_workout_plans")
      .select("id,name,created_at,plan")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) setItems(data as unknown as SavedWorkoutPlan[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("ai_workout_plans").delete().eq("id", id);
    if (!error) setItems((p) => p.filter((x) => x.id !== id));
    return !error;
  };

  return { items, loading, refresh, remove };
}
