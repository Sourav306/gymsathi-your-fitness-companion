import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export type FavKind = "exercise" | "recipe" | "plan";
export interface FavRow {
  id: string;
  kind: FavKind;
  item_id: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("favorites").select("id,kind,item_id");
    if (!error && data) setFavorites(data as FavRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const isFav = (kind: FavKind, itemId: string) =>
    favorites.some((f) => f.kind === kind && f.item_id === itemId);

  const toggle = async (kind: FavKind, itemId: string) => {
    if (!user) {
      toast.error("Sign in to save favorites");
      return;
    }
    const existing = favorites.find((f) => f.kind === kind && f.item_id === itemId);
    if (existing) {
      const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
      if (error) return toast.error(error.message);
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
    } else {
      const { data, error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, kind, item_id: itemId })
        .select("id,kind,item_id")
        .single();
      if (error) return toast.error(error.message);
      if (data) setFavorites((prev) => [...prev, data as FavRow]);
    }
  };

  return { favorites, isFav, toggle, loading, reload: load };
}
