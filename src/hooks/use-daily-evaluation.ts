import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useProfile } from "./use-profile";
import { useDailyTasks, type DailyTask } from "./use-daily-tasks";
import { useProgress, type ProgressLog } from "./use-progress";
import { calcTargets } from "@/lib/ai/targets";
import { evaluateDailyPerformance } from "@/lib/ai/evaluate.functions";

export interface DailyEvaluation {
  id: string;
  user_id: string;
  evaluation_date: string;
  completion_score: number;
  tasks_completed: number;
  tasks_total: number;
  tasks_missed: string[] | null;
  protein_status: string | null;
  calorie_status: string | null;
  water_status: string | null;
  workout_status: string | null;
  steps_status: string | null;
  sleep_status: string | null;
  compared_to_yesterday: string | null;
  compared_to_7_day_average: string | null;
  ai_feedback_message: string | null;
  improvement_suggestions: string[] | null;
}

const today = () => new Date().toISOString().slice(0, 10);
const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export interface DailyEvaluationOptions {
  tasks?: DailyTask[];
  tasksTotal?: number;
  tasksCompleted?: number;
  completionPct?: number;
  todayLog?: ProgressLog | null;
}

export function useDailyEvaluation(opts: DailyEvaluationOptions = {}) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const externalTasks = opts.tasks !== undefined;
  const externalProgress = opts.todayLog !== undefined;
  const tasksFallback = useDailyTasks(externalTasks ? "__skip__" : undefined);
  const progressFallback = useProgress(externalProgress ? 0 : 14);
  const tasks = externalTasks ? (opts.tasks as DailyTask[]) : tasksFallback.tasks;
  const tasksTotal = externalTasks ? (opts.tasksTotal ?? tasks.length) : tasksFallback.tasksTotal;
  const tasksCompleted = externalTasks
    ? (opts.tasksCompleted ?? tasks.filter((t) => t.is_completed).length)
    : tasksFallback.tasksCompleted;
  const completionPct = externalTasks
    ? (opts.completionPct ??
      (tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0))
    : tasksFallback.completionPct;
  const todayLog = externalProgress ? (opts.todayLog ?? null) : progressFallback.todayLog;
  const [evaluation, setEvaluation] = useState<DailyEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const evaluate = useServerFn(evaluateDailyPerformance);

  const load = useCallback(async () => {
    if (!user) {
      setEvaluation(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("daily_evaluations")
      .select("*")
      .eq("user_id", user.id)
      .eq("evaluation_date", today())
      .maybeSingle();
    setEvaluation((data as DailyEvaluation) || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const analyze = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    setBusy(true);
    setError(null);
    try {
      // yesterday tasks
      const { data: yTasks } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("task_date", isoDaysAgo(1));

      // last 7 days summary
      const startISO = isoDaysAgo(7);
      const { data: weekTasks } = await supabase
        .from("daily_tasks")
        .select("task_date,is_completed")
        .eq("user_id", user.id)
        .gte("task_date", startISO);

      const byDate = new Map<string, { total: number; completed: number }>();
      (weekTasks || []).forEach((t: { task_date: string; is_completed: boolean }) => {
        const cur = byDate.get(t.task_date) || { total: 0, completed: 0 };
        cur.total += 1;
        if (t.is_completed) cur.completed += 1;
        byDate.set(t.task_date, cur);
      });
      const last7 = Array.from(byDate.entries()).map(([date, v]) => ({ date, ...v }));

      const targets: { calories: number | null; protein: number | null } = profile
        ? calcTargets(profile)
        : { calories: null, protein: null };
      const waterTarget = profile?.water_goal_liters ?? 3;
      const stepsTarget = profile?.step_goal ?? 8000;

      const stripTask = (t: DailyTask) => ({
        title: t.title,
        category: t.category,
        target_value: t.target_value,
        completed_value: t.completed_value,
        unit: t.unit,
        is_completed: t.is_completed,
        points: t.points,
      });

      const { feedback } = await evaluate({
        data: {
          date: today(),
          tasksToday: tasks.map(stripTask),
          tasksYesterday: (yTasks || []).map(stripTask),
          tasksLast7: last7,
          metrics: {
            proteinTarget: targets.protein,
            proteinActual: todayLog?.protein_consumed ?? null,
            caloriesTarget: targets.calories,
            caloriesActual: todayLog?.calories_consumed ?? null,
            waterTarget,
            waterActual: todayLog?.water_liters != null ? Number(todayLog.water_liters) : null,
            stepsTarget,
            stepsActual: null,
            workoutDone:
              todayLog?.workout_completed ??
              tasks.find((t) => t.category === "workout")?.is_completed ??
              null,
          },
          profile: { name: profile?.name ?? null, goal: profile?.goal ?? null },
        },
      });

      const missed = tasks.filter((t) => !t.is_completed).map((t) => t.title);
      const row = {
        user_id: user.id,
        evaluation_date: today(),
        completion_score: completionPct,
        tasks_completed: tasksCompleted,
        tasks_total: tasksTotal,
        tasks_missed: missed,
        protein_status: feedback.protein_status,
        calorie_status: feedback.calorie_status,
        water_status: feedback.water_status,
        workout_status: feedback.workout_status,
        steps_status: feedback.steps_status,
        sleep_status: feedback.sleep_status,
        compared_to_yesterday: feedback.compared_to_yesterday,
        compared_to_7_day_average: feedback.compared_to_7_day_average,
        ai_feedback_message: feedback.ai_feedback_message,
        improvement_suggestions: feedback.improvement_suggestions,
      };
      const { error: upErr } = await supabase
        .from("daily_evaluations")
        .upsert(row, { onConflict: "user_id,evaluation_date" });
      if (upErr) throw upErr;
      await load();
    } catch (e) {
      setError((e as Error)?.message || "Failed to analyze your day");
      throw e;
    } finally {
      setBusy(false);
    }
  }, [user, profile, tasks, completionPct, tasksCompleted, tasksTotal, todayLog, evaluate, load]);

  return { evaluation, loading, busy, error, analyze, reload: load };
}
