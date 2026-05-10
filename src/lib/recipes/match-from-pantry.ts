import { RECIPES, type Recipe } from "@/data/recipes";
import type { UserProfile } from "@/lib/ai/schemas";

const STOP = new Set([
  "with", "and", "the", "of", "a", "an", "on", "in", "for", "to",
  "bowl", "plate", "style", "fresh", "chopped", "sliced", "cup", "cups",
  "tbsp", "tsp", "g", "kg", "ml", "l", "oz", "lb", "lbs", "cooked",
  "raw", "small", "medium", "large", "boiled", "grilled", "lightly",
  "optional", "or", "and/or", "salt", "pepper", "water", "ice",
]);

// Common ingredient aliases / canonical tokens to improve matching
const ALIASES: Record<string, string> = {
  "yoghurt": "yogurt",
  "curd": "yogurt",
  "dahi": "yogurt",
  "scallion": "onion",
  "scallions": "onion",
  "spring": "onion",
  "capsicum": "pepper",
  "bellpepper": "pepper",
  "garbanzo": "chickpea",
  "garbanzos": "chickpea",
  "rajma": "kidneybean",
  "channa": "chickpea",
  "chana": "chickpea",
  "atta": "wheat",
  "roti": "wheat",
  "chapati": "wheat",
  "paneer": "paneer",
  "tofu": "tofu",
  "soya": "soy",
  "soy": "soy",
  "whey": "whey",
  "oats": "oat",
  "rolled": "oat",
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => ALIASES[t] || t)
    .filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t));
}

function ingredientTokenSet(items: string[]): Set<string> {
  const s = new Set<string>();
  for (const it of items) for (const t of tokenize(it)) s.add(t);
  return s;
}

// Hard exclusions for diet preferences
const NON_VEG_TOKENS = ["chicken", "fish", "beef", "turkey", "mutton", "pork", "shrimp", "salmon", "tuna", "bacon", "ham"];
const ANIMAL_TOKENS = [...NON_VEG_TOKENS, "egg", "eggs"];
const DAIRY_TOKENS = ["milk", "yogurt", "cheese", "paneer", "butter", "ghee", "cream", "whey", "cottage", "feta"];

function dietAllows(profile: UserProfile | null, r: Recipe): boolean {
  if (!profile) return true;
  const txt = (r.ingredients.join(" ") + " " + r.name).toLowerCase();
  const has = (toks: string[]) => toks.some((t) => new RegExp(`\\b${t}\\b`).test(txt));
  switch (profile.diet_preference) {
    case "vegetarian":
      return !has(NON_VEG_TOKENS) && !has(["egg", "eggs"]);
    case "vegan":
      if (r.diet_type === "vegan") return true;
      return !has(ANIMAL_TOKENS) && !has(DAIRY_TOKENS) && !has(["honey"]);
    case "eggetarian":
      return !has(NON_VEG_TOKENS);
    default:
      return true;
  }
}

function avoidsAllergiesAndDislikes(profile: UserProfile | null, r: Recipe): boolean {
  if (!profile) return true;
  const blockers = [profile.allergies, profile.disliked_foods]
    .filter(Boolean)
    .join(",")
    .toLowerCase();
  if (!blockers.trim()) return true;
  const txt = (r.ingredients.join(" ") + " " + r.name).toLowerCase();
  const terms = blockers
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((t) => t.length > 2);
  return !terms.some((t) => txt.includes(t));
}

export interface PantryMatch {
  recipe: Recipe;
  matchedIngredients: string[]; // original recipe ingredient strings that matched
  missingIngredients: string[]; // original recipe ingredient strings that did NOT match
  matchScore: number;
  matchRatio: number; // 0..1
  canMakeNow: boolean; // matchRatio >= 0.8
  reason: string;
}

export interface MatchOptions {
  limit?: number;
  minMatched?: number; // require at least N matched ingredients
  onlySweet?: boolean;
  onlyCanMakeNow?: boolean;
}

export function matchRecipesFromPantry(
  pantryNames: string[],
  profile: UserProfile | null,
  recipes: Recipe[] = RECIPES,
  opts: MatchOptions = {},
): PantryMatch[] {
  const limit = opts.limit ?? 12;
  const minMatched = opts.minMatched ?? 1;

  const pantryTokens = new Set<string>();
  for (const name of pantryNames) for (const t of tokenize(name)) pantryTokens.add(t);

  const cookingTime = profile?.cooking_time_min ?? null;
  const cuisinePref = profile?.cuisine_preference;
  const isLowBudget = profile?.budget_level === "low" || profile?.budget_level === "tight";

  const results: PantryMatch[] = [];

  for (const r of recipes) {
    if (!dietAllows(profile, r)) continue;
    if (!avoidsAllergiesAndDislikes(profile, r)) continue;
    if (opts.onlySweet && !r.tags?.includes("sweet")) continue;

    const matched: string[] = [];
    const missing: string[] = [];
    for (const ing of r.ingredients) {
      const ingToks = tokenize(ing);
      const hit = ingToks.some((t) => pantryTokens.has(t));
      if (hit) matched.push(ing);
      else missing.push(ing);
    }

    if (matched.length < minMatched) continue;

    const total = r.ingredients.length || 1;
    const ratio = matched.length / total;
    const canMakeNow = ratio >= 0.8;
    if (opts.onlyCanMakeNow && !canMakeNow) continue;

    // Scoring: more matched = higher; fewer missing = higher
    let score = matched.length * 10 - missing.length * 4;
    score += Math.round(ratio * 20);

    // Boosts
    if (r.tags?.includes("high-protein") || (r.protein ?? 0) >= 25) score += 8;
    if (cookingTime && r.time <= cookingTime) score += 4;
    if (isLowBudget && r.tags?.includes("budget")) score += 4;
    if (cuisinePref && cuisinePref !== "mixed" && r.cuisine) {
      const cmap: Record<string, string[]> = {
        indian: ["indian", "punjabi"],
        punjabi: ["punjabi", "indian"],
        canadian_simple: ["canadian-grocery", "western-gym"],
      };
      if ((cmap[cuisinePref] ?? []).includes(r.cuisine)) score += 6;
    }

    const reason = canMakeNow
      ? `You have ${matched.length}/${total} ingredients — ready to cook.`
      : `${matched.length}/${total} matched · ${missing.length} missing.`;

    results.push({
      recipe: r,
      matchedIngredients: matched,
      missingIngredients: missing,
      matchScore: score,
      matchRatio: ratio,
      canMakeNow,
      reason,
    });
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, limit);
}

/** Sweet cravings (filtered by diet/allergy), with optional pantry context. */
export function suggestSweetCravings(
  pantryNames: string[],
  profile: UserProfile | null,
  limit = 8,
): Array<PantryMatch & { sugarLevel: "low" | "medium" | "high"; bestTime: string }> {
  const matches = matchRecipesFromPantry(pantryNames, profile, RECIPES, {
    onlySweet: true,
    minMatched: 0, // sweets surface even without pantry overlap
    limit: 50,
  });

  // Re-rank: prioritize protein, then pantry overlap
  matches.sort((a, b) => {
    const pa = a.recipe.protein ?? 0;
    const pb = b.recipe.protein ?? 0;
    if (pb !== pa) return pb - pa;
    return b.matchedIngredients.length - a.matchedIngredients.length;
  });

  return matches.slice(0, limit).map((m) => {
    const txt = m.recipe.ingredients.join(" ").toLowerCase() + " " + m.recipe.name.toLowerCase();
    const sweetnessHits = (txt.match(/\b(sugar|honey|maple|jaggery|chocolate|syrup|condensed)\b/g) || []).length;
    const sugarLevel: "low" | "medium" | "high" =
      sweetnessHits >= 2 ? "high" : sweetnessHits === 1 ? "medium" : "low";
    const bestTime = m.recipe.tags?.includes("post-workout")
      ? "post-workout"
      : m.recipe.tags?.includes("no-cook")
        ? "snack"
        : "dessert";
    return { ...m, sugarLevel, bestTime };
  });
}

/** Normalize an ingredient name for dedupe when adding to a grocery list. */
export function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .replace(/^[\d./\s]+(g|kg|ml|l|oz|lb|lbs|cup|cups|tbsp|tsp)?\s+/i, "")
    .replace(/,.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}
