import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { UserProfile } from "@/lib/ai/schemas";

// Module-level cache so multiple useProfile() consumers share one fetch per user.
type ProfileState = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
};
const cache = new Map<string, ProfileState>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<(s: ProfileState) => void>>();

function emit(userId: string, next: ProfileState) {
  cache.set(userId, next);
  listeners.get(userId)?.forEach((l) => l(next));
}

function mapRow(data: Record<string, unknown> | null): UserProfile | null {
  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  return {
    age: d.age!,
    gender: (d.gender as UserProfile["gender"]) || "male",
    height_cm: Number(d.height_cm),
    weight_kg: Number(d.weight_kg),
    goal: (d.goal as UserProfile["goal"]) || "improve_fitness",
    activity_level: (d.activity_level as UserProfile["activity_level"]) || "moderate",
    gym_access: (d.gym_access as UserProfile["gym_access"]) || "full_gym",
    experience: (d.experience as UserProfile["experience"]) || "beginner",
    injuries: d.injuries || "",
    diet_preference: (d.diet_preference as UserProfile["diet_preference"]) || "non_vegetarian",
    allergies: d.allergies || "",
    disliked_foods: d.disliked_foods || "",
    cuisine_preference: (d.cuisine_preference as UserProfile["cuisine_preference"]) || "indian",
    weekly_budget: d.weekly_budget != null ? Number(d.weekly_budget) : null,
    cooking_time_min: d.cooking_time_min ?? null,
    meal_prep_days: d.meal_prep_days ?? null,
    meals_per_day: d.meals_per_day ?? null,
    target_protein: d.target_protein ?? null,
    name: d.name ?? null,
    workout_days_per_week: d.workout_days_per_week ?? null,
    workout_time_min: d.workout_time_min ?? null,
    liked_foods: d.liked_foods ?? null,
    water_goal_liters: d.water_goal_liters != null ? Number(d.water_goal_liters) : null,
    step_goal: d.step_goal ?? null,
    sleep_goal_hours: d.sleep_goal_hours != null ? Number(d.sleep_goal_hours) : null,
    budget_level: (d.budget_level as UserProfile["budget_level"]) ?? null,
    meal_prep_style: (d.meal_prep_style as UserProfile["meal_prep_style"]) ?? null,
    onboarding_completed: d.onboarding_completed ?? false,
    dob: d.dob ?? null,
    phone: d.phone ?? null,
    dairy_ok: d.dairy_ok ?? null,
    eggs_ok: d.eggs_ok ?? null,
    spice_level: (d.spice_level as UserProfile["spice_level"]) ?? null,
    sweet_cravings_pref: (d.sweet_cravings_pref as UserProfile["sweet_cravings_pref"]) ?? null,
    preferred_cuisines: d.preferred_cuisines ?? null,
    meal_prep_windows: d.meal_prep_windows ?? null,
    work_days: d.work_days ?? null,
    work_time_start: d.work_time_start ?? null,
    work_time_end: d.work_time_end ?? null,
    commute_min: d.commute_min ?? null,
    free_time: d.free_time ?? null,
    workout_time_pref: (d.workout_time_pref as UserProfile["workout_time_pref"]) ?? null,
    reminders_enabled: d.reminders_enabled ?? null,
    reminder_start: d.reminder_start ?? null,
    reminder_end: d.reminder_end ?? null,
    reminder_interval_min: d.reminder_interval_min ?? null,
    morning_exercise: d.morning_exercise ?? null,
    afternoon_exercise: d.afternoon_exercise ?? null,
    home_exercise_min: d.home_exercise_min ?? null,
    equipment: d.equipment ?? null,
  };
}

async function fetchProfile(userId: string) {
  let p = inflight.get(userId);
  if (p) return p;
  p = (async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    emit(userId, {
      profile: mapRow(data as Record<string, unknown> | null),
      loading: false,
      error: error?.message ?? null,
    });
  })();
  inflight.set(userId, p);
  try {
    await p;
  } finally {
    inflight.delete(userId);
  }
}

const EMPTY: ProfileState = { profile: null, loading: true, error: null };

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [snap, setSnap] = useState<ProfileState>(() =>
    userId ? (cache.get(userId) ?? EMPTY) : { ...EMPTY, loading: false },
  );

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setSnap({ profile: null, loading: false, error: null });
      return;
    }
    let subs = listeners.get(userId);
    if (!subs) {
      subs = new Set();
      listeners.set(userId, subs);
    }
    const cb = (s: ProfileState) => setSnap(s);
    subs.add(cb);

    const cached = cache.get(userId);
    if (cached) {
      setSnap(cached);
    } else {
      setSnap(EMPTY);
      void fetchProfile(userId);
    }

    return () => {
      subs!.delete(cb);
    };
  }, [userId, authLoading]);

  const reload = useCallback(async () => {
    if (!userId) return;
    await fetchProfile(userId);
  }, [userId]);

  const save = useCallback(
    async (p: UserProfile) => {
      if (!user) throw new Error("Not signed in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any = { user_id: user.id, ...p };
      const { error } = await supabase.from("user_profiles").upsert(row, { onConflict: "user_id" });
      if (error) throw error;
      await fetchProfile(user.id);
    },
    [user],
  );

  return {
    profile: snap.profile,
    loading: authLoading || snap.loading,
    error: snap.error,
    save,
    reload,
    user,
  };
}
