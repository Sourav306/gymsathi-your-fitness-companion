import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles,
  ChefHat,
  ShoppingBasket,
  Trash2,
  BookOpen,
  ExternalLink,
  RefreshCw,
  ClipboardCopy,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { generateMealPlan } from "@/lib/ai/coach.functions";
import type { MealPlan, Meal } from "@/lib/ai/schemas";
import { ErrorState, LoadingState } from "@/components/States";
import { supabase } from "@/integrations/supabase/client";
import { fetchRecentProgress } from "@/lib/ai/progress-summary";
import { useSavedMealPlans } from "@/hooks/use-saved-plans";
import { matchRecipe, suggestRecipeAlternatives } from "@/lib/match/recipes";
import { SwapDrawer, type SwapOption } from "@/components/SwapDrawer";
import { copyText, flattenGrocery, flattenPrep } from "@/lib/grocery";
import { RECIPES } from "@/data/recipes";

export const Route = createFileRoute("/ai-meal/")({
  head: () => ({ meta: [{ title: "AI Meal Planner — GymSathi" }] }),
  component: Page,
});

function recomputeDayTotals(meals: Meal[]) {
  const totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);
  return { totalCalories, totalProtein };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Page() {
  const { profile, loading, user } = useProfile();
  const gen = useServerFn(generateMealPlan);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [source, setSource] = useState<"ai" | "mock" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [swap, setSwap] = useState<{ dayIdx: number; mealIdx: number } | null>(null);
  const saved = useSavedMealPlans(user?.id);

  // Must be before early returns — hooks cannot be called conditionally
  const swapMeta = useMemo(() => {
    if (!plan || !swap || !profile) return { title: "", options: [] as SwapOption[] };
    const m = plan.days[swap.dayIdx].meals[swap.mealIdx];
    const matched = matchRecipe(m);
    const alts = suggestRecipeAlternatives(m, profile, matched?.id);
    return {
      title: `Swap "${m.name}"`,
      options: alts.map((r) => ({
        id: r.id,
        title: `${r.emoji} ${r.name}`,
        subtitle: `${r.calories} kcal · ${r.protein}g protein · ${r.time} min`,
        meta: r.tags.slice(0, 3).join(" · "),
      })),
    };
  }, [plan, swap, profile]);

  if (loading) return <LoadingState rows={3} />;
  if (!user)
    return <Redirect msg="Sign in to use the AI meal planner." to="/profile" cta="Sign in" />;
  if (!profile)
    return <Redirect msg="Set up your profile first." to="/onboarding" cta="Start onboarding" />;

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const recentProgress = await fetchRecentProgress(user.id);
      const res = await gen({ data: { profile, recentProgress } });
      setPlan(res.plan);
      setSource(res.source);
      setDirty(false);
      setCompleted(new Set());
      toast.success(res.source === "ai" ? "AI meal plan ready!" : "Generated using demo data");
      setSaving(true);
      const { error: saveErr } = await supabase.from("ai_meal_plans").insert({
        user_id: user.id,
        name: res.plan.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plan: res.plan as any,
      });
      setSaving(false);
      if (saveErr) toast.error("Couldn't save plan — it's still visible below.");
      else {
        toast.success("Plan saved");
        saved.refresh();
      }
    } catch (e) {
      setErr((e as Error)?.message || "Failed to generate plan");
    } finally {
      setBusy(false);
    }
  };

  const openSaved = (p: MealPlan) => {
    setPlan(p);
    setSource("ai");
    setErr(null);
    setDirty(false);
    setCompleted(new Set());
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id: string) => {
    const ok = await saved.remove(id);
    if (ok) toast.success("Deleted");
    else toast.error("Could not delete");
  };

  const swapMeal = (recipeId: string) => {
    if (!plan || !swap) return;
    const r = RECIPES.find((x) => x.id === recipeId);
    if (!r) return;
    const { dayIdx, mealIdx } = swap;
    const old = plan.days[dayIdx].meals[mealIdx];
    const newMeal: Meal = {
      name: r.name,
      type: old.type,
      calories: r.calories,
      protein: r.protein,
      ingredients: r.ingredients,
      prep: r.steps.join(" "),
    };
    const newMeals = [...plan.days[dayIdx].meals];
    newMeals[mealIdx] = newMeal;
    const totals = recomputeDayTotals(newMeals);
    const newDays = [...plan.days];
    newDays[dayIdx] = { ...newDays[dayIdx], meals: newMeals, ...totals };
    setPlan({ ...plan, days: newDays });
    setSwap(null);
    setDirty(true);
    toast.success("Meal swapped");
  };

  const saveChanges = async () => {
    if (!plan) return;
    setSaving(true);
    const { error } = await supabase.from("ai_meal_plans").insert({
      user_id: user.id,
      name: `${plan.name} (edited)`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plan: plan as any,
    });
    setSaving(false);
    if (error) toast.error("Could not save");
    else {
      toast.success("Saved");
      setDirty(false);
      saved.refresh();
    }
  };

  const onCopyGrocery = async () => {
    if (!plan) return;
    const ok = await copyText(flattenGrocery(plan));
    if (ok) {
      toast.success("Grocery list copied");
    } else {
      toast.error("Couldn't copy");
    }
  };
  const onCopyPrep = async () => {
    if (!plan) return;
    const ok = await copyText(flattenPrep(plan));
    if (ok) {
      toast.success("Prep instructions copied");
    } else {
      toast.error("Couldn't copy");
    }
  };

  const markMealDone = async (dayIdx: number, mealIdx: number) => {
    if (!plan) return;
    const key = `${dayIdx}:${mealIdx}`;
    const next = new Set(completed);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setCompleted(next);
    // If this is "today" (first day) and >= half completed, mark progress
    const todayMeals = plan.days[0]?.meals.length ?? 0;
    if (dayIdx === 0 && todayMeals > 0) {
      const doneToday = Array.from(next).filter((k) => k.startsWith("0:")).length;
      if (doneToday >= Math.ceil(todayMeals / 2)) {
        await supabase
          .from("progress_logs")
          .upsert(
            { user_id: user.id, log_date: todayISO(), meal_plan_completed: true },
            { onConflict: "user_id,log_date" },
          );
      }
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" /> AI Meal Prep
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold">Your 7-day meal plan</h1>
        <p className="text-sm text-muted-foreground">
          Personalized for your diet, goal and budget.
        </p>
      </header>

      {!plan && (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
          <ChefHat className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Tap below to build your week's meal plan, grocery list and prep instructions.
          </p>
          <button
            onClick={run}
            disabled={busy}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Generating…" : "Generate my meal plan"}
          </button>
        </div>
      )}

      {err && <ErrorState message={err} onRetry={run} />}

      {plan && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-display text-xl font-bold">{plan.name}</div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">
                {source === "ai" ? "Generated by AI" : "Demo plan"}
              </span>
              {saving && <span className="rounded-full bg-secondary px-2 py-1">Saving…</span>}
              {dirty && <span className="rounded-full bg-secondary px-2 py-1">Unsaved swaps</span>}
              <button
                onClick={run}
                disabled={busy}
                className="rounded-full border border-border px-2 py-1 hover:bg-secondary"
              >
                {busy ? "…" : "Regenerate"}
              </button>
              {dirty && (
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-primary-foreground disabled:opacity-50"
                >
                  <Save className="h-3 w-3" /> Save as new plan
                </button>
              )}
            </div>
            {dirty && (
              <p className="mt-2 text-xs text-muted-foreground">
                Saving creates a new entry in your saved plans — the original is kept.
              </p>
            )}
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold">Daily meals</h2>
            {plan.days.map((d, i) => (
              <details
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card"
                open={i === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold">
                  <span>{d.day}</span>
                  <span className="text-xs text-muted-foreground">
                    {d.totalCalories} kcal · {d.totalProtein}g protein
                  </span>
                </summary>
                <div className="space-y-2 border-t border-border px-4 py-3">
                  {d.meals.map((m, j) => {
                    const matched = matchRecipe(m);
                    const key = `${i}:${j}`;
                    const isDone = completed.has(key);
                    return (
                      <div
                        key={j}
                        className={`rounded-xl p-3 ${isDone ? "bg-primary/10" : "bg-secondary/50"}`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold capitalize">{m.type}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.calories} kcal · {m.protein}g
                          </span>
                        </div>
                        <div className="mt-1 text-sm">{m.name}</div>
                        {m.prep && (
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {m.prep}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {matched && (
                            <Link
                              to="/recipes"
                              search={{ open: matched.id }}
                              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 hover:bg-accent/40"
                            >
                              <ExternalLink className="h-3 w-3" /> View Recipe
                            </Link>
                          )}
                          <button
                            onClick={() => setSwap({ dayIdx: i, mealIdx: j })}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 hover:bg-accent/40"
                          >
                            <RefreshCw className="h-3 w-3" /> Swap
                          </button>
                          <button
                            onClick={() => markMealDone(i, j)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${isDone ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent/40"}`}
                          >
                            <CheckCircle2 className="h-3 w-3" />{" "}
                            {isDone ? "Completed" : "Mark completed"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <ShoppingBasket className="h-5 w-5" /> Grocery list
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={onCopyGrocery}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent/40"
                >
                  <ClipboardCopy className="h-3 w-3" /> Copy Grocery List
                </button>
                <button
                  onClick={onCopyPrep}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent/40"
                >
                  <ClipboardCopy className="h-3 w-3" /> Copy Prep
                </button>
                <Link
                  to="/grocery-list"
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <ShoppingBasket className="h-3 w-3" /> Save to Grocery List
                </Link>
                <Link
                  to="/meal-prep-calendar"
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent/40"
                >
                  <ClipboardCopy className="h-3 w-3" /> Open Prep Calendar
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.grocery.map((g, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-sm font-semibold">{g.category}</div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {g.items.map((it, k) => (
                      <li key={k}>• {it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold">Prep & storage</h2>
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              {plan.storage}
            </div>
            {plan.budgetTips.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="text-sm font-semibold">Budget tips</div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {plan.budgetTips.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <BookOpen className="h-5 w-5" /> Saved meal plans
        </h2>
        {saved.loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : saved.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No saved plans yet. Generate one above to save it here.
          </div>
        ) : (
          <ul className="space-y-2">
            {saved.items.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3"
              >
                <button onClick={() => openSaved(s.plan)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-semibold">{s.name || "Meal plan"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  aria-label="Delete"
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        General nutrition guidance only. Not medical advice.
      </p>

      <SwapDrawer
        open={!!swap}
        onOpenChange={(v) => !v && setSwap(null)}
        title={swapMeta.title}
        description="Pick an alternative from your recipe library."
        options={swapMeta.options}
        onPick={swapMeal}
      />
    </div>
  );
}

function Redirect({ msg, to, cta }: { msg: string; to: "/profile" | "/onboarding"; cta: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
      <Link
        to={to}
        className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        {cta}
      </Link>
    </div>
  );
}
