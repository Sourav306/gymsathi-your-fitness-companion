// Placeholder for future external recipe APIs (Spoonacular, Edamam, YouTube).
// Intentionally returns empty results so the UI gracefully falls back to local.
//
// Future env vars (do not require any key today):
//   VITE_SPOONACULAR_API_KEY=
//   VITE_EDAMAM_APP_ID=
//   VITE_EDAMAM_APP_KEY=
//   VITE_YOUTUBE_API_KEY=

import type { PantryMatch } from "@/lib/recipes/match-from-pantry";
import type { UserProfile } from "@/lib/ai/schemas";

export const externalRecipeProvider = {
  name: "external" as const,
  available(): boolean {
    return false;
  },
  async matchFromPantry(
    _pantry: string[],
    _profile: UserProfile | null,
  ): Promise<PantryMatch[]> {
    return [];
  },
  async sweetCravings(
    _pantry: string[],
    _profile: UserProfile | null,
  ): Promise<PantryMatch[]> {
    return [];
  },
};
