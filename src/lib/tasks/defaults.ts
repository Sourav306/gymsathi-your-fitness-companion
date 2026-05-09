import type { UserProfile } from "@/lib/ai/schemas";
import { calcTargets } from "@/lib/ai/targets";

export type TaskCategory = "workout" | "nutrition" | "hydration" | "steps" | "sleep" | "habit";

export interface NewTask {
  title: string;
  description?: string;
  category: TaskCategory;
  target_value: number | null;
  unit: string | null;
  points: number;
  priority: number;
}

export function buildDefaultTasks(profile: UserProfile | null): NewTask[] {
  const targets = profile ? calcTargets(profile) : { calories: 2000, protein: 100 };
  const water = profile?.water_goal_liters ?? 3;
  const steps = profile?.step_goal ?? 8000;
  const sleep = profile?.sleep_goal_hours ?? 7;

  const tasks: NewTask[] = [
    {
      title: "Complete today's workout",
      category: "workout",
      target_value: 1,
      unit: "session",
      points: 25,
      priority: 1,
    },
    {
      title: `Eat ${targets.protein}g protein`,
      category: "nutrition",
      target_value: targets.protein,
      unit: "g",
      points: 20,
      priority: 1,
    },
    {
      title: `Stay near ${targets.calories} kcal`,
      category: "nutrition",
      target_value: targets.calories,
      unit: "kcal",
      points: 10,
      priority: 2,
    },
    {
      title: `Drink ${water}L water`,
      category: "hydration",
      target_value: water,
      unit: "L",
      points: 10,
      priority: 2,
    },
    {
      title: `Walk ${steps.toLocaleString()} steps`,
      category: "steps",
      target_value: steps,
      unit: "steps",
      points: 10,
      priority: 2,
    },
    {
      title: "Log breakfast",
      category: "nutrition",
      target_value: 1,
      unit: "meal",
      points: 5,
      priority: 3,
    },
    {
      title: "Log lunch",
      category: "nutrition",
      target_value: 1,
      unit: "meal",
      points: 5,
      priority: 3,
    },
    {
      title: "Log dinner",
      category: "nutrition",
      target_value: 1,
      unit: "meal",
      points: 5,
      priority: 3,
    },
    {
      title: `Sleep ${sleep}+ hours`,
      category: "sleep",
      target_value: sleep,
      unit: "h",
      points: 5,
      priority: 3,
    },
    {
      title: "Stretch for 5 minutes",
      category: "habit",
      target_value: 5,
      unit: "min",
      points: 5,
      priority: 4,
    },
  ];

  return tasks;
}
