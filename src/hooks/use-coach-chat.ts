import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useProfile } from "./use-profile";
import { useDailyTasks } from "./use-daily-tasks";
import { useProgress } from "./use-progress";
import { useAdaptiveCoach } from "./use-adaptive-coach";
import { useWeeklyPlan } from "./use-weekly-plan";
import { fmtISO, startOfWeek, todayWeekdayIndex } from "@/lib/weekly";
import {
  generateCoachChatResponse,
  type CoachAction,
  type CoachResponse,
} from "@/lib/ai/chat.functions";
import type { TaskCategory, NewTask } from "@/lib/tasks/defaults";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatActionState {
  action: CoachAction;
  status: "pending" | "applied" | "cancelled";
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  intent: string | null;
  actions: ChatActionState[];
  created_at: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

interface DbRow {
  id: string;
  role: ChatRole;
  content: string;
  intent: string | null;
  action_json: { actions?: ChatActionState[] } | null;
  created_at: string;
}

function rowToMessage(r: DbRow): ChatMessage {
  return {
    id: r.id,
    role: r.role,
    content: r.content,
    intent: r.intent,
    actions: (r.action_json?.actions ?? []) as ChatActionState[],
    created_at: r.created_at,
  };
}

export function useCoachChat() {
  const { user } = useAuth();
  const { profile, save: saveProfile } = useProfile();
  const tasksHook = useDailyTasks();
  const progress = useProgress(7);
  const adaptive = useAdaptiveCoach();
  const weekStartISO = fmtISO(startOfWeek());
  const weekly = useWeeklyPlan(user?.id, user ? weekStartISO : undefined);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useServerFn(generateCoachChatResponse);

  const load = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from("coach_chat_messages")
      .select("id,role,content,intent,action_json,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (e) setError(e.message);
    const rows = ((data || []) as unknown as DbRow[]).reverse();
    setMessages(rows.map(rowToMessage));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const buildContext = useCallback(() => {
    const todayIdx = todayWeekdayIndex();
    const todayPlan = weekly.row?.plan_data?.days?.[todayIdx];
    const weeklyPlanSummary = todayPlan
      ? `Today: ${todayPlan.workout?.focus ?? "rest"} (${todayPlan.workout?.durationMin ?? 0}min); ${todayPlan.meals.length} meals planned`
      : weekly.row
        ? "Weekly plan exists"
        : null;

    const last7logs = progress.logs.slice(0, 7);
    const proteinAvg = last7logs.length
      ? Math.round(
          last7logs.reduce((a, l) => a + (l.protein_consumed ?? 0), 0) / last7logs.length,
        )
      : 0;
    const workoutsDone = last7logs.filter((l) => l.workout_completed).length;
    const recentSummary = `7d: ${last7logs.length} days logged, avg protein ${proteinAvg}g, workouts done ${workoutsDone}/${last7logs.length}`;

    return {
      profile: profile as unknown as Record<string, unknown> | null,
      todayTasks: tasksHook.tasks.map((t) => ({
        title: t.title,
        category: t.category,
        is_completed: t.is_completed,
        target_value: t.target_value,
        completed_value: t.completed_value,
        unit: t.unit,
      })),
      todayLog: progress.todayLog as unknown as Record<string, unknown> | null,
      latestEvaluation: null,
      adaptiveInsights: adaptive.insights.slice(0, 6).map((i) => ({
        title: i.title,
        type: i.type,
        status: i.status,
        suggested_action: i.suggested_action,
      })),
      weeklyPlanSummary,
      recentSummary,
    };
  }, [profile, tasksHook.tasks, progress.logs, progress.todayLog, adaptive.insights, weekly.row]);

  const persistMessage = useCallback(
    async (msg: {
      role: ChatRole;
      content: string;
      intent?: string | null;
      actions?: ChatActionState[];
    }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error: e } = await supabase
        .from("coach_chat_messages")
        .insert({
          user_id: user.id,
          role: msg.role,
          content: msg.content,
          intent: msg.intent ?? null,
          action_json: msg.actions ? { actions: msg.actions } : null,
        })
        .select("id,role,content,intent,action_json,created_at")
        .single();
      if (e) throw e;
      return rowToMessage(data as unknown as DbRow);
    },
    [user],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !user) return;
      setSending(true);
      setError(null);
      try {
        const userMsg = await persistMessage({ role: "user", content: trimmed });
        setMessages((prev) => [...prev, userMsg]);

        const recent = [...messages, userMsg].slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const { response } = (await generate({
          data: { userMessage: trimmed, context: buildContext(), recentMessages: recent },
        })) as { response: CoachResponse };

        const actions: ChatActionState[] = (response.suggested_actions || []).map((a) => ({
          action: a,
          status: "pending",
        }));
        const aiMsg = await persistMessage({
          role: "assistant",
          content: response.reply,
          intent: response.intent,
          actions,
        });
        setMessages((prev) => [...prev, aiMsg]);
      } catch (e) {
        setError((e as Error)?.message || "Chat failed");
      } finally {
        setSending(false);
      }
    },
    [user, messages, persistMessage, generate, buildContext],
  );

  const updateActionStatus = useCallback(
    async (messageId: string, idx: number, status: "applied" | "cancelled") => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const next = m.actions.map((a, i) => (i === idx ? { ...a, status } : a));
          return { ...m, actions: next };
        }),
      );
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;
      const next = target.actions.map((a, i) => (i === idx ? { ...a, status } : a));
      await supabase
        .from("coach_chat_messages")
        .update({ action_json: { actions: next } })
        .eq("id", messageId);
    },
    [messages],
  );

  const confirmAction = useCallback(
    async (messageId: string, idx: number) => {
      const msg = messages.find((m) => m.id === messageId);
      const action = msg?.actions[idx]?.action;
      if (!action || !user) return;

      try {
        if (action.type === "create_task") {
          const date = action.target_date === "today" ? today() : tomorrowISO();
          const task: NewTask & { user_id: string; task_date: string } = {
            user_id: user.id,
            task_date: date,
            title: action.title,
            description: action.description || undefined,
            category: (action.category ?? "habit") as TaskCategory,
            target_value: action.target_value ?? 1,
            unit: action.unit ?? null,
            points: action.points ?? 10,
            priority: action.priority ?? 2,
          };
          // de-dupe by title + date
          const { data: existing } = await supabase
            .from("daily_tasks")
            .select("id")
            .eq("user_id", user.id)
            .eq("task_date", date)
            .eq("title", task.title)
            .limit(1);
          if (!existing || existing.length === 0) {
            const { error: insErr } = await supabase.from("daily_tasks").insert(task);
            if (insErr) throw insErr;
          }
          if (date === today()) await tasksHook.reload();
        } else if (action.type === "add_disliked_food" || action.type === "add_liked_food") {
          if (!profile) throw new Error("Profile missing");
          const food = (action.food || "").trim();
          if (food) {
            const field = action.type === "add_disliked_food" ? "disliked_foods" : "liked_foods";
            const current = (profile[field] || "").toString();
            const list = current
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (!list.some((s) => s.toLowerCase() === food.toLowerCase())) {
              list.push(food);
              await saveProfile({ ...profile, [field]: list.join(", ") });
            }
          }
        } else if (action.type === "refresh_insights") {
          await adaptive.refresh();
        }
        // open_link is handled by UI navigation; just mark applied.
        await updateActionStatus(messageId, idx, "applied");
      } catch (e) {
        setError((e as Error)?.message || "Failed to apply action");
      }
    },
    [messages, user, profile, saveProfile, tasksHook, adaptive, updateActionStatus],
  );

  const cancelAction = useCallback(
    async (messageId: string, idx: number) => {
      await updateActionStatus(messageId, idx, "cancelled");
    },
    [updateActionStatus],
  );

  const clearChat = useCallback(async () => {
    if (!user) return;
    await supabase.from("coach_chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
  }, [user]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    confirmAction,
    cancelAction,
    clearChat,
    reload: load,
  };
}
