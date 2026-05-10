import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GroceryItemDraft } from "@/lib/grocery-generate";

export type GroceryList = {
  id: string;
  user_id: string;
  name: string;
  week_start: string | null;
  source: string;
  source_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type GroceryItem = {
  id: string;
  list_id: string;
  user_id: string;
  category: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  position: number;
};

export function useGroceryLists(userId: string | undefined) {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("grocery_lists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setLists((data as GroceryList[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { lists, loading, reload };
}

export function useGroceryList(listId: string | undefined) {
  const [list, setList] = useState<GroceryList | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!listId) {
      setList(null);
      setItems([]);
      return;
    }
    setLoading(true);
    const [{ data: l }, { data: it }] = await Promise.all([
      supabase.from("grocery_lists").select("*").eq("id", listId).maybeSingle(),
      supabase
        .from("grocery_items")
        .select("*")
        .eq("list_id", listId)
        .order("category")
        .order("position"),
    ]);
    setList((l as GroceryList) || null);
    setItems((it as GroceryItem[]) || []);
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(
    async (id: string, checked: boolean) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_checked: checked } : i)));
      await supabase.from("grocery_items").update({ is_checked: checked }).eq("id", id);
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("grocery_items").delete().eq("id", id);
  }, []);

  return { list, items, loading, reload, toggle, remove };
}

export async function createGroceryListWithItems(opts: {
  userId: string;
  name: string;
  weekStart?: string | null;
  source: "weekly_plan" | "ai_meal_plan" | "manual";
  sourceId?: string | null;
  items: GroceryItemDraft[];
}): Promise<string> {
  const { data: list, error } = await supabase
    .from("grocery_lists")
    .insert({
      user_id: opts.userId,
      name: opts.name,
      week_start: opts.weekStart ?? null,
      source: opts.source,
      source_id: opts.sourceId ?? null,
    })
    .select("id")
    .single();
  if (error || !list) throw error || new Error("Failed to create list");
  if (opts.items.length) {
    const rows = opts.items.map((it) => ({
      list_id: list.id,
      user_id: opts.userId,
      category: it.category,
      name: it.name,
      quantity: it.quantity ?? null,
      unit: it.unit ?? null,
      position: it.position,
    }));
    const { error: e2 } = await supabase.from("grocery_items").insert(rows);
    if (e2) throw e2;
  }
  return list.id;
}
