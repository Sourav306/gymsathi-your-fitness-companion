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
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (error) setError(error.message);
    if (data) {
      setProfile({
        age: data.age!, gender: (data.gender as any) || "male",
        height_cm: Number(data.height_cm), weight_kg: Number(data.weight_kg),
        goal: (data.goal as any) || "improve_fitness",
        activity_level: (data.activity_level as any) || "moderate",
        gym_access: (data.gym_access as any) || "full_gym",
        experience: (data.experience as any) || "beginner",
        injuries: data.injuries || "",
        diet_preference: (data.diet_preference as any) || "non_vegetarian",
        allergies: data.allergies || "",
        disliked_foods: data.disliked_foods || "",
        cuisine_preference: (data.cuisine_preference as any) || "indian",
        weekly_budget: data.weekly_budget != null ? Number(data.weekly_budget) : null,
        cooking_time_min: data.cooking_time_min ?? null,
        meal_prep_days: data.meal_prep_days ?? null,
        meals_per_day: data.meals_per_day ?? null,
        target_protein: data.target_protein ?? null,
      });
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const save = useCallback(async (p: UserProfile) => {
    if (!user) throw new Error("Not signed in");
    const row = { user_id: user.id, ...p };
    const { error } = await supabase.from("user_profiles").upsert(row, { onConflict: "user_id" });
    if (error) throw error;
    await load();
  }, [user, load]);

  return { profile, loading: authLoading || loading, error, save, reload: load, user };
}
