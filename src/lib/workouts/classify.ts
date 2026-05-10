import type { EquipmentCategory, Exercise, WorkoutLocation } from "@/data/exercises";

export type ExerciseMeta = Pick<
  Exercise,
  | "workout_location"
  | "equipment_category"
  | "equipment_required"
  | "home_friendly"
  | "gym_friendly"
  | "morning_friendly"
  | "afternoon_friendly"
  | "beginner_safe"
  | "video_source_name"
  | "video_url"
>;

export type EnrichedExercise = Exercise;

const MORNING_HINT_RE =
  /(plank|crunch|stretch|mobility|push-up|squat|lunge|raise|curl|climb|bird|dog|cat|cobra)/i;

function classifyEquipment(eq: string): EquipmentCategory {
  const e = eq.toLowerCase();
  if (e.includes("cable")) return "cable";
  if (e.includes("kettlebell")) return "kettlebell";
  if (e.includes("band")) return "band";
  if (e.includes("machine") || e.includes("hyperextension") || e.includes("preacher")) {
    return "machine";
  }
  if (e.includes("barbell")) return "barbell";
  if (e.includes("dumbbell") || e.includes("db")) return "dumbbell";
  if (e.includes("bench")) return "bench";
  if (e.includes("bodyweight")) return "bodyweight";
  return "mixed";
}

function classifyLocation(eq: string, cat: EquipmentCategory): WorkoutLocation {
  const e = eq.toLowerCase();
  if (cat === "machine" || cat === "cable") return "gym";
  if (cat === "barbell") return e.includes("/ db") || e.includes("/ dbs") ? "both" : "gym";
  if (cat === "bodyweight") return "both";
  if (cat === "band") return "home";
  if (cat === "dumbbell" || cat === "kettlebell" || cat === "bench") return "both";
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
  if (ex.video_url) return ex;

  const cat = classifyEquipment(ex.equipment);
  const loc = classifyLocation(ex.equipment, cat);
  const beginner = ex.difficulty === "Beginner";
  const morning = cat === "bodyweight" || cat === "band" || MORNING_HINT_RE.test(ex.name);
  return {
    ...ex,
    workout_location: loc,
    equipment_category: cat,
    equipment_required: parseEquipmentList(ex.equipment),
    home_friendly: loc === "home" || loc === "both",
    gym_friendly: loc === "gym" || loc === "both",
    morning_friendly: morning && beginner,
    afternoon_friendly: true,
    beginner_safe: beginner,
    video_source_name: "YouTube",
    video_url: `https://www.youtube.com/watch?v=${ex.youtubeId}`,
  };
}

export const EQUIPMENT_LABEL: Record<EquipmentCategory, string> = {
  bodyweight: "Bodyweight",
  dumbbell: "Dumbbell",
  barbell: "Barbell",
  machine: "Machine",
  cable: "Cable",
  band: "Band",
  kettlebell: "Kettlebell",
  bench: "Bench",
  mixed: "Mixed",
};
