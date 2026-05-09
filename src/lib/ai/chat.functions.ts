import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachSupabaseAuth } from "@/integrations/supabase/client-auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

const ActionSchema = z.object({
  type: z.enum([
    "create_task",
    "add_disliked_food",
    "add_liked_food",
    "open_link",
    "refresh_insights",
  ]),
  title: z.string(),
  description: z.string().optional().default(""),
  // create_task
  category: z
    .enum(["workout", "nutrition", "hydration", "steps", "sleep", "habit"])
    .optional(),
  target_date: z.enum(["today", "tomorrow"]).optional().default("tomorrow"),
  target_value: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  points: z.number().optional(),
  priority: z.number().optional(),
  // add_*_food
  food: z.string().optional(),
  // open_link
  link: z
    .enum(["/ai-meal", "/ai-workout", "/weekly-planner", "/progress", "/coach"])
    .optional(),
  requires_confirmation: z.boolean().optional().default(true),
});
export type CoachAction = z.infer<typeof ActionSchema>;

const ResponseSchema = z.object({
  reply: z.string(),
  intent: z.string().optional().default("general_question"),
  suggested_actions: z.array(ActionSchema).optional().default([]),
  safety_note: z.string().nullable().optional().default(null),
});
export type CoachResponse = z.infer<typeof ResponseSchema>;

const ChatMsgSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const ContextSchema = z.object({
  profile: z.record(z.string(), z.unknown()).nullable().optional(),
  todayTasks: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  todayLog: z.record(z.string(), z.unknown()).nullable().optional(),
  latestEvaluation: z.record(z.string(), z.unknown()).nullable().optional(),
  adaptiveInsights: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  weeklyPlanSummary: z.string().nullable().optional(),
  recentSummary: z.string().nullable().optional(),
});

const InputSchema = z.object({
  userMessage: z.string().min(1).max(2000),
  context: ContextSchema,
  recentMessages: z.array(ChatMsgSchema).max(12).optional().default([]),
});
type Input = z.infer<typeof InputSchema>;

function deterministicReply(input: Input): CoachResponse {
  const msg = input.userMessage.toLowerCase();
  const profile =
    (input.context.profile as { name?: string; diet_preference?: string } | null) || {};
  const name = profile?.name || "there";

  if (/missed.*workout|skip.*workout|no workout/.test(msg)) {
    return {
      reply: `That's okay, ${name}. Let's make tomorrow easier — even a short session counts. Want me to add a 30-minute beginner workout for tomorrow?`,
      intent: "missed_workout",
      suggested_actions: [
        {
          type: "create_task",
          title: "Easier 30-min workout",
          description: "Lower volume, machine-based or bodyweight focus.",
          category: "workout",
          target_date: "tomorrow",
          target_value: 1,
          unit: "session",
          points: 20,
          priority: 1,
          requires_confirmation: true,
        },
      ],
      safety_note: null,
    };
  }

  const dontLike = msg.match(/(?:don'?t like|hate|avoid|allergic to)\s+([a-z\s]+)/i);
  if (dontLike) {
    const food = dontLike[1].trim().split(/[.,!?]/)[0].trim().slice(0, 40);
    return {
      reply: `Got it — I'll keep ${food} out of future meal suggestions.`,
      intent: "food_dislike",
      suggested_actions: [
        {
          type: "add_disliked_food",
          title: `Add "${food}" to disliked foods`,
          description: "We'll avoid this in meal suggestions.",
          food,
          requires_confirmation: true,
        },
      ],
      safety_note: null,
    };
  }

  if (/protein\s+snack|high\s*protein/.test(msg)) {
    const diet = profile.diet_preference || "non_vegetarian";
    const pick =
      diet === "vegan"
        ? "Roasted chana + peanut butter toast"
        : diet === "vegetarian"
          ? "Greek yogurt bowl with seeds"
          : diet === "eggetarian"
            ? "3 boiled eggs"
            : "3 boiled eggs or grilled chicken";
    return {
      reply: `Try this: ${pick}. Quick, simple, and high-protein. Want me to add it as a task tomorrow?`,
      intent: "high_protein_snack",
      suggested_actions: [
        {
          type: "create_task",
          title: `High-protein snack: ${pick}`,
          description: "Quick high-protein snack.",
          category: "nutrition",
          target_date: "tomorrow",
          target_value: 1,
          unit: "snack",
          points: 10,
          priority: 2,
          requires_confirmation: true,
        },
      ],
      safety_note: null,
    };
  }

  if (/how.*(did|do).*today|how.*i.*doing|today.*performance|score/.test(msg)) {
    const tasks = input.context.todayTasks as Array<{ is_completed?: boolean; title?: string }>;
    const total = tasks.length;
    const done = tasks.filter((t) => t.is_completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      reply: `You've completed ${done} of ${total} tasks today (${pct}%). ${pct >= 70 ? "Strong day — keep the streak going." : "Pick one quick win to finish strong."}`,
      intent: "today_performance",
      suggested_actions: [],
      safety_note: null,
    };
  }

  if (/easier|too hard|overwhelm|simplif/.test(msg)) {
    return {
      reply: "Let's keep it simple. I can add an easier workout for tomorrow to help you stay consistent.",
      intent: "make_plan_easier",
      suggested_actions: [
        {
          type: "create_task",
          title: "Easier 20-min movement",
          description: "Walk, stretch, or light bodyweight session.",
          category: "workout",
          target_date: "tomorrow",
          target_value: 1,
          unit: "session",
          points: 15,
          priority: 1,
          requires_confirmation: true,
        },
      ],
      safety_note: null,
    };
  }

  return {
    reply:
      "I'm here to help with your workouts, meals, and daily habits. Try asking how you did today, or tell me if something's not working for you.",
    intent: "general_question",
    suggested_actions: [],
    safety_note: null,
  };
}

async function callGateway(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "raw-fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.error("coach chat gateway error", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("coach chat gateway failed", e);
    return null;
  }
}

const SYSTEM_PROMPT = `You are GymSathi, a friendly, honest, motivating personal fitness and nutrition coach for an Indian audience. You support beginners.

OUTPUT: Return ONLY valid JSON matching:
{
  "reply": string,                       // friendly message under 90 words
  "intent": string,                      // one of: general_question, today_performance, missed_workout, make_plan_easier, increase_difficulty, food_dislike, food_preference, high_protein_snack, change_workout, change_meal, create_task, update_profile, explain_progress
  "suggested_actions": Action[],         // 0-2 items
  "safety_note": string | null
}

Action shape:
{
  "type": "create_task" | "add_disliked_food" | "add_liked_food" | "open_link" | "refresh_insights",
  "title": string,
  "description": string,
  "category"?: "workout" | "nutrition" | "hydration" | "steps" | "sleep" | "habit",
  "target_date"?: "today" | "tomorrow",
  "target_value"?: number | null,
  "unit"?: string | null,
  "points"?: number,
  "priority"?: number,
  "food"?: string,                       // for add_*_food
  "link"?: "/ai-meal" | "/ai-workout" | "/weekly-planner" | "/progress" | "/coach",
  "requires_confirmation": true
}

RULES:
- Use the user's profile, today's tasks, today's progress, latest evaluation, adaptive insights, and weekly summary in the user message to ground your reply.
- Respect diet_preference, allergies, disliked_foods. Suggest Indian-friendly foods.
- Never give medical advice. Never shame the user. Never recommend extreme diets or aggressive difficulty jumps.
- Never delete user data. Never overwrite a full plan. All actions require_confirmation: true.
- Prefer phrases like "Suggestion", "Would you like me to add this?", "Start small", "Let's make it easier to stay consistent".
- Keep suggested_actions tight (0-2). Only suggest actions that match the user's request.`;

function summarize(input: Input): string {
  const ctx = input.context;
  const tasks = (ctx.todayTasks as Array<{ title?: string; is_completed?: boolean }>) || [];
  const done = tasks.filter((t) => t.is_completed).length;
  const insights = (ctx.adaptiveInsights as Array<{ title?: string; status?: string }>) || [];
  const activeInsights = insights
    .filter((i) => i.status === "active")
    .map((i) => i.title)
    .slice(0, 4);
  return [
    `Profile: ${JSON.stringify(ctx.profile ?? {}).slice(0, 600)}`,
    `Today tasks (${done}/${tasks.length} done): ${tasks
      .map((t) => `${t.is_completed ? "✓" : "·"} ${t.title}`)
      .join("; ")
      .slice(0, 600)}`,
    `Today log: ${JSON.stringify(ctx.todayLog ?? {}).slice(0, 300)}`,
    `Latest evaluation: ${JSON.stringify(ctx.latestEvaluation ?? {}).slice(0, 400)}`,
    `Active insights: ${activeInsights.join(" | ") || "none"}`,
    `Weekly plan: ${ctx.weeklyPlanSummary || "none"}`,
    `Recent 7d summary: ${ctx.recentSummary || "n/a"}`,
  ].join("\n");
}

export const generateCoachChatResponse = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ response: CoachResponse; source: "ai" | "fallback" }> => {
    const fallback = deterministicReply(data);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { response: fallback, source: "fallback" };

    const recent = (data.recentMessages || [])
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const userPrompt = `CONTEXT:\n${summarize(data)}\n\nRECENT MESSAGES:\n${recent || "(none)"}\n\nUSER:\n${data.userMessage}`;
    const raw = await callGateway(SYSTEM_PROMPT, userPrompt);
    if (!raw) return { response: fallback, source: "fallback" };
    try {
      const parsed = ResponseSchema.parse(JSON.parse(raw));
      // enforce confirmation flag
      parsed.suggested_actions = (parsed.suggested_actions || []).map((a) => ({
        ...a,
        requires_confirmation: true,
      }));
      return { response: parsed, source: "ai" };
    } catch (e) {
      console.error("coach chat parse failed", e);
      return { response: fallback, source: "fallback" };
    }
  });
