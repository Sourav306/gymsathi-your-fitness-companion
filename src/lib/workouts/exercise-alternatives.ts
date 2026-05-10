// Suggests an alternative exercise variant for the opposite environment.
// Keys are exercise IDs from src/data/exercises.ts.

export interface AlternativeSuggestion {
  homeAlternativeId?: string;
  homeAlternativeName?: string;
  gymAlternativeId?: string;
  gymAlternativeName?: string;
}

export const EXERCISE_ALTERNATIVES: Record<string, AlternativeSuggestion> = {
  // Chest — gym → home
  "bench-press": { homeAlternativeId: "push-up", homeAlternativeName: "Push-Up" },
  "machine-chest-press": { homeAlternativeId: "push-up", homeAlternativeName: "Push-Up" },
  "pec-deck": { homeAlternativeId: "incline-db-press", homeAlternativeName: "Incline Dumbbell Press" },
  "cable-fly": { homeAlternativeId: "incline-db-press", homeAlternativeName: "Incline Dumbbell Press" },
  // Chest — home → gym
  "push-up": { gymAlternativeId: "bench-press", gymAlternativeName: "Barbell Bench Press" },
  "incline-db-press": { gymAlternativeId: "machine-chest-press", gymAlternativeName: "Machine Chest Press" },

  // Back — gym → home
  "lat-pulldown": { homeAlternativeId: "assisted-pullup", homeAlternativeName: "Band/Assisted Pull-Up" },
  "seated-row": { homeAlternativeId: "db-row", homeAlternativeName: "One-Arm Dumbbell Row" },
  "straight-arm-pulldown": { homeAlternativeId: "db-row", homeAlternativeName: "One-Arm Dumbbell Row" },
  "face-pull": { homeAlternativeId: "rear-delt-fly", homeAlternativeName: "Rear Delt Fly (DB)" },
  // Back — home → gym
  "db-row": { gymAlternativeId: "seated-row", gymAlternativeName: "Seated Cable Row" },
  "chest-supported-row": { gymAlternativeId: "seated-row", gymAlternativeName: "Seated Cable Row" },
  "assisted-pullup": { gymAlternativeId: "lat-pulldown", gymAlternativeName: "Lat Pulldown" },

  // Legs — gym → home
  "leg-press": { homeAlternativeId: "goblet-squat", homeAlternativeName: "Goblet Squat" },
  "leg-extension": { homeAlternativeId: "lunges", homeAlternativeName: "Walking Lunges / Step-Ups" },
  "leg-curl": { homeAlternativeId: "rdl", homeAlternativeName: "Dumbbell RDL" },
  squat: { homeAlternativeId: "goblet-squat", homeAlternativeName: "Goblet Squat" },
  // Legs — home → gym
  "goblet-squat": { gymAlternativeId: "leg-press", gymAlternativeName: "Leg Press" },
  lunges: { gymAlternativeId: "leg-extension", gymAlternativeName: "Leg Extension" },

  // Shoulders
  ohp: { homeAlternativeId: "shoulder-press-machine", homeAlternativeName: "Dumbbell Shoulder Press" },
  "shoulder-press-machine": { homeAlternativeId: "lateral-raise", homeAlternativeName: "Dumbbell Lateral Raise" },

  // Arms
  "tricep-pushdown": { homeAlternativeId: "overhead-tricep", homeAlternativeName: "DB Overhead Tricep Extension" },
  "cable-curl": { homeAlternativeId: "bicep-curl", homeAlternativeName: "Dumbbell Bicep Curl" },
  "preacher-curl": { homeAlternativeId: "bicep-curl", homeAlternativeName: "Dumbbell Bicep Curl" },
  "bicep-curl": { gymAlternativeId: "cable-curl", gymAlternativeName: "Cable Bicep Curl" },
  "overhead-tricep": { gymAlternativeId: "tricep-pushdown", gymAlternativeName: "Tricep Rope Pushdown" },

  // Core
  "cable-crunch": { homeAlternativeId: "plank", homeAlternativeName: "Plank / Dead Bug" },
  plank: { gymAlternativeId: "cable-crunch", gymAlternativeName: "Cable Crunch" },
};
