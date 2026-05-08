import type { MealPlan, WorkoutPlan, Meal } from "@/lib/ai/schemas";

export type WeeklyDay = {
  date: string;          // YYYY-MM-DD
  weekday: string;       // Monday..Sunday
  meals: Meal[];
  workout: WorkoutPlan["days"][number] | null;
};

export type WeeklyPlanData = {
  weekStart: string;     // Monday YYYY-MM-DD
  days: WeeklyDay[];     // length 7, Mon..Sun
  grocery: MealPlan["grocery"];
  storage: string;
  budgetTips: string[];
  mealPlanName?: string;
  workoutPlanName?: string;
};

const WEEKDAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export function fmtISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function startOfWeek(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // JS getDay: 0=Sun..6=Sat. We want Monday=0.
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export function endOfWeek(start: Date): Date {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  return d;
}

export function fmtRange(start: Date): string {
  const end = endOfWeek(start);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, { weekday: "short", ...opts })} – ${end.toLocaleDateString(undefined, { weekday: "short", ...opts })}`;
}

export function todayWeekdayIndex(): number {
  // 0..6 Mon..Sun
  return (new Date().getDay() + 6) % 7;
}

/** Map AI plan days (any length) onto Mon..Sun by index, repeating/padding as needed. */
export function buildWeekFromPlans(
  weekStart: Date,
  meal: MealPlan | null,
  workout: WorkoutPlan | null,
): WeeklyPlanData {
  const days: WeeklyDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const meals = meal && meal.days.length ? meal.days[i % meal.days.length].meals : [];
    const workoutDay = workout && workout.days.length ? workout.days[i % workout.days.length] : null;
    days.push({
      date: fmtISO(d),
      weekday: WEEKDAYS[i],
      meals,
      workout: workoutDay,
    });
  }
  return {
    weekStart: fmtISO(weekStart),
    days,
    grocery: meal?.grocery ?? [],
    storage: meal?.storage ?? "",
    budgetTips: meal?.budgetTips ?? [],
    mealPlanName: meal?.name,
    workoutPlanName: workout?.name,
  };
}

export function isSunday(now = new Date()): boolean {
  return now.getDay() === 0;
}
