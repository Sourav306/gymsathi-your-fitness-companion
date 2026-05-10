import { localRecipeProvider } from "./providers/localRecipeProvider";
import { externalRecipeProvider } from "./providers/externalRecipeProvider";
import type { PantryMatch, MatchOptions } from "@/lib/recipes/match-from-pantry";
import type { UserProfile } from "@/lib/ai/schemas";

/** Unified discovery: local first, external second (placeholder for now). */
export const recipeDiscoveryProvider = {
  async matchFromPantry(
    pantry: string[],
    profile: UserProfile | null,
    opts?: MatchOptions,
  ): Promise<PantryMatch[]> {
    const local = localRecipeProvider.matchFromPantry(pantry, profile, opts);
    if (!externalRecipeProvider.available()) return local;
    const ext = await externalRecipeProvider.matchFromPantry(pantry, profile);
    return [...local, ...ext];
  },
  async sweetCravings(pantry: string[], profile: UserProfile | null, limit = 8) {
    const local = localRecipeProvider.sweetCravings(pantry, profile, limit);
    if (!externalRecipeProvider.available()) return local;
    const ext = await externalRecipeProvider.sweetCravings(pantry, profile);
    return [...local, ...ext].slice(0, limit);
  },
};
