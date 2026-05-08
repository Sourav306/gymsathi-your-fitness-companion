import { supabase } from "@/integrations/supabase/client";
import type { RecentProgress } from "./schemas";

interface LogRow {
  log_date: string;
  weight_kg: number | null;
  calories_consumed: number | null;
  protein_consumed: number | null;
  workout_completed: boolean | null;
  meal_plan_completed: boolean | null;
}

export function summarizeProgress(logs: LogRow[]): RecentProgress {
  if (!logs.length) {
    return {
      daysLogged: 0,
      avgProtein: null,
      avgCalories: null,
      workoutCompletionRate: null,
      mealCompletionRate: null,
      latestWeightKg: null,
      weightTrend: "unknown",
    };
  }
  const avg = (vals: (number | null)[]) => {
    const f = vals.filter((v): v is number => typeof v === "number");
    return f.length ? Math.round(f.reduce((a, b) => a + b, 0) / f.length) : null;
  };
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const weights = sorted.map((l) => l.weight_kg).filter((v): v is number => typeof v === "number");
  let trend: RecentProgress["weightTrend"] = "unknown";
  const latestWeight: number | null = weights.length ? weights[weights.length - 1] : null;
  if (weights.length >= 3) {
    const diff = weights[weights.length - 1] - weights[0];
    trend = diff > 0.3 ? "up" : diff < -0.3 ? "down" : "flat";
  }
  return {
    daysLogged: logs.length,
    avgProtein: avg(logs.map((l) => l.protein_consumed)),
    avgCalories: avg(logs.map((l) => l.calories_consumed)),
    workoutCompletionRate: logs.filter((l) => l.workout_completed).length / logs.length,
    mealCompletionRate: logs.filter((l) => l.meal_plan_completed).length / logs.length,
    latestWeightKg: latestWeight,
    weightTrend: trend,
  };
}

export async function fetchRecentProgress(userId: string): Promise<RecentProgress> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data } = await supabase
    .from("progress_logs")
    .select("log_date, weight_kg, calories_consumed, protein_consumed, workout_completed, meal_plan_completed")
    .eq("user_id", userId)
    .gte("log_date", since.toISOString().slice(0, 10))
    .order("log_date", { ascending: false })
    .limit(7);
  return summarizeProgress((data || []) as LogRow[]);
}
