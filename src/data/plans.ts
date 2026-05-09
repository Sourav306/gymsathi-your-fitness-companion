export interface PlanExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  rest: string;
}
export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: PlanExercise[];
}
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

const e = (exerciseId: string, sets = 3, reps = "8-12", rest = "60 sec"): PlanExercise => ({
  exerciseId,
  sets,
  reps,
  rest,
});

export const PLANS: WorkoutPlan[] = [
  {
    id: "beginner-3day",
    name: "Beginner Full-Body 3-Day",
    goal: "Build a base of strength",
    weeks: 6,
    daysPerWeek: 3,
    level: "Beginner",
    description: "Perfect first plan. Three full-body sessions with rest days between.",
    schedule: [
      {
        day: "Day 1",
        focus: "Full Body A",
        exercises: [
          e("goblet-squat", 3, "10-12", "90 sec"),
          e("push-up", 3, "8-12", "60 sec"),
          e("seated-row", 3, "10-12", "60 sec"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 2",
        focus: "Full Body B",
        exercises: [
          e("rdl", 3, "8-10", "90 sec"),
          e("incline-db-press", 3, "10-12", "60 sec"),
          e("lat-pulldown", 3, "10-12", "60 sec"),
          e("russian-twist", 3, "20", "45 sec"),
        ],
      },
      {
        day: "Day 3",
        focus: "Full Body C",
        exercises: [
          e("lunges", 3, "10/leg", "60 sec"),
          e("bench-press", 3, "8-10", "90 sec"),
          e("seated-row", 3, "10-12", "60 sec"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
    ],
  },
  {
    id: "beginner-gym-4day",
    name: "Beginner Gym 4-Day Plan",
    goal: "Strength & technique",
    weeks: 8,
    daysPerWeek: 4,
    level: "Beginner",
    description: "Upper/Lower split for new gym-goers using mostly machines and dumbbells.",
    schedule: [
      {
        day: "Day 1",
        focus: "Upper A",
        exercises: [
          e("machine-chest-press"),
          e("lat-pulldown"),
          e("shoulder-press-machine"),
          e("bicep-curl"),
          e("tricep-pushdown"),
        ],
      },
      {
        day: "Day 2",
        focus: "Lower A",
        exercises: [
          e("leg-press", 3, "10-12", "90 sec"),
          e("leg-curl"),
          e("leg-extension"),
          e("calf-raise", 3, "12-15", "45 sec"),
        ],
      },
      {
        day: "Day 3",
        focus: "Upper B",
        exercises: [
          e("incline-db-press"),
          e("chest-supported-row"),
          e("lateral-raise"),
          e("hammer-curl"),
          e("overhead-tricep"),
        ],
      },
      {
        day: "Day 4",
        focus: "Lower B",
        exercises: [
          e("goblet-squat", 3, "10-12", "90 sec"),
          e("rdl"),
          e("hip-thrust", 3, "10-12", "60 sec"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
    ],
  },
  {
    id: "ppl-4day",
    name: "Push Pull Legs Lite",
    goal: "Build muscle (hypertrophy)",
    weeks: 8,
    daysPerWeek: 4,
    level: "Intermediate",
    description: "Balanced split for those with a few months of training.",
    schedule: [
      {
        day: "Day 1",
        focus: "Push",
        exercises: [
          e("bench-press"),
          e("ohp"),
          e("incline-db-press"),
          e("lateral-raise"),
          e("tricep-pushdown"),
        ],
      },
      {
        day: "Day 2",
        focus: "Pull",
        exercises: [
          e("deadlift", 3, "5", "2 min"),
          e("lat-pulldown"),
          e("seated-row"),
          e("bicep-curl"),
          e("hammer-curl"),
        ],
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: [
          e("squat", 3, "6-10", "2 min"),
          e("rdl"),
          e("lunges"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 4",
        focus: "Upper",
        exercises: [
          e("incline-db-press"),
          e("seated-row"),
          e("lateral-raise"),
          e("bicep-curl"),
          e("tricep-pushdown"),
        ],
      },
    ],
  },
  {
    id: "muscle-5day",
    name: "Muscle Gain 5-Day Plan",
    goal: "Muscle gain (bro split)",
    weeks: 10,
    daysPerWeek: 5,
    level: "Intermediate",
    description: "One muscle group per day for higher volume and focus.",
    schedule: [
      {
        day: "Day 1",
        focus: "Chest",
        exercises: [
          e("bench-press"),
          e("incline-db-press"),
          e("machine-chest-press"),
          e("cable-fly", 3, "12-15", "45 sec"),
          e("pec-deck", 3, "12-15", "45 sec"),
        ],
      },
      {
        day: "Day 2",
        focus: "Back",
        exercises: [
          e("lat-pulldown"),
          e("chest-supported-row"),
          e("seated-row"),
          e("straight-arm-pulldown", 3, "12-15", "45 sec"),
          e("face-pull", 3, "15", "45 sec"),
        ],
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: [
          e("squat", 3, "6-10", "2 min"),
          e("leg-press"),
          e("leg-curl"),
          e("leg-extension"),
          e("calf-raise", 4, "12-15", "45 sec"),
        ],
      },
      {
        day: "Day 4",
        focus: "Shoulders",
        exercises: [
          e("ohp"),
          e("shoulder-press-machine"),
          e("lateral-raise", 4, "12-15", "45 sec"),
          e("rear-delt-fly", 3, "12-15", "45 sec"),
          e("face-pull", 3, "15", "45 sec"),
        ],
      },
      {
        day: "Day 5",
        focus: "Arms",
        exercises: [
          e("preacher-curl"),
          e("hammer-curl"),
          e("cable-curl"),
          e("tricep-pushdown"),
          e("overhead-tricep"),
        ],
      },
    ],
  },
  {
    id: "fatloss-gym-4day",
    name: "Fat Loss Gym 4-Day Plan",
    goal: "Fat loss",
    weeks: 8,
    daysPerWeek: 4,
    level: "Beginner",
    description: "Strength + conditioning circuits to keep heart rate up while preserving muscle.",
    schedule: [
      {
        day: "Day 1",
        focus: "Full Body Strength",
        exercises: [
          e("goblet-squat"),
          e("machine-chest-press"),
          e("seated-row"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 2",
        focus: "Conditioning",
        exercises: [
          e("kb-swing", 4, "15", "45 sec"),
          e("burpee", 4, "10", "45 sec"),
          e("mountain-climbers", 4, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 3",
        focus: "Lower + Core",
        exercises: [
          e("leg-press"),
          e("rdl"),
          e("lunges"),
          e("hanging-leg-raise", 3, "10", "45 sec"),
        ],
      },
      {
        day: "Day 4",
        focus: "Upper + HIIT",
        exercises: [
          e("incline-db-press"),
          e("lat-pulldown"),
          e("lateral-raise"),
          e("burpee", 3, "10", "45 sec"),
        ],
      },
    ],
  },
  {
    id: "fatloss-home",
    name: "Home Fat-Loss 4-Week",
    goal: "Lose fat at home",
    weeks: 4,
    daysPerWeek: 4,
    level: "Beginner",
    description: "No-equipment circuits to burn calories and stay consistent.",
    schedule: [
      {
        day: "Day 1",
        focus: "Conditioning",
        exercises: [
          e("burpee", 4, "10", "45 sec"),
          e("push-up", 3, "8-12", "45 sec"),
          e("russian-twist", 3, "20", "45 sec"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 2",
        focus: "Lower",
        exercises: [e("goblet-squat"), e("lunges"), e("rdl"), e("plank", 3, "30 sec", "45 sec")],
      },
      {
        day: "Day 3",
        focus: "HIIT",
        exercises: [
          e("kb-swing", 4, "15", "45 sec"),
          e("burpee", 3, "10", "45 sec"),
          e("mountain-climbers", 3, "30 sec", "45 sec"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 4",
        focus: "Core + Cardio",
        exercises: [
          e("hanging-leg-raise", 3, "10", "45 sec"),
          e("russian-twist", 3, "20", "45 sec"),
          e("plank", 3, "30 sec", "45 sec"),
          e("burpee", 3, "10", "45 sec"),
        ],
      },
    ],
  },
  {
    id: "busy-3day",
    name: "Busy Schedule 3-Day Plan",
    goal: "Stay fit on a tight schedule",
    weeks: 8,
    daysPerWeek: 3,
    level: "Beginner",
    description: "Three short, high-impact full-body sessions for busy professionals.",
    schedule: [
      {
        day: "Day 1",
        focus: "Push + Core",
        exercises: [
          e("machine-chest-press"),
          e("shoulder-press-machine"),
          e("tricep-pushdown"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 2",
        focus: "Pull + Core",
        exercises: [
          e("lat-pulldown"),
          e("seated-row"),
          e("bicep-curl"),
          e("russian-twist", 3, "20", "45 sec"),
        ],
      },
      {
        day: "Day 3",
        focus: "Legs",
        exercises: [e("leg-press"), e("rdl"), e("leg-curl"), e("calf-raise", 3, "12-15", "45 sec")],
      },
    ],
  },
  {
    id: "skinny-fat-recomp",
    name: "Skinny-Fat Recomp Plan",
    goal: "Build muscle, lose fat",
    weeks: 12,
    daysPerWeek: 4,
    level: "Beginner",
    description:
      "Strength focus with light conditioning. Pair with a slight calorie deficit and high protein.",
    schedule: [
      {
        day: "Day 1",
        focus: "Upper Strength",
        exercises: [
          e("bench-press", 4, "6-8", "2 min"),
          e("chest-supported-row", 4, "8-10", "90 sec"),
          e("ohp", 3, "6-8", "90 sec"),
          e("face-pull", 3, "15", "45 sec"),
        ],
      },
      {
        day: "Day 2",
        focus: "Lower Strength",
        exercises: [
          e("squat", 4, "6-8", "2 min"),
          e("rdl", 3, "8-10", "90 sec"),
          e("leg-press", 3, "10-12", "90 sec"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 3",
        focus: "Upper Hypertrophy",
        exercises: [
          e("incline-db-press"),
          e("lat-pulldown"),
          e("lateral-raise", 3, "12-15", "45 sec"),
          e("bicep-curl"),
          e("tricep-pushdown"),
        ],
      },
      {
        day: "Day 4",
        focus: "Lower + Conditioning",
        exercises: [
          e("hip-thrust"),
          e("leg-curl"),
          e("lunges"),
          e("mountain-climbers", 3, "30 sec", "45 sec"),
        ],
      },
    ],
  },
  {
    id: "home-no-equipment",
    name: "Home No-Equipment Beginner Plan",
    goal: "Get started at home",
    weeks: 6,
    daysPerWeek: 3,
    level: "Beginner",
    description: "Bodyweight only. Build the habit before adding equipment.",
    schedule: [
      {
        day: "Day 1",
        focus: "Full Body A",
        exercises: [
          e("push-up", 3, "8-12", "60 sec"),
          e("goblet-squat", 3, "15", "60 sec"),
          e("plank", 3, "30 sec", "45 sec"),
          e("mountain-climbers", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 2",
        focus: "Full Body B",
        exercises: [
          e("lunges", 3, "10/leg", "60 sec"),
          e("push-up", 3, "8-12", "60 sec"),
          e("russian-twist", 3, "20", "45 sec"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
      {
        day: "Day 3",
        focus: "Cardio + Core",
        exercises: [
          e("burpee", 4, "10", "45 sec"),
          e("mountain-climbers", 4, "30 sec", "45 sec"),
          e("crunch", 3, "15", "45 sec"),
          e("plank", 3, "30 sec", "45 sec"),
        ],
      },
    ],
  },
];
