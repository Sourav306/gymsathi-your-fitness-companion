# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies (use npm, not bun — package-lock.json is the lockfile)
npm run dev        # start the Vite/TanStack Start dev server (http://localhost:5173)
npm run build      # production build (Cloudflare Workers target)
npm run build:dev  # development-mode build
npm run preview    # preview the production build locally
npm run lint       # ESLint
npm run format     # Prettier (auto-fix)
```

There is no test suite.

## Environment Variables

Copy `.env.example` to `.env.local` (or create `.env.local` manually):

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

For server-side / Cloudflare Worker execution the app also reads `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `LOVABLE_API_KEY` (AI gateway; optional — AI features fall back to deterministic logic when absent).

## Architecture Overview

### Runtime & Deployment

GymSathi is a **TanStack Start** (SSR) app deployed as a **Cloudflare Worker**. The Cloudflare entry point is `src/server.ts`, which wraps TanStack Start's bundled server entry and handles catastrophic SSR errors with a branded HTML response. Wrangler config is in `wrangler.jsonc`.

`vite.config.ts` delegates to `@lovable.dev/vite-tanstack-config`, which pre-configures all Vite plugins (TanStack Start, React, Tailwind, tsconfig paths, Cloudflare). **Do not add those plugins manually** — the comment at the top of `vite.config.ts` lists exactly which plugins are already included.

### Routing

Routes live in `src/routes/` using **TanStack Router file-based routing**. The route tree is auto-generated into `src/routeTree.gen.ts` — never edit that file by hand. Each route file exports `const Route = createFileRoute(...)`.

The router is created in `src/router.tsx` with a shared `QueryClient` instance passed as router context. The root route (`src/routes/__root.tsx`) sets up the HTML shell, `<QueryClientProvider>`, `<AppLayout>`, and the global `<Toaster>`.

### Navigation Layout

`src/components/AppLayout.tsx` renders:
- **Desktop**: sticky top navigation bar with text links + a floating "AI Coach" pill button
- **Mobile**: a floating glass-pill bottom nav with 5 tabs (Home | Workout | AI Coach FAB | Nutrition | Profile)

Route groupings used for active-state detection:
- Workout: `/exercises`, `/plans`, `/weekly-planner`, `/ai-workout`
- Nutrition: `/recipes`, `/meal-plans`, `/calculator`, `/ai-meal`
- Profile: `/profile`, `/favorites`, `/onboarding`, `/progress`

### Supabase Integration

Two clients exist:
- `src/integrations/supabase/client.ts` — lazy singleton for the **browser** (uses `localStorage`, `import.meta.env` variables). Import as `import { supabase } from "@/integrations/supabase/client"`.
- `src/integrations/supabase/auth-middleware.ts` — **server-side only**, creates a per-request Supabase client from the Bearer token in the `Authorization` header.

`src/integrations/supabase/types.ts` is auto-generated from the Supabase schema — do not edit it manually.

`src/integrations/lovable/index.ts` is also auto-generated; it wraps OAuth sign-in through the Lovable Cloud Auth SDK.

### Auth & Profile State

`src/hooks/use-auth.ts` maintains a **module-level singleton** (one `onAuthStateChange` subscription shared across all `useAuth()` callers). Do not add additional Supabase auth subscriptions.

`src/hooks/use-profile.ts` caches `user_profiles` rows in a module-level `Map` keyed by user ID, with an in-flight deduplication map. All callers share the same fetch per user. The `save()` function upserts on `user_id` conflict.

The database has two user-related tables:
- `profiles` — basic display name, auto-created on sign-up
- `user_profiles` — full fitness profile (goals, diet, schedule, reminders, etc.), written by the onboarding flows

### AI Features & Server Functions

All AI-backed functionality uses **TanStack Start server functions** (`createServerFn` from `@tanstack/react-start`). Server functions that require authentication chain two middleware:

```ts
createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
```

`attachSupabaseAuth` runs on the **client** and injects the Bearer token into the request headers. `requireSupabaseAuth` runs on the **server** and validates the token, passing `{ supabase, userId, claims }` into handler context.

AI calls route through the Lovable AI gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) using `google/gemini-3-flash-preview`. **All AI functions have deterministic fallbacks** that execute when `LOVABLE_API_KEY` is absent or the gateway call fails. The fallback logic lives in the same file as the server function.

AI-related files:
- `src/lib/ai/schemas.ts` — central Zod schemas: `UserProfileSchema`, `MealPlanSchema`, `WorkoutPlanSchema`, `DailyRecommendationSchema`, etc.
- `src/lib/ai/coach.functions.ts` — generates AI meal/workout plans
- `src/lib/ai/chat.functions.ts` — AI coach chat with structured `CoachResponse` (reply + intent + suggested_actions)
- `src/lib/ai/evaluate.functions.ts` — daily evaluation + AI feedback message
- `src/lib/ai/targets.ts` — deterministic calorie/protein target calculations
- `src/lib/coach/adaptive.ts` — pure deterministic rules that produce `InsightDraft[]` from task/progress history (no AI involved)

### Static Data

`src/data/` contains static TypeScript arrays for exercises, workout plans, meal plans, and recipes. These are the source of truth for the exercise library and recipe browser. Helper functions in `src/lib/match/` and `src/lib/recipes/` filter and rank this static data against user profiles and pantry items.

`src/lib/workouts/classify.ts` — enriches raw exercise objects with derived fields (`equipment_category`, `workout_location`, `home_friendly`, etc.) when video metadata is missing.

### Styling Conventions

- Tailwind CSS v4 (configured via `@import "tailwindcss"` in `src/styles.css`)
- Design tokens defined as CSS custom properties in `:root` — dark glassmorphism theme, warm orange primary, OKLCH color space
- `font-display` = Space Grotesk, `font-sans` = Inter
- Utility: `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge)
- `@/` path alias resolves to `src/`

### Code Style

Prettier: 100-char print width, double quotes, semicolons, trailing commas. ESLint enforces React Hooks rules and bans `server-only` imports (TanStack Start uses `*.server.ts` naming or `createServerFn` instead). `@typescript-eslint/no-unused-vars` is off.
