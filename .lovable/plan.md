## Phase 3 — Make AI Meal/Workout Plans Interactive

Scope is additive only. No UI redesign, no new routes (one new shared modal component), no schema changes, no RLS changes, no new external APIs. All existing Phase 1/2/2.5 behavior preserved.

### Findings from inspection

- `src/data/recipes.ts` exposes `RECIPES` with `id, name, type, protein, calories, time, ingredients[], tags[]`. There is **no** `/recipes/$id` route — recipes expand inline on `/recipes` via `openId` state. So "View Recipe" must deep-link `/recipes?open=<id>` and the recipes page will read it.
- `src/data/exercises.ts` exposes `EXERCISES` with `id, name, muscle, difficulty, equipment`. A detail route already exists at `/exercises/$id`. "View Exercise" can link directly.
- AI schemas (`src/lib/ai/schemas.ts`) already capture meal `name/type/ingredients/calories/protein` and exercise `name/muscle/sets/reps/rest/difficulty`. No schema change needed.
- `progress_logs` already has `workout_completed` and `meal_plan_completed` booleans plus `log_date` — perfect for completion actions, no migration needed.
- AI plan pages are client-driven; saved plans only re-save on regenerate. We will keep that contract: swaps mutate local state; an explicit "Save changes" button writes a new row.

### New files

1. `src/lib/match/recipes.ts`
   - `matchRecipe(meal: { name; ingredients?; type? }): Recipe | null`
     - 1. exact name (case/punct-insensitive)
     - 2. substring/token overlap on name
     - 3. ingredient overlap score (≥2 shared tokens)
     - 4. tag/diet alignment as tiebreaker
   - `suggestAlternatives(meal, profile, count=3): Recipe[]`
     - Filter by diet (`vegetarian` → Veg only; `vegan` → Veg AND no dairy/egg ingredients heuristic; `eggetarian` → Veg/Egg; `non_vegetarian` → all)
     - Exclude allergens / disliked tokens from `profile.allergies`/`disliked_foods`
     - Rank by closeness of `calories` and `protein` to original meal, then by meal-type heuristic (snack → low cal/short prep, dinner → higher cal)
     - Exclude the currently matched recipe id

2. `src/lib/match/exercises.ts`
   - `matchExercise(ex: { name; muscle?; }): Exercise | null`
     - 1. exact name → 2) substring/token → 3) muscle group + difficulty fallback
   - `suggestExerciseAlternatives(ex, profile, count=3): Exercise[]`
     - Same muscle group preferred
     - Filter equipment by `gym_access` (`no_equipment` → Bodyweight only; `home` → Bodyweight/Dumbbells/Bands; `full_gym` → all)
     - Filter difficulty by `experience` (beginner ≤ Intermediate; advanced any)
     - Soft-exclude exercises whose name/muscle hits an injury keyword from `profile.injuries`
     - Exclude currently matched id

3. `src/lib/grocery.ts`
   - `flattenGrocery(plan): string` and `flattenPrep(plan): string` — produce clipboard-ready text.

4. `src/components/SwapDrawer.tsx`
   - Generic bottom-sheet/dialog using existing shadcn `Drawer` (or `Dialog`) showing 3 alternative cards with calories/protein (meals) or muscle/equipment (exercises), each with a "Use this" button.

### Edits

5. `src/routes/recipes/index.tsx`
   - Read `?open=<id>` via `Route.useSearch()` on mount; if present, set `openId` and scroll to the card. Add `validateSearch` for `{ open?: string }`.

6. `src/routes/ai-meal/index.tsx`
   - For each meal: compute `matchRecipe(meal)`; if matched, render a `View Recipe` `<Link to="/recipes" search={{ open: r.id }}>`.
   - Add `Swap` button → opens `SwapDrawer` with `suggestAlternatives(meal, profile)`.
   - On select: replace meal in local `plan.days[i].meals[j]` with a converted shape (name/type kept; calories/protein/ingredients/prep from recipe); recompute that day's `totalCalories` / `totalProtein`. Toast "Meal swapped".
   - Add **Copy Grocery List** and **Copy Meal Prep Instructions** buttons using `navigator.clipboard.writeText`. Toast on success/error.
   - Add **Save changes** button (only enabled when local plan differs from last saved snapshot) — inserts a new `ai_meal_plans` row. Existing autosave on first generation unchanged.
   - Add **Mark meal completed** per meal (local Set in state). When ≥ half of today's meals completed, upsert `progress_logs` row for today with `meal_plan_completed=true` (uses existing `useProfile().user.id`).

7. `src/routes/ai-workout/index.tsx`
   - For each exercise: `matchExercise(ex)`; if matched, render `View Exercise` `<Link to="/exercises/$id" params={{ id: m.id }}>`.
   - Add `Swap` button → `SwapDrawer` with `suggestExerciseAlternatives`. On select, replace exercise in local plan, keep original sets/reps/rest unless replacement library entry has its own (it doesn't — keep originals). Toast "Exercise swapped".
   - Add **Save changes** (same pattern as meal page).
   - Add **Mark workout completed** per day → upsert `progress_logs` for today with `workout_completed=true`.

8. Saved plan detail view — minimal: keep current "click saved plan → loads into top view" pattern (already shows day-by-day, grocery list, View Recipe/Exercise from edits 6/7). Add a small badge "Read-only until you swap or save" so users know swaps create a new saved version.

### Safety

- All Supabase calls scoped by `user.id`; existing RLS handles auth (no change).
- `progress_logs` upsert uses `onConflict: "user_id,log_date"` if a unique constraint exists; otherwise check-then-insert/update. (Will verify the existing constraint via the linter/SQL during implementation; if absent, fall back to select-then-insert/update — no migration in this phase.)
- Mock AI fallback untouched; matcher returns `null` gracefully when no match — UI just hides the "View Recipe/Exercise" button.
- Disclaimers on both pages preserved.

### Testing

- `npm run build` + TS check, route check, mobile width 375px.
- Manual: generate → match badges visible → swap meal/exercise → totals update → copy grocery → save changes → reload page → saved version present → mark workout/meal completed → `/progress` shows updated boolean for today.
- Logged-out: `/ai-meal` and `/ai-workout` still redirect to `/profile`.

### Files changed (summary)

- New: `src/lib/match/recipes.ts`, `src/lib/match/exercises.ts`, `src/lib/grocery.ts`, `src/components/SwapDrawer.tsx`
- Edited: `src/routes/ai-meal/index.tsx`, `src/routes/ai-workout/index.tsx`, `src/routes/recipes/index.tsx`

### Out of scope (Phase 4 candidates)

- Real recipe/exercise detail routes for recipes
- Streaks, weekly adherence scoring
- External nutrition/recipe APIs
- Push notifications, reminders
- Editing macros/sets inline beyond swap
