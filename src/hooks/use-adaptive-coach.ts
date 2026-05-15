import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useProfile } from "./use-profile";
import { calcTargets } from "@/lib/ai/targets";
import {
  generateAdaptiveInsights,
  appliedTaskDate,
  type AdaptiveInsight,
  type InsightDraft,
  type InsightStatus,
} from "@/lib/coach/adaptive";
import { fmtISO, startOfWeek } from "@/lib/weekly";
import type { TaskCategory } from "@/lib/tasks/defaults";

const today = () => new Date().toISOString().slice(0, 10);
const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

interface InsightTaskRow {
  task_date: string;
  category: TaskCategory;
  is_completed: boolean;
  title: string;
}

interface InsightProgressRow {
  log_date: string;
  protein_consumed: number | null;
  water_liters: number | null;
  workout_completed: boolean;
}

export function useAdaptiveCoach() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const [insights, setInsights] = useState<AdaptiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setInsights([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from("adaptive_insights")
      .select("*")
      .eq("user_id", user.id)
      .gte("insight_date", isoDaysAgo(7))
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });
    if (e) setError(e.message);
    setInsights((data || []) as unknown as AdaptiveInsight[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const since = isoDaysAgo(7);
      const [tasksRes, logsRes, weekRes] = await Promise.all([
        supabase
          .from("daily_tasks")
          .select("task_date,category,is_completed,title")
          .eq("user_id", user.id)
          .gte("task_date", since)
          .limit(100),
        supabase
          .from("progress_logs")
          .select("log_date,protein_consumed,water_liters,workout_completed")
          .eq("user_id", user.id)
          .gte("log_date", since)
          .limit(14),
        supabase
          .from("weekly_plans")
          .select("id")
          .eq("user_id", user.id)
          .eq("week_start", fmtISO(startOfWeek()))
          .maybeSingle(),
      ]);

      const targets = profile ? calcTargets(profile) : { calories: 2000, protein: 100 };
      const drafts = generateAdaptiveInsights({
        profile,
        weekTasks: (tasksRes.data || []) as unknown as InsightTaskRow[],
        weekLogs: (logsRes.data || []) as unknown as InsightProgressRow[],
        proteinTarget: targets.protein,
        waterTargetL: profile?.water_goal_liters ?? 3,
        hasWeeklyPlan: !!weekRes.data,
      });

      const day = today();
      // Fetch existing insights for today to avoid clobbering applied/dismissed
      const { data: existingToday } = await supabase
        .from("adaptive_insights")
        .select("id,type,status")
        .eq("user_id", user.id)
        .eq("insight_date", day);
      const existingByType = new Map(
        ((existingToday || []) as { id: string; type: string; status: string }[]).map((r) => [
          r.type,
          r,
        ]),
      );

      const toInsert: InsightDraft[] = drafts.filter((d) => !existingByType.has(d.type));
      if (toInsert.length > 0) {
        const rows = toInsert.map((d) => ({
          user_id: user.id,
          insight_date: day,
          type: d.type,
          title: d.title,
          reason: d.reason,
          suggested_action: d.suggested_action,
          priority: d.priority,
          status: "active",
          metadata: (d.metadata ?? null) as unknown as Record<string, unknown>,
        }));
        const { error: insErr } = await supabase.from("adaptive_insights").insert(rows);
        if (insErr) throw insErr;
      }
      await load();
    } catch (e) {
      setError((e as Error)?.message || "Failed to refresh insights");
    } finally {
      setBusy(false);
    }
  }, [user, profile, load]);

  const setStatus = useCallback(async (id: string, status: InsightStatus) => {
    const { error: e } = await supabase.from("adaptive_insights").update({ status }).eq("id", id);
    if (e) throw e;
    setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }, []);

  const apply = useCallback(
    async (insight: AdaptiveInsight) => {
      if (!user) throw new Error("Not signed in");
      const meta = insight.metadata;
      const task = meta?.task;
      if (task) {
        const target = appliedTaskDate();
        // Avoid duplicate task by title + date
        const { data: existing } = await supabase
          .from("daily_tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("task_date", target)
          .eq("title", task.title)
          .limit(1);
        if (!existing || existing.length === 0) {
          const { error: tErr } = await supabase.from("daily_tasks").insert({
            user_id: user.id,
            task_date: target,
            title: task.title,
            description: task.description ?? null,
            category: task.category,
            target_value: task.target_value,
            unit: task.unit,
            points: task.points,
            priority: task.priority,
          });
          if (tErr) throw tErr;
        }
      }
      await setStatus(insight.id, "applied");
    },
    [user, setStatus],
  );

  const dismiss = useCallback(
    async (insight: AdaptiveInsight) => {
      await setStatus(insight.id, "dismissed");
    },
    [setStatus],
  );

  const active = insights.filter((i) => i.status === "active" && i.insight_date === today());

  return { insights, active, loading, busy, error, refresh, apply, dismiss, reload: load };
}
