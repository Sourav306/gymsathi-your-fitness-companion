// Deterministic adaptive coach rules.
// Pure functions: take a snapshot of recent activity + profile, return insight drafts.
import type { UserProfile } from "@/lib/ai/schemas";
import type { TaskCategory, NewTask } from "@/lib/tasks/defaults";

export type InsightType =
  | "workout_easier"
  | "protein_support"
  | "water_split"
  | "level_up"
  | "meal_simplify"
  | "weekly_plan_missing";

export type InsightStatus = "active" | "applied" | "dismissed";

export interface AdaptiveInsight {
  id: string;
  user_id: string;
  insight_date: string;
  type: InsightType;
  title: string;
  reason: string;
  suggested_action: string;
  priority: number;
  status: InsightStatus;
  metadata: InsightMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface InsightMetadata {
  task?: NewTask;
  link?: "/ai-workout" | "/ai-meal" | "/weekly-planner";
}

export interface InsightDraft {
  type: InsightType;
  title: string;
  reason: string;
  suggested_action: string;
  priority: number;
  metadata: InsightMetadata | null;
}

interface TaskHistoryRow {
  task_date: string;
  category: TaskCategory;
  is_completed: boolean;
  title: string;
}

interface ProgressHistoryRow {
  log_date: string;
  protein_consumed: number | null;
  water_liters: number | null;
  workout_completed: boolean;
}

export interface AdaptiveSnapshot {
  profile: UserProfile | null;
  weekTasks: TaskHistoryRow[]; // last 7 days
  weekLogs: ProgressHistoryRow[]; // last 7 days
  proteinTarget: number;
  waterTargetL: number;
  hasWeeklyPlan: boolean;
}

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

function highProteinSnackForDiet(profile: UserProfile | null): { title: string; snack: string } {
  const diet = profile?.diet_preference ?? "non_vegetarian";
  const dislikes = (profile?.disliked_foods || "").toLowerCase();
  const allergies = (profile?.allergies || "").toLowerCase();
  const banned = (s: string) => dislikes.includes(s) || allergies.includes(s);

  const vegOptions = ["Greek yogurt bowl", "Paneer cubes", "Roasted chana", "Soya chunks", "Tofu"];
  const nonVegOptions = ["Boiled eggs (3)", "Greek yogurt bowl", "Tuna pouch", "Grilled chicken"];
  const veganOptions = ["Soya chunks", "Tofu scramble", "Roasted chana", "Peanut butter toast"];
  const eggOptions = ["Boiled eggs (3)", "Paneer cubes", "Greek yogurt bowl", "Roasted chana"];

  const pool =
    diet === "vegetarian"
      ? vegOptions
      : diet === "vegan"
        ? veganOptions
        : diet === "eggetarian"
          ? eggOptions
          : nonVegOptions;

  const pick = pool.find((o) => !banned(o.toLowerCase().split(" ")[0])) || pool[0];
  return { title: `Add high-protein snack: ${pick}`, snack: pick };
}

export function generateAdaptiveInsights(snap: AdaptiveSnapshot): InsightDraft[] {
  const drafts: InsightDraft[] = [];
  const { profile, weekTasks, weekLogs, proteinTarget, waterTargetL, hasWeeklyPlan } = snap;

  // 1. Missed workouts
  const workoutTasks = weekTasks.filter((t) => t.category === "workout");
  const workoutMissed = workoutTasks.filter((t) => !t.is_completed).length;
  if (workoutMissed >= 2) {
    drafts.push({
      type: "workout_easier",
      title: "Make tomorrow's workout easier",
      reason: `You missed ${workoutMissed} workout tasks this week.`,
      suggested_action: "Switch to a 30-minute beginner machine workout.",
      priority: 1,
      metadata: {
        task: {
          title: "Easier 30-min workout",
          description: "Lower volume, machine-based or bodyweight focus.",
          category: "workout",
          target_value: 1,
          unit: "session",
          points: 20,
          priority: 1,
        },
        link: "/ai-workout",
      },
    });
  }

  // 2. Missed protein 2+ days
  const proteinMissedDays = weekLogs.filter(
    (l) => l.protein_consumed != null && l.protein_consumed < proteinTarget * 0.85,
  ).length;
  if (proteinMissedDays >= 2) {
    const snack = highProteinSnackForDiet(profile);
    drafts.push({
      type: "protein_support",
      title: "Protein target support",
      reason: `You missed your protein target ${proteinMissedDays} days this week.`,
      suggested_action: snack.title,
      priority: 1,
      metadata: {
        task: {
          title: snack.title,
          description: `Quick high-protein snack to help hit ${proteinTarget}g.`,
          category: "nutrition",
          target_value: 1,
          unit: "snack",
          points: 10,
          priority: 2,
        },
      },
    });
  }

  // 3. Water missed 2+ days
  const waterMissedDays = weekLogs.filter(
    (l) => l.water_liters != null && Number(l.water_liters) < waterTargetL * 0.8,
  ).length;
  if (waterMissedDays >= 2) {
    drafts.push({
      type: "water_split",
      title: "Split your water into smaller goals",
      reason: `You missed your water goal ${waterMissedDays} days this week.`,
      suggested_action: "Add 3 water reminders: 500ml morning, afternoon, evening.",
      priority: 2,
      metadata: {
        task: {
          title: "Drink 500ml after each meal",
          category: "hydration",
          target_value: 1.5,
          unit: "L",
          points: 10,
          priority: 2,
        },
      },
    });
  }

  // 4. High completion → level up
  const byDay = new Map<string, { total: number; completed: number }>();
  weekTasks.forEach((t) => {
    const cur = byDay.get(t.task_date) || { total: 0, completed: 0 };
    cur.total += 1;
    if (t.is_completed) cur.completed += 1;
    byDay.set(t.task_date, cur);
  });
  const highDays = Array.from(byDay.values()).filter(
    (d) => d.total > 0 && d.completed / d.total >= 0.85,
  ).length;
  if (highDays >= 3) {
    drafts.push({
      type: "level_up",
      title: "Ready for a small challenge bump",
      reason: `You've completed 85%+ of tasks on ${highDays} days this week.`,
      suggested_action: "Add 1 extra workout set or +500 steps tomorrow.",
      priority: 3,
      metadata: {
        task: {
          title: "Add 500 extra steps",
          category: "steps",
          target_value: 500,
          unit: "steps",
          points: 5,
          priority: 3,
        },
      },
    });
  }

  // 5. Meal logging missed repeatedly
  const mealLogTasks = weekTasks.filter(
    (t) =>
      t.category === "nutrition" &&
      /log\s+(breakfast|lunch|dinner)/i.test(t.title),
  );
  const mealLogMissed = mealLogTasks.filter((t) => !t.is_completed).length;
  if (mealLogMissed >= 4) {
    drafts.push({
      type: "meal_simplify",
      title: "Simplify your meals this week",
      reason: "You skipped logging meals on multiple days.",
      suggested_action: "Try a meal-prep plan with 2–3 simple repeating meals.",
      priority: 3,
      metadata: { link: "/ai-meal" },
    });
  }

  // 6. No weekly plan
  if (!hasWeeklyPlan) {
    drafts.push({
      type: "weekly_plan_missing",
      title: "Create your weekly plan",
      reason: "You don't have a weekly plan yet.",
      suggested_action: "Build a 7-day workout + meal plan to stay consistent.",
      priority: 2,
      metadata: { link: "/weekly-planner" },
    });
  }

  return drafts;
}

export function appliedTaskDate(): string {
  return tomorrowISO();
}
