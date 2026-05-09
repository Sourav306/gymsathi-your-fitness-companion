import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface ProgressLog {
  id?: string;
  user_id?: string;
  log_date: string;
  weight_kg: number | null;
  calories_consumed: number | null;
  protein_consumed: number | null;
  water_liters: number | null;
  workout_completed: boolean;
  meal_plan_completed: boolean;
  notes: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function useProgress(limit: number = 60) {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("progress_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(limit);
    if (error) setError(error.message);
    setLogs((data || []) as ProgressLog[]);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const upsert = useCallback(
    async (log: Partial<ProgressLog>) => {
      if (!user) throw new Error("Not signed in");
      const row = {
        user_id: user.id,
        log_date: log.log_date || today(),
        weight_kg: log.weight_kg ?? null,
        calories_consumed: log.calories_consumed ?? null,
        protein_consumed: log.protein_consumed ?? null,
        water_liters: log.water_liters ?? null,
        workout_completed: !!log.workout_completed,
        meal_plan_completed: !!log.meal_plan_completed,
        notes: log.notes ?? null,
      };
      const { error } = await supabase
        .from("progress_logs")
        .upsert(row, { onConflict: "user_id,log_date" });
      if (error) throw error;
      await load();
    },
    [user, load],
  );

  const todayLog = logs.find((l) => l.log_date === today()) || null;

  return { user, logs, todayLog, loading: authLoading || loading, error, upsert, reload: load };
}
