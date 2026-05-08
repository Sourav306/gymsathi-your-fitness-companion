import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./use-profile";
import { mockDailyRecommendation } from "@/lib/ai/mock";
import { RECIPES } from "@/data/recipes";
import type { DailyRecommendation, UserProfile } from "@/lib/ai/schemas";

const today = () => new Date().toISOString().slice(0, 10);

function pickRecipe(p: UserProfile, seed = 0) {
  const matching = RECIPES.filter((r) => {
    if (p.diet_preference === "vegetarian" || p.diet_preference === "vegan") return r.type === "Veg";
    if (p.diet_preference === "eggetarian") return r.type !== "Non-Veg";
    return true;
  });
  const list = matching.length ? matching : RECIPES;
  return list[(new Date().getDate() + seed) % list.length];
}

export function useDailyRec() {
  const { profile, user, loading: profileLoading } = useProfile();
  const [rec, setRec] = useState<DailyRecommendation | null>(null);
  const [history, setHistory] = useState<{ for_date: string; recommendation: DailyRecommendation }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_recommendations")
      .select("for_date, recommendation")
      .eq("user_id", user.id)
      .order("for_date", { ascending: false })
      .limit(7);
    setHistory((data || []) as any);
  }, [user]);

  const load = useCallback(async () => {
    if (!user || !profile) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("daily_recommendations")
        .select("recommendation")
        .eq("user_id", user.id)
        .eq("for_date", today())
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setRec(data.recommendation as any);
      } else {
        const recipe = pickRecipe(profile);
        const fresh = mockDailyRecommendation(profile, recipe.name, recipe.id);
        const { error: insErr } = await supabase
          .from("daily_recommendations")
          .upsert({ user_id: user.id, for_date: today(), recommendation: fresh as any }, { onConflict: "user_id,for_date" });
        if (insErr) throw insErr;
        setRec(fresh);
      }
      await loadHistory();
    } catch (e: any) {
      setError(e?.message || "Failed to load recommendation");
    } finally { setLoading(false); }
  }, [user, profile, loadHistory]);

  useEffect(() => { if (!profileLoading) load(); }, [profileLoading, load]);

  const refresh = useCallback(async () => {
    if (!user || !profile) return;
    setBusy(true); setError(null);
    try {
      const recipe = pickRecipe(profile, Math.floor(Math.random() * 100));
      const fresh = mockDailyRecommendation(profile, recipe.name, recipe.id);
      const { error } = await supabase
        .from("daily_recommendations")
        .upsert({ user_id: user.id, for_date: today(), recommendation: fresh as any }, { onConflict: "user_id,for_date" });
      if (error) throw error;
      setRec(fresh);
      await loadHistory();
    } catch (e: any) {
      setError(e?.message || "Failed to refresh");
    } finally { setBusy(false); }
  }, [user, profile, loadHistory]);

  return { rec, history, loading: profileLoading || loading, busy, error, refresh, reload: load, profile, user };
}
