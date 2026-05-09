import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useProfile } from "./use-profile";
import { buildDefaultTasks, type TaskCategory } from "@/lib/tasks/defaults";

export interface DailyTask {
  id: string;
  user_id: string;
  task_date: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  target_value: number | null;
  completed_value: number | null;
  unit: string | null;
  is_completed: boolean;
  points: number;
  priority: number;
}

const today = () => new Date().toISOString().slice(0, 10);

export function useDailyTasks(date?: string) {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const taskDate = date || today();

  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_date", taskDate)
      .order("priority", { ascending: true });
    if (error) setError(error.message);
    setTasks((data || []) as any);
    setLoading(false);
  }, [user, taskDate]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const generateTodayTasks = useCallback(async () => {
    if (!user) throw new Error("Not signed in");
    const defs = buildDefaultTasks(profile);
    const rows = defs.map((d) => ({ ...d, user_id: user.id, task_date: taskDate }));
    const { error } = await supabase.from("daily_tasks").insert(rows);
    if (error) throw error;
    await load();
  }, [user, profile, taskDate, load]);

  const toggleComplete = useCallback(async (id: string, isCompleted: boolean) => {
    const t = tasks.find((x) => x.id === id);
    const completed_value = isCompleted ? (t?.target_value ?? 1) : 0;
    const { error } = await supabase
      .from("daily_tasks")
      .update({ is_completed: isCompleted, completed_value })
      .eq("id", id);
    if (error) throw error;
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, is_completed: isCompleted, completed_value } : x)));
  }, [tasks]);

  const updateProgress = useCallback(async (id: string, value: number) => {
    const t = tasks.find((x) => x.id === id);
    const target = t?.target_value ?? 0;
    const is_completed = target > 0 ? value >= target : value > 0;
    const { error } = await supabase
      .from("daily_tasks")
      .update({ completed_value: value, is_completed })
      .eq("id", id);
    if (error) throw error;
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, completed_value: value, is_completed } : x)));
  }, [tasks]);

  const tasksTotal = tasks.length;
  const tasksCompleted = tasks.filter((t) => t.is_completed).length;
  const completionPct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  return {
    user, profile, tasks, loading: authLoading || loading, error,
    tasksTotal, tasksCompleted, completionPct,
    generateTodayTasks, toggleComplete, updateProgress, reload: load,
  };
}
