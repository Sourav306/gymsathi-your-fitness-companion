import { createServerFn } from "@tanstack/react-start";
import { CoachInputSchema, MealPlanSchema, WorkoutPlanSchema, type MealPlan, type WorkoutPlan, type CoachInput } from "./schemas";
import { mockMealPlan, mockWorkoutPlan } from "./mock";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachSupabaseAuth } from "@/integrations/supabase/client-auth-middleware";

const MODEL = "google/gemini-3-flash-preview";

async function callGateway(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
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
      console.error("AI gateway error", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("AI gateway call failed", e);
    return null;
  }
}

function progressContext(rp: CoachInput["recentProgress"]): string {
  if (!rp || rp.daysLogged === 0) return "No recent progress logs available.";
  const parts = [
    `Days logged in last 7: ${rp.daysLogged}`,
    rp.avgProtein != null ? `Avg protein: ${rp.avgProtein}g` : null,
    rp.avgCalories != null ? `Avg calories: ${rp.avgCalories} kcal` : null,
    rp.workoutCompletionRate != null ? `Workout completion: ${Math.round(rp.workoutCompletionRate * 100)}%` : null,
    rp.mealCompletionRate != null ? `Meal plan adherence: ${Math.round(rp.mealCompletionRate * 100)}%` : null,
    rp.latestWeightKg != null ? `Latest weight: ${rp.latestWeightKg}kg` : null,
    rp.weightTrend !== "unknown" ? `Weight trend: ${rp.weightTrend}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export const generateMealPlan = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => CoachInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ plan: MealPlan; source: "ai" | "mock" }> => {
    const { profile, recentProgress } = data;
    const sys = `You are an expert Indian sports nutritionist for beginners. Output ONLY valid JSON matching this TypeScript shape:
{ "name": string, "summary": string,
  "days": [ { "day": string, "meals": [ { "name": string, "type": "breakfast"|"lunch"|"dinner"|"snack", "calories": number, "protein": number, "ingredients": string[], "prep": string } ], "totalCalories": number, "totalProtein": number } ],
  "grocery": [ { "category": string, "items": string[] } ],
  "storage": string, "budgetTips": string[] }
Rules: 7 days. Respect dietary preference, allergies, disliked foods. Indian-friendly meals. Practical for busy people. Use recent progress as context to nudge gently — never shame the user. Avoid medical claims.`;
    const user = `User profile: ${JSON.stringify(profile)}\nRecent 7-day progress: ${progressContext(recentProgress)}\nBuild a 7-day meal plan tailored to this.`;
    const raw = await callGateway(sys, user);
    if (raw) {
      try {
        const parsed = MealPlanSchema.parse(JSON.parse(raw));
        return { plan: parsed, source: "ai" };
      } catch (e) {
        console.error("Meal plan validation failed", e);
      }
    }
    return { plan: mockMealPlan(profile, recentProgress ?? null), source: "mock" };
  });

export const generateWorkoutPlan = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((input: unknown) => CoachInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ plan: WorkoutPlan; source: "ai" | "mock" }> => {
    const { profile, recentProgress } = data;
    const sys = `You are a certified beginner-friendly personal trainer. Output ONLY valid JSON matching:
{ "name": string, "summary": string, "days": [ { "day": string, "focus": string, "durationMin": number, "exercises": [ { "name": string, "muscle": string, "sets": number, "reps": string, "rest": string, "formTip": string, "commonMistake": string, "difficulty": string } ] } ] }
Rules: respect gym access (full_gym/home/no_equipment), experience, injuries. Include 3-5 days. Beginner-safe form tips. Use recent progress as context — if completion rate is low, simplify; if high, slightly progress. Never shame. Avoid medical claims.`;
    const user = `User profile: ${JSON.stringify(profile)}\nRecent 7-day progress: ${progressContext(recentProgress)}\nBuild a workout plan tailored to this.`;
    const raw = await callGateway(sys, user);
    if (raw) {
      try {
        const parsed = WorkoutPlanSchema.parse(JSON.parse(raw));
        return { plan: parsed, source: "ai" };
      } catch (e) {
        console.error("Workout plan validation failed", e);
      }
    }
    return { plan: mockWorkoutPlan(profile, recentProgress ?? null), source: "mock" };
  });
