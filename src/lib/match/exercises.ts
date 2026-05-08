import { EXERCISES, type Exercise, type MuscleGroup, type Difficulty } from "@/data/exercises";
import type { UserProfile } from "@/lib/ai/schemas";

const STOP = new Set(["the","a","an","with","and","of","on"]);
function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(t => t.length > 2 && !STOP.has(t));
}

function normMuscle(m?: string): MuscleGroup | null {
  if (!m) return null;
  const x = m.toLowerCase();
  if (x.includes("chest") || x.includes("pec")) return "Chest";
  if (x.includes("back") || x.includes("lat")) return "Back";
  if (x.includes("leg") || x.includes("quad") || x.includes("ham") || x.includes("glute") || x.includes("calf")) return "Legs";
  if (x.includes("shoulder") || x.includes("delt")) return "Shoulders";
  if (x.includes("arm") || x.includes("bicep") || x.includes("tricep")) return "Arms";
  if (x.includes("core") || x.includes("ab")) return "Core";
  if (x.includes("full")) return "Full Body";
  return null;
}

export function matchExercise(ex: { name: string; muscle?: string }): Exercise | null {
  const n = (ex.name || "").trim().toLowerCase();
  if (!n) return null;
  const exact = EXERCISES.find(e => e.name.toLowerCase() === n);
  if (exact) return exact;
  const exToks = new Set(tokens(ex.name));
  let best: { e: Exercise; score: number } | null = null;
  for (const e of EXERCISES) {
    let s = 0;
    if (e.name.toLowerCase().includes(n) || n.includes(e.name.toLowerCase())) s += 4;
    for (const t of tokens(e.name)) if (exToks.has(t)) s += 2;
    if (!best || s > best.score) best = { e, score: s };
  }
  if (best && best.score >= 4) return best.e;
  // muscle fallback (very loose) — skip; we don't want low-confidence matches
  return null;
}

function equipmentAllowed(profile: UserProfile, e: Exercise): boolean {
  const eq = e.equipment.toLowerCase();
  if (profile.gym_access === "no_equipment") return eq.includes("bodyweight");
  if (profile.gym_access === "home") return eq.includes("bodyweight") || eq.includes("dumbbell") || eq.includes("band");
  return true;
}

function difficultyAllowed(profile: UserProfile, e: Exercise): boolean {
  const order: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const cap = profile.experience === "beginner" ? 2 : profile.experience === "intermediate" ? 3 : 3;
  return order[e.difficulty] <= cap;
}

function safeForInjuries(profile: UserProfile, e: Exercise): boolean {
  const inj = (profile.injuries || "").toLowerCase();
  if (!inj.trim()) return true;
  const text = `${e.name} ${e.muscle} ${e.equipment}`.toLowerCase();
  const map: { kw: string; blocks: string[] }[] = [
    { kw: "knee", blocks: ["squat", "lunge", "leg"] },
    { kw: "back", blocks: ["deadlift", "row", "bent"] },
    { kw: "shoulder", blocks: ["overhead", "press", "shoulder"] },
    { kw: "wrist", blocks: ["push-up", "bench"] },
  ];
  for (const m of map) if (inj.includes(m.kw) && m.blocks.some(b => text.includes(b))) return false;
  return true;
}

export function suggestExerciseAlternatives(
  ex: { name: string; muscle?: string },
  profile: UserProfile,
  excludeId?: string,
  count = 3,
): Exercise[] {
  const targetMuscle = normMuscle(ex.muscle);
  const pool = EXERCISES.filter(e =>
    e.id !== excludeId &&
    equipmentAllowed(profile, e) &&
    difficultyAllowed(profile, e) &&
    safeForInjuries(profile, e)
  );
  const ranked = pool
    .map(e => {
      let score = 0;
      if (targetMuscle && e.muscle === targetMuscle) score -= 10;
      if (e.name.toLowerCase() === ex.name.toLowerCase()) score += 100;
      const order: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
      const want = profile.experience === "beginner" ? 1 : profile.experience === "intermediate" ? 2 : 3;
      score += Math.abs(order[e.difficulty] - want);
      return { e, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map(x => x.e);
  return ranked;
}
