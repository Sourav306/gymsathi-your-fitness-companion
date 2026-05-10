import { RECIPES, type Recipe } from "@/data/recipes";
import type { UserProfile, Meal } from "@/lib/ai/schemas";

const STOP = new Set([
  "with",
  "and",
  "the",
  "of",
  "a",
  "an",
  "on",
  "in",
  "for",
  "bowl",
  "plate",
  "style",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function ingredientTokens(items: string[] = []): Set<string> {
  const out = new Set<string>();
  for (const it of items) for (const t of tokens(it)) out.add(t);
  return out;
}

export function matchRecipe(meal: Pick<Meal, "name" | "ingredients" | "type">): Recipe | null {
  const name = (meal.name || "").trim().toLowerCase();
  if (!name) return null;

  // 1) exact name (loose)
  const exact = RECIPES.find((r) => r.name.toLowerCase() === name);
  if (exact) return exact;

  // 2) substring/token overlap on name
  const mealNameToks = new Set(tokens(meal.name));
  let best: { r: Recipe; score: number } | null = null;
  for (const r of RECIPES) {
    const rToks = tokens(r.name);
    let score = 0;
    if (r.name.toLowerCase().includes(name) || name.includes(r.name.toLowerCase())) score += 4;
    for (const t of rToks) if (mealNameToks.has(t)) score += 2;
    if (!best || score > best.score) best = { r, score };
  }
  if (best && best.score >= 4) return best.r;

  // 3) ingredient overlap
  const mealIng = ingredientTokens(meal.ingredients);
  if (mealIng.size > 0) {
    let bIng: { r: Recipe; score: number } | null = null;
    for (const r of RECIPES) {
      const rIng = ingredientTokens(r.ingredients);
      let s = 0;
      for (const t of rIng) if (mealIng.has(t)) s += 1;
      if (!bIng || s > bIng.score) bIng = { r, score: s };
    }
    if (bIng && bIng.score >= 2) return bIng.r;
  }

  // 4) name token weak match fallback
  if (best && best.score >= 2) return best.r;
  return null;
}

function dietAllows(profile: UserProfile, r: Recipe): boolean {
  const diet = profile.diet_preference;
  if (diet === "vegetarian") return r.type === "Veg";
  if (diet === "vegan") {
    if (r.diet_type === "vegan") return true;
    if (r.type !== "Veg") return false;
    const txt = r.ingredients.join(" ").toLowerCase();
    if (/(milk|paneer|curd|yogurt|ghee|butter|cheese|egg|whey|honey|cottage|feta)/.test(txt))
      return false;
    return true;
  }
  if (diet === "eggetarian") return r.type !== "Non-Veg";
  return true; // non_vegetarian
}

const CUISINE_MAP: Record<string, string[]> = {
  indian: ["indian", "punjabi"],
  punjabi: ["punjabi", "indian"],
  canadian_simple: ["canadian-grocery", "western-gym"],
  mixed: [],
};

function cuisineBias(profile: UserProfile, r: Recipe): number {
  const pref = profile.cuisine_preference;
  if (!pref || pref === "mixed") return 0;
  const allowed = CUISINE_MAP[pref] ?? [];
  if (allowed.length === 0) return 0;
  return r.cuisine && allowed.includes(r.cuisine) ? -60 : 40;
}

function avoidsAllergens(profile: UserProfile, r: Recipe): boolean {
  const blockers = [profile.allergies, profile.disliked_foods]
    .filter(Boolean)
    .join(",")
    .toLowerCase();
  if (!blockers.trim()) return true;
  const ing = r.ingredients.join(" ").toLowerCase() + " " + r.name.toLowerCase();
  const terms = blockers
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((t) => t.length > 2);
  return !terms.some((t) => ing.includes(t));
}

export function suggestRecipeAlternatives(
  meal: Pick<Meal, "name" | "calories" | "protein" | "type" | "ingredients">,
  profile: UserProfile,
  excludeId?: string,
  count = 3,
): Recipe[] {
  const pool = RECIPES.filter(
    (r) => r.id !== excludeId && dietAllows(profile, r) && avoidsAllergens(profile, r),
  );
  const cal = meal.calories || 400;
  const pro = meal.protein || 25;
  const isSnack = meal.type === "snack";
  const ranked = pool
    .map((r) => {
      const calD = Math.abs(r.calories - cal);
      const proD = Math.abs(r.protein - pro) * 8;
      const snackBias = isSnack ? Math.max(0, r.calories - 350) : 0;
      return { r, score: calD + proD + snackBias + cuisineBias(profile, r) };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((x) => x.r);
  return ranked;
}
