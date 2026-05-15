import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachSupabaseAuth } from "@/integrations/supabase/client-auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

const TaskShape = z.object({
  title: z.string(),
  category: z.string(),
  target_value: z.number().nullable().optional(),
  completed_value: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  is_completed: z.boolean(),
  points: z.number(),
});

const InputSchema = z.object({
  date: z.string(),
  tasksToday: z.array(TaskShape),
  tasksYesterday: z.array(TaskShape).optional().default([]),
  tasksLast7: z
    .array(z.object({ date: z.string(), total: z.number(), completed: z.number() }))
    .optional()
    .default([]),
  metrics: z
    .object({
      proteinTarget: z.number().nullable().optional(),
      proteinActual: z.number().nullable().optional(),
      caloriesTarget: z.number().nullable().optional(),
      caloriesActual: z.number().nullable().optional(),
      waterTarget: z.number().nullable().optional(),
      waterActual: z.number().nullable().optional(),
      stepsTarget: z.number().nullable().optional(),
      stepsActual: z.number().nullable().optional(),
      workoutDone: z.boolean().nullable().optional(),
    })
    .optional()
    .default({}),
  profile: z
    .object({
      name: z.string().nullable().optional(),
      goal: z.string().nullable().optional(),
    })
    .optional()
    .default({}),
});

const FeedbackSchema = z.object({
  ai_feedback_message: z.string(),
  improvement_suggestions: z.array(z.string()),
  protein_status: z.enum(["under", "on_target", "over", "unknown"]).default("unknown"),
  calorie_status: z.enum(["under", "on_target", "over", "unknown"]).default("unknown"),
  water_status: z.enum(["under", "on_target", "over", "unknown"]).default("unknown"),
  workout_status: z.enum(["done", "missed", "unknown"]).default("unknown"),
  steps_status: z.enum(["under", "on_target", "over", "unknown"]).default("unknown"),
  sleep_status: z.enum(["under", "on_target", "over", "unknown"]).default("unknown"),
  compared_to_yesterday: z.string(),
  compared_to_7_day_average: z.string(),
});

type Input = z.infer<typeof InputSchema>;
type Feedback = z.infer<typeof FeedbackSchema>;

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function deterministicFeedback(input: Input): Feedback {
  const todayCompleted = input.tasksToday.filter((t) => t.is_completed).length;
  const todayTotal = input.tasksToday.length;
  const todayPct = pct(todayCompleted, todayTotal);

  const yPct =
    input.tasksYesterday.length > 0
      ? pct(input.tasksYesterday.filter((t) => t.is_completed).length, input.tasksYesterday.length)
      : null;
  const last7 = input.tasksLast7 || [];
  const avgPct =
    last7.length > 0
      ? Math.round(
          last7.reduce((a, d) => a + (d.total > 0 ? (d.completed / d.total) * 100 : 0), 0) /
            last7.length,
        )
      : null;

  const m = input.metrics || {};
  const status = (
    actual?: number | null,
    target?: number | null,
  ): "under" | "on_target" | "over" | "unknown" => {
    if (actual == null || target == null || target <= 0) return "unknown";
    if (actual < target * 0.85) return "under";
    if (actual > target * 1.15) return "over";
    return "on_target";
  };

  const proteinS = status(m.proteinActual, m.proteinTarget);
  const calS = status(m.caloriesActual, m.caloriesTarget);
  const waterS = status(m.waterActual, m.waterTarget);
  const stepsS = status(m.stepsActual, m.stepsTarget);
  const workoutS: Feedback["workout_status"] =
    m.workoutDone == null ? "unknown" : m.workoutDone ? "done" : "missed";

  const cmpY =
    yPct == null
      ? "No data for yesterday yet."
      : todayPct > yPct
        ? `${todayPct - yPct}% better than yesterday`
        : todayPct < yPct
          ? `${yPct - todayPct}% behind yesterday`
          : "About the same as yesterday";

  const cmp7 =
    avgPct == null
      ? "Not enough history to compare yet."
      : todayPct > avgPct
        ? `${todayPct - avgPct}% above your 7-day average`
        : todayPct < avgPct
          ? `${avgPct - todayPct}% below your 7-day average`
          : "Right on your 7-day average";

  const tips: string[] = [];
  if (proteinS === "under")
    tips.push("Add a high-protein snack: paneer, Greek yogurt, eggs, or a whey shake.");
  if (waterS === "under")
    tips.push("Keep a water bottle visible to hit your hydration goal earlier in the day.");
  if (workoutS === "missed")
    tips.push("Try a 20-minute session tomorrow — even short workouts compound.");
  if (stepsS === "under")
    tips.push("Take a 10-minute walk after each meal to boost steps painlessly.");
  if (calS === "over") tips.push("Trim portions slightly at dinner or swap one snack for fruit.");
  if (tips.length === 0) tips.push("Strong day! Keep the routine consistent tomorrow.");

  const name = input.profile?.name || "there";
  const msg =
    `Nice work, ${name}. You completed ${todayCompleted} of ${todayTotal} tasks today (${todayPct}%). ${cmpY}. ${proteinS === "under" ? "Protein was below target — easy fix tomorrow." : proteinS === "on_target" ? "Protein was on target." : ""} ${workoutS === "done" ? "Workout: done ✓" : workoutS === "missed" ? "No workout logged today." : ""}`
      .replace(/\s+/g, " ")
      .trim();

  return {
    ai_feedback_message: msg,
    improvement_suggestions: tips,
    protein_status: proteinS,
    calorie_status: calS,
    water_status: waterS,
    workout_status: workoutS,
    steps_status: stepsS,
    sleep_status: "unknown",
    compared_to_yesterday: cmpY,
    compared_to_7_day_average: cmp7,
  };
}

async function aiFeedback(input: Input, fallback: Feedback): Promise<Feedback> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return fallback;
  const sys = `You are a friendly, honest, motivating personal fitness coach. Output ONLY valid JSON matching:
{ "ai_feedback_message": string, "improvement_suggestions": string[],
  "protein_status": "under"|"on_target"|"over"|"unknown",
  "calorie_status": "under"|"on_target"|"over"|"unknown",
  "water_status": "under"|"on_target"|"over"|"unknown",
  "workout_status": "done"|"missed"|"unknown",
  "steps_status": "under"|"on_target"|"over"|"unknown",
  "sleep_status": "under"|"on_target"|"over"|"unknown",
  "compared_to_yesterday": string,
  "compared_to_7_day_average": string }
Tone: friendly, honest, motivating, never shaming. Be concrete. Mention specific Indian-friendly food ideas when protein is low (paneer, dal, eggs, whey, Greek yogurt). Keep ai_feedback_message under 90 words.`;
  const usr = `Evaluate this user's day and compare to yesterday and the 7-day average.\n${JSON.stringify(input)}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error("evaluate gateway error", res.status);
      return fallback;
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return fallback;
    return FeedbackSchema.parse(JSON.parse(raw));
  } catch (e) {
    console.error("evaluate failed", e);
    return fallback;
  }
}

export const evaluateDailyPerformance = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ feedback: Feedback; source: "ai" | "fallback" }> => {
    const fallback = deterministicFeedback(data);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { feedback: fallback, source: "fallback" };
    const fb = await aiFeedback(data, fallback);
    return { feedback: fb, source: fb === fallback ? "fallback" : "ai" };
  });
