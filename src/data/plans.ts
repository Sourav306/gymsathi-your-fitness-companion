export interface WorkoutDay { day: string; focus: string; exerciseIds: string[]; }
export interface WorkoutPlan {
  id: string;
  name: string;
  goal: string;
  weeks: number;
  daysPerWeek: number;
  level: "Beginner" | "Intermediate";
  description: string;
  schedule: WorkoutDay[];
}

export const PLANS: WorkoutPlan[] = [
  {
    id: "beginner-3day",
    name: "Beginner Full-Body 3-Day",
    goal: "Build a base of strength",
    weeks: 6, daysPerWeek: 3, level: "Beginner",
    description: "Perfect first plan. Three full-body sessions with rest days between. Focuses on the basics.",
    schedule: [
      { day: "Day 1", focus: "Full Body A", exerciseIds: ["goblet-squat","push-up","seated-row","plank"] },
      { day: "Day 2", focus: "Full Body B", exerciseIds: ["rdl","incline-db-press","lat-pulldown","russian-twist"] },
      { day: "Day 3", focus: "Full Body C", exerciseIds: ["lunges","bench-press","seated-row","plank"] },
    ],
  },
  {
    id: "ppl-4day",
    name: "Push Pull Legs Lite",
    goal: "Build muscle (hypertrophy)",
    weeks: 8, daysPerWeek: 4, level: "Intermediate",
    description: "A balanced split for those with 2–3 months of training. Hits each muscle twice a week.",
    schedule: [
      { day: "Day 1", focus: "Push", exerciseIds: ["bench-press","ohp","incline-db-press","lateral-raise","tricep-pushdown"] },
      { day: "Day 2", focus: "Pull", exerciseIds: ["deadlift","lat-pulldown","seated-row","bicep-curl","hammer-curl"] },
      { day: "Day 3", focus: "Legs", exerciseIds: ["squat","rdl","lunges","plank"] },
      { day: "Day 4", focus: "Upper", exerciseIds: ["incline-db-press","seated-row","lateral-raise","bicep-curl","tricep-pushdown"] },
    ],
  },
  {
    id: "fatloss-home",
    name: "Home Fat-Loss 4-Week",
    goal: "Lose fat at home",
    weeks: 4, daysPerWeek: 4, level: "Beginner",
    description: "No-equipment circuits to burn calories and stay consistent. Pair with a calorie deficit.",
    schedule: [
      { day: "Day 1", focus: "Conditioning", exerciseIds: ["burpee","push-up","russian-twist","plank"] },
      { day: "Day 2", focus: "Lower", exerciseIds: ["goblet-squat","lunges","rdl","plank"] },
      { day: "Day 3", focus: "HIIT", exerciseIds: ["kb-swing","burpee","push-up","plank"] },
      { day: "Day 4", focus: "Core + Cardio", exerciseIds: ["hanging-leg-raise","russian-twist","plank","burpee"] },
    ],
  },
];
