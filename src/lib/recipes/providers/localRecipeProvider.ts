import { RECIPES, type Recipe } from "@/data/recipes";
import {
  matchRecipesFromPantry,
  suggestSweetCravings,
  type PantryMatch,
  type MatchOptions,
} from "@/lib/recipes/match-from-pantry";
import type { UserProfile } from "@/lib/ai/schemas";

export const localRecipeProvider = {
  name: "local" as const,
  list(): Recipe[] {
    return RECIPES;
  },
  matchFromPantry(
    pantry: string[],
    profile: UserProfile | null,
    opts?: MatchOptions,
  ): PantryMatch[] {
    return matchRecipesFromPantry(pantry, profile, RECIPES, opts);
  },
  sweetCravings(pantry: string[], profile: UserProfile | null, limit = 8) {
    return suggestSweetCravings(pantry, profile, limit);
  },
};
