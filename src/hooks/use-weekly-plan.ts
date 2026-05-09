import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WeeklyPlanData } from "@/lib/weekly";

export type WeeklyPlanRow = {
  id: string;
  user_id: string;
  week_start: string;
  meal_plan_id: string | null;
  workout_plan_id: string | null;
  plan_data: WeeklyPlanData;
  created_at: string;
  updated_at: string;
};

export function useWeeklyPlan(userId: string | undefined, weekStart: string | undefined) {
  const [row, setRow] = useState<WeeklyPlanRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || !weekStart) {
      setRow(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("weekly_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();
    if (error) setError(error.message);
    setRow((data as unknown as WeeklyPlanRow) || null);
    setLoading(false);
  }, [userId, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (
      data: WeeklyPlanData,
      refs: { meal_plan_id?: string | null; workout_plan_id?: string | null },
    ) => {
      if (!userId || !weekStart) throw new Error("Not signed in");
      const { error } = await supabase.from("weekly_plans").upsert(
        {
          user_id: userId,
          week_start: weekStart,
          meal_plan_id: refs.meal_plan_id ?? null,
          workout_plan_id: refs.workout_plan_id ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plan_data: data as any,
        },
        { onConflict: "user_id,week_start" },
      );
      if (error) throw error;
      await load();
    },
    [userId, weekStart, load],
  );

  return { row, loading, error, save, reload: load };
}
