import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { UserProfile } from "@/lib/ai/schemas";

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) setError(error.message);
    if (data) {
      setProfile({
        age: data.age!,
        gender: (data.gender as UserProfile["gender"]) || "male",
        height_cm: Number(data.height_cm),
        weight_kg: Number(data.weight_kg),
        goal: (data.goal as UserProfile["goal"]) || "improve_fitness",
        activity_level: (data.activity_level as UserProfile["activity_level"]) || "moderate",
        gym_access: (data.gym_access as UserProfile["gym_access"]) || "full_gym",
        experience: (data.experience as UserProfile["experience"]) || "beginner",
        injuries: data.injuries || "",
        diet_preference:
          (data.diet_preference as UserProfile["diet_preference"]) || "non_vegetarian",
        allergies: data.allergies || "",
        disliked_foods: data.disliked_foods || "",
        cuisine_preference:
          (data.cuisine_preference as UserProfile["cuisine_preference"]) || "indian",
        weekly_budget: data.weekly_budget != null ? Number(data.weekly_budget) : null,
        cooking_time_min: data.cooking_time_min ?? null,
        meal_prep_days: data.meal_prep_days ?? null,
        meals_per_day: data.meals_per_day ?? null,
        target_protein: data.target_protein ?? null,
        name: data.name ?? null,
        workout_days_per_week: data.workout_days_per_week ?? null,
        workout_time_min: data.workout_time_min ?? null,
        liked_foods: data.liked_foods ?? null,
        water_goal_liters: data.water_goal_liters != null ? Number(data.water_goal_liters) : null,
        step_goal: data.step_goal ?? null,
        sleep_goal_hours: data.sleep_goal_hours != null ? Number(data.sleep_goal_hours) : null,
        budget_level: (data.budget_level as UserProfile["budget_level"]) ?? null,
        meal_prep_style: (data.meal_prep_style as UserProfile["meal_prep_style"]) ?? null,
        onboarding_completed: data.onboarding_completed ?? false,
      });
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const save = useCallback(
    async (p: UserProfile) => {
      if (!user) throw new Error("Not signed in");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: any = { user_id: user.id, ...p };
      const { error } = await supabase.from("user_profiles").upsert(row, { onConflict: "user_id" });
      if (error) throw error;
      await load();
    },
    [user, load],
  );

  return { profile, loading: authLoading || loading, error, save, reload: load, user };
}
