import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChefHat, Sparkles, Plus, Cookie, Clock, Flame, Beef } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { recipeDiscoveryProvider } from "@/lib/recipes/recipeDiscoveryProvider";
import { localRecipeProvider } from "@/lib/recipes/providers/localRecipeProvider";
import { normalizeIngredient, type PantryMatch } from "@/lib/recipes/match-from-pantry";
import { supabase } from "@/integrations/supabase/client";
import type { GroceryItem } from "@/hooks/use-grocery-list";

type SweetMatch = PantryMatch & { sugarLevel: "low" | "medium" | "high"; bestTime: string };

interface Props {
  userId: string;
  listId: string | null;
  items: GroceryItem[];
  onReload: () => Promise<void> | void;
  onMoveToShopping: (id: string) => Promise<void>;
}

export function PantryAndSuggestions({ userId, listId, items, onReload, onMoveToShopping }: Props) {
  const { profile } = useProfile();
  const pantryItems = useMemo(() => items.filter((i) => i.already_have), [items]);
  const pantryNames = useMemo(() => pantryItems.map((i) => i.name), [pantryItems]);

  const [pantryDraft, setPantryDraft] = useState("");
  const [showMatches, setShowMatches] = useState(false);
  const [showSweets, setShowSweets] = useState(false);

  const matches = useMemo<PantryMatch[]>(() => {
    if (!showMatches) return [];
    return localRecipeProvider.matchFromPantry(pantryNames, profile, { limit: 8, minMatched: 1 });
  }, [showMatches, pantryNames, profile]);

  const sweets = useMemo<SweetMatch[]>(() => {
    if (!showSweets) return [];
    return localRecipeProvider.sweetCravings(pantryNames, profile, 8) as SweetMatch[];
  }, [showSweets, pantryNames, profile]);

  const addPantryItem = async () => {
    const name = pantryDraft.trim();
    if (!name) return;
    if (!listId) return toast.error("Create or open a list first");
    const { error } = await supabase.from("grocery_items").insert({
      list_id: listId,
      user_id: userId,
      category: "Pantry",
      name,
      already_have: true,
      position: items.length,
    });
    if (error) toast.error(error.message);
    else {
      setPantryDraft("");
      await onReload();
    }
  };

  const removePantryItem = async (id: string) => {
    await supabase.from("grocery_items").delete().eq("id", id);
    await onReload();
  };

  const addMissingToList = async (missing: string[]) => {
    if (!listId) return toast.error("Open a list first");
    const existing = new Set(items.map((i) => normalizeIngredient(i.name)));
    const fresh = Array.from(
      new Set(
        missing.map((m) =>
          m.replace(/^[\d./\s]+(g|kg|ml|l|oz|lb|lbs|cup|cups|tbsp|tsp)?\s+/i, "").trim(),
        ),
      ),
    ).filter((m) => m && !existing.has(normalizeIngredient(m)));
    if (!fresh.length) return toast.message("All ingredients are already on your list or pantry");
    const rows = fresh.map((name, i) => ({
      list_id: listId,
      user_id: userId,
      category: "Other",
      name,
      position: items.length + i,
    }));
    const { error } = await supabase.from("grocery_items").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Added ${fresh.length} item${fresh.length === 1 ? "" : "s"}`);
    await onReload();
  };

  // Pre-warm provider (used to validate the architecture path is wired)
  void recipeDiscoveryProvider;

  return (
    <>
      {/* Pantry */}
      <section className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What I have ({pantryItems.length})
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pantryItems.length === 0 && (
            <span className="text-xs text-muted-foreground">
              Add staples you already own to unlock recipe matching.
            </span>
          )}
          {pantryItems.map((p) => (
            <span
              key={p.id}
              className="glass-pill inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
            >
              {p.name}
              <button
                onClick={() => onMoveToShopping(p.id)}
                title="Move to shopping list"
                className="text-primary hover:underline"
              >
                ↩
              </button>
              <button
                onClick={() => removePantryItem(p.id)}
                title="Remove"
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addPantryItem();
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={pantryDraft}
            onChange={(e) => setPantryDraft(e.target.value)}
            placeholder="e.g. Greek yogurt, oats, eggs"
            className="min-h-10 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button className="glass-button glass-press min-h-10 inline-flex items-center gap-1 rounded-xl px-3 text-xs font-semibold">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </form>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => setShowMatches((v) => !v)}
            className="glass-button-primary glass-press inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <ChefHat className="h-4 w-4" /> What can I make?
          </button>
          <button
            onClick={() => setShowSweets((v) => !v)}
            className="glass-button glass-press inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Cookie className="h-4 w-4" /> High-protein sweet cravings
          </button>
        </div>
      </section>

      {/* What can I make */}
      {showMatches && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-bold">Recipes from your pantry</h2>
          </div>
          {matches.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
              {pantryNames.length === 0
                ? "Add a few pantry items above first."
                : "No matches yet — try adding more pantry items."}
            </div>
          ) : (
            <div className="grid gap-3">
              {matches.map((m) => (
                <RecipeCard
                  key={m.recipe.id}
                  m={m}
                  onAddMissing={() => addMissingToList(m.missingIngredients)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sweet cravings */}
      {showSweets && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Cookie className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-bold">High-protein sweet cravings</h2>
          </div>
          {sweets.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
              No sweet options match your diet right now.
            </div>
          ) : (
            <div className="grid gap-3">
              {sweets.map((m) => (
                <RecipeCard
                  key={m.recipe.id}
                  m={m}
                  sugarLevel={m.sugarLevel}
                  bestTime={m.bestTime}
                  onAddMissing={() => addMissingToList(m.missingIngredients)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function RecipeCard({
  m,
  sugarLevel,
  bestTime,
  onAddMissing,
}: {
  m: PantryMatch;
  sugarLevel?: "low" | "medium" | "high";
  bestTime?: string;
  onAddMissing: () => void;
}) {
  const r = m.recipe;
  return (
    <article className="glass-card-strong rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="text-3xl leading-none">{r.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold">{r.name}</h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                {r.cuisine && <span className="capitalize">{r.cuisine.replace(/-/g, " ")}</span>}
                {m.canMakeNow && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
                    Ready to cook
                  </span>
                )}
                {sugarLevel && <span className="capitalize">· sugar: {sugarLevel}</span>}
                {bestTime && <span>· best: {bestTime}</span>}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <Stat icon={Beef} label={`${r.protein}g protein`} />
            <Stat icon={Flame} label={`${r.calories} kcal`} />
            <Stat icon={Clock} label={`${r.time} min`} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{m.reason}</p>
          {m.matchedIngredients.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                You have
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {m.matchedIngredients.slice(0, 6).map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
          {m.missingIngredients.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Missing ({m.missingIngredients.length})
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {m.missingIngredients.slice(0, 6).map((i) => (
                  <span
                    key={i}
                    className="rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {i}
                  </span>
                ))}
                {m.missingIngredients.length > 6 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{m.missingIngredients.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
          {r.tags && r.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {r.tags.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="glass-pill rounded-full px-2 py-0.5 text-[10px] capitalize"
                >
                  {t.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          )}
          {m.missingIngredients.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={onAddMissing}
                className="glass-button-primary glass-press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add missing items
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="glass-pill inline-flex items-center gap-1 rounded-full px-2 py-0.5">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
