import type { Exercise } from "@/data/exercises";

export type WorkoutLocation = "home" | "gym" | "both";
export type EquipmentCategory =
  | "bodyweight"
  | "dumbbells"
  | "resistance_bands"
  | "yoga_mat"
  | "barbell"
  | "machine"
  | "cable"
  | "kettlebell"
  | "bench"
  | "pull_up_bar"
  | "other";

export interface ExerciseMeta {
  workout_location: WorkoutLocation;
  equipment_category: EquipmentCategory;
  equipment_required: string[];
  home_friendly: boolean;
  gym_friendly: boolean;
  morning_friendly: boolean;
  afternoon_friendly: boolean;
  beginner_safe: boolean;
  video_source_name?: string;
  video_url?: string;
}

export type EnrichedExercise = Exercise & ExerciseMeta;

const MORNING_HINT_RE =
  /(plank|crunch|stretch|mobility|push-up|squat|lunge|raise|curl|climb|bird|dog|cat|cobra)/i;

function classifyEquipment(eq: string): EquipmentCategory {
  const e = eq.toLowerCase();
  if (e.includes("cable")) return "cable";
  if (e.includes("kettlebell")) return "kettlebell";
  if (e.includes("band")) return "resistance_bands";
  if (e.includes("pull-up") || e.includes("pullup") || e.includes("pull up bar"))
    return "pull_up_bar";
  if (e.includes("machine") || e.includes("hyperextension") || e.includes("preacher"))
    return "machine";
  if (e.includes("barbell")) return "barbell";
  if (e.includes("dumbbell") || e.includes("db")) return "dumbbells";
  if (e.includes("bench")) return "bench";
  if (e.includes("bodyweight")) return "bodyweight";
  return "other";
}

function classifyLocation(eq: string, cat: EquipmentCategory): WorkoutLocation {
  const e = eq.toLowerCase();
  // explicit gym-only
  if (cat === "machine" || cat === "cable") return "gym";
  if (cat === "barbell") {
    // barbell + rack/bench is gym; plain barbell is gym too
    return e.includes("/ db") || e.includes("/ dbs") ? "both" : "gym";
  }
  if (cat === "bodyweight") return "both"; // works home or gym
  if (cat === "resistance_bands" || cat === "yoga_mat") return "home";
  if (cat === "dumbbells" || cat === "kettlebell" || cat === "bench") return "both";
  if (cat === "pull_up_bar") return "both";
  // mixed labels like "Bodyweight / Plate" or "Dumbbell / Cable"
  if (e.includes("cable") && e.includes("dumbbell")) return "both";
  return "both";
}

function parseEquipmentList(eq: string): string[] {
  return eq
    .split(/[/+,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function enrichExercise(ex: Exercise): EnrichedExercise {
  const cat = classifyEquipment(ex.equipment);
  const loc = classifyLocation(ex.equipment, cat);
  const beginner = ex.difficulty === "Beginner";
  const morning =
    cat === "bodyweight" ||
    cat === "yoga_mat" ||
    cat === "resistance_bands" ||
    MORNING_HINT_RE.test(ex.name);
  return {
    ...ex,
    workout_location: loc,
    equipment_category: cat,
    equipment_required: parseEquipmentList(ex.equipment),
    home_friendly: loc === "home" || loc === "both",
    gym_friendly: loc === "gym" || loc === "both",
    morning_friendly: morning && beginner,
    afternoon_friendly: cat === "bodyweight" || cat === "yoga_mat" || cat === "resistance_bands",
    beginner_safe: beginner,
    video_source_name: "YouTube",
    video_url: `https://www.youtube.com/watch?v=${ex.youtubeId}`,
  };
}

export const EQUIPMENT_LABEL: Record<EquipmentCategory, string> = {
  bodyweight: "Bodyweight",
  dumbbells: "Dumbbells",
  resistance_bands: "Resistance Bands",
  yoga_mat: "Yoga Mat / Mobility",
  barbell: "Barbell",
  machine: "Machines",
  cable: "Cables",
  kettlebell: "Kettlebell",
  bench: "Bench",
  pull_up_bar: "Pull-Up Bar",
  other: "Other",
};
