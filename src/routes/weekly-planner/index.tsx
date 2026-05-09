import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  ChefHat,
  Dumbbell,
  ShoppingBasket,
  ClipboardCopy,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Save,
  AlertCircle,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useSavedMealPlans, useSavedWorkoutPlans } from "@/hooks/use-saved-plans";
import { useProgress } from "@/hooks/use-progress";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import {
  buildWeekFromPlans,
  fmtISO,
  fmtRange,
  isSunday,
  startOfWeek,
  todayWeekdayIndex,
  type WeeklyPlanData,
} from "@/lib/weekly";
import { matchRecipe } from "@/lib/match/recipes";
import { matchExercise } from "@/lib/match/exercises";
import { copyText, flattenGrocery } from "@/lib/grocery";
import { LoadingState } from "@/components/States";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/weekly-planner/")({
  head: () => ({ meta: [{ title: "Weekly Planner — GymSathi" }] }),
  component: Page,
});

function Page() {
  const { profile, loading: profLoading, user } = useProfile();
  const weekStartDate = useMemo(() => startOfWeek(), []);
  const weekStartISO = fmtISO(weekStartDate);
  const meals = useSavedMealPlans(user?.id);
  const workouts = useSavedWorkoutPlans(user?.id);
  const weekly = useWeeklyPlan(user?.id, user ? weekStartISO : undefined);
  const { todayLog, logs, upsert } = useProgress();

  const [data, setData] = useState<WeeklyPlanData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPrep, setShowPrep] = useState(isSunday());

  // Hydrate local state from DB row
  useEffect(() => {
    if (weekly.row?.plan_data) {
      setData(weekly.row.plan_data);
      setDirty(false);
    } else {
      setData(null);
    }
  }, [weekly.row]);

  // Must be before early returns — hooks cannot be called conditionally
  const weekStats = useMemo(() => {
    if (!data)
      return {
        workouts: 0,
        meals: 0,
        avgProtein: null as number | null,
        avgCalories: null as number | null,
      };
    const inWeek = logs.filter(
      (l) => l.log_date >= data.days[0].date && l.log_date <= data.days[6].date,
    );
    const workouts = inWeek.filter((l) => l.workout_completed).length;
    const meals = inWeek.filter((l) => l.meal_plan_completed).length;
    const prots = inWeek
      .map((l) => l.protein_consumed)
      .filter((n): n is number => typeof n === "number");
    const cals = inWeek
      .map((l) => l.calories_consumed)
      .filter((n): n is number => typeof n === "number");
    const avg = (xs: number[]) =>
      xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
    return { workouts, meals, avgProtein: avg(prots), avgCalories: avg(cals) };
  }, [logs, data]);

  if (profLoading) return <LoadingState rows={3} />;
  if (!user) {
    return (
      <CTA
        title="Sign in to use the Weekly Planner"
        body="Plan meals and workouts across a real calendar week."
        to="/profile"
        cta="Sign in"
      />
    );
  }
  if (!profile) {
    return (
      <CTA
        title="Set up your profile first"
        body="Answer a few quick questions and we'll build your week around you."
        to="/onboarding"
        cta="Start onboarding"
      />
    );
  }

  const latestMeal = meals.items[0]?.plan ?? null;
  const latestMealId = meals.items[0]?.id ?? null;
  const latestWorkout = workouts.items[0]?.plan ?? null;
  const latestWorkoutId = workouts.items[0]?.id ?? null;
  const todayIdx = todayWeekdayIndex();

  const buildWeek = async () => {
    if (!latestMeal && !latestWorkout) {
      toast.error("Generate a saved meal or workout plan first.");
      return;
    }
    const built = buildWeekFromPlans(weekStartDate, latestMeal, latestWorkout);
    setData(built);
    setDirty(false);
    setSaving(true);
    try {
      await weekly.save(built, { meal_plan_id: latestMealId, workout_plan_id: latestWorkoutId });
      toast.success("Week saved");
    } catch (e) {
      toast.error((e as Error)?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const saveChanges = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await weekly.save(data, {
        meal_plan_id: weekly.row?.meal_plan_id ?? null,
        workout_plan_id: weekly.row?.workout_plan_id ?? null,
      });
      setDirty(false);
      toast.success("Week updated");
    } catch (e) {
      toast.error((e as Error)?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const markMealDone = async (dayIdx: number, mealIdx: number) => {
    if (!data) return;
    const day = data.days[dayIdx];
    const doneToday = day.meals.length > 0 && mealIdx + 1 >= Math.ceil(day.meals.length / 2);
    // Per-meal completion is only relevant for today; we just mark progress_logs row for that date.
    if (day.date !== fmtISO(new Date())) {
      toast.message("You can only mark today's items.", {
        description: "Open a different day on the day it occurs.",
      });
      return;
    }
    try {
      await upsert({ log_date: day.date, meal_plan_completed: doneToday });
      toast.success(doneToday ? "Meal day marked complete" : "Updated");
    } catch (e) {
      toast.error((e as Error)?.message || "Could not update progress");
    }
  };

  const markWorkoutDone = async (dayIdx: number) => {
    if (!data) return;
    const day = data.days[dayIdx];
    if (day.date !== fmtISO(new Date())) {
      toast.message("You can only mark today's workout from here.");
      return;
    }
    try {
      await upsert({ log_date: day.date, workout_completed: true });
      toast.success("Workout marked complete");
    } catch (e) {
      toast.error((e as Error)?.message || "Could not update progress");
    }
  };

  const missedToday = (dayIdx: number) => {
    if (!data) return;
    const next = { ...data, days: data.days.map((d) => ({ ...d, meals: [...d.meals] })) };
    const day = next.days[dayIdx];
    // Move workout to next day with a "rest" focus or no workout if available
    const workout = day.workout;
    if (workout) {
      const restIdx = next.days.findIndex(
        (d, i) => i > dayIdx && (!d.workout || /rest/i.test(d.workout.focus)),
      );
      if (restIdx >= 0) {
        next.days[restIdx] = { ...next.days[restIdx], workout };
      }
      day.workout = null;
    }
    // Simplify next day's first meal: trim to a quick option (just flag in name)
    const nextDay = next.days[dayIdx + 1];
    if (nextDay && nextDay.meals[0]) {
      nextDay.meals = [...nextDay.meals];
      nextDay.meals[0] = {
        ...nextDay.meals[0],
        prep: `Quick option suggested. ${nextDay.meals[0].prep || ""}`.trim(),
      };
    }
    setData(next);
    setDirty(true);
    toast.message("Adjusted — no worries", {
      description: "Workout shifted, lighter meal suggested. Save week changes to keep it.",
    });
  };

  const onCopyGrocery = async () => {
    if (!data) return;
    const text = flattenGrocery({
      name: `Week of ${weekStartISO}`,
      summary: data.mealPlanName ?? "",
      days: [],
      grocery: data.grocery,
      storage: data.storage,
      budgetTips: data.budgetTips,
    });
    if (await copyText(text)) {
      toast.success("Grocery list copied");
    } else {
      toast.error("Couldn't copy");
    }
  };

  const onCopyPrep = async () => {
    if (!data) return;
    const lines: string[] = [`Sunday Prep — Week of ${weekStartISO}`, ""];
    if (data.storage) lines.push(`Storage: ${data.storage}`, "");
    lines.push("## Cook first (longest shelf life)");
    const proteins = data.days
      .flatMap((d) => d.meals)
      .filter((m) => /chicken|fish|paneer|tofu|egg|soya|beef|mutton/i.test(m.name))
      .slice(0, 4);
    if (proteins.length === 0) lines.push("- Pick the highest-protein items from Mon–Tue");
    for (const m of proteins) lines.push(`- ${m.name}`);
    lines.push(
      "",
      "## Prep for 2–3 days",
      "- Wash & chop vegetables",
      "- Boil eggs/lentils",
      "- Portion grains (rice/quinoa/oats)",
      "",
    );
    if (data.budgetTips.length) {
      lines.push("## Budget tips");
      for (const t of data.budgetTips) lines.push(`- ${t}`);
    }
    if (await copyText(lines.join("\n").trim())) {
      toast.success("Prep plan copied");
    } else {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Calendar className="h-3.5 w-3.5" /> Weekly Planner
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold">This week</h1>
        <p className="text-sm text-muted-foreground">{fmtRange(weekStartDate)}</p>
      </header>

      {!data && (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
          {!latestMeal && !latestWorkout ? (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                You don't have a saved AI plan yet. Generate one to plan your week.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  to="/ai-meal"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Generate Meal Plan
                </Link>
                <Link
                  to="/ai-workout"
                  className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold"
                >
                  Generate Workout Plan
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                Build this week using your latest{latestMeal ? " meal plan" : ""}
                {latestMeal && latestWorkout ? " and" : ""}
                {latestWorkout ? " workout plan" : ""}.
              </p>
              <button
                onClick={buildWeek}
                disabled={saving}
                className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Build My Week"}
              </button>
            </>
          )}
        </div>
      )}

      {data && (
        <>
          {/* Weekly stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Workouts done" value={String(weekStats.workouts)} />
            <Stat label="Meal days done" value={String(weekStats.meals)} />
            <Stat
              label="Avg protein"
              value={weekStats.avgProtein != null ? `${weekStats.avgProtein}g` : "—"}
            />
            <Stat
              label="Avg calories"
              value={weekStats.avgCalories != null ? `${weekStats.avgCalories}` : "—"}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={buildWeek}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 hover:bg-secondary"
            >
              <RefreshCw className="h-3 w-3" /> Rebuild from latest plans
            </button>
            {dirty && (
              <button
                onClick={saveChanges}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-primary-foreground"
              >
                <Save className="h-3 w-3" /> Save Week Changes
              </button>
            )}
            {dirty && (
              <span className="rounded-full bg-secondary px-2 py-1">Unsaved adjustments</span>
            )}
          </div>

          {/* 7-day cards */}
          <section className="space-y-3">
            {data.days.map((d, i) => {
              const isToday = i === todayIdx;
              const dayLog = logs.find((l) => l.log_date === d.date);
              return (
                <div
                  key={d.date}
                  className={`overflow-hidden rounded-2xl border ${isToday ? "border-primary" : "border-border"} bg-card`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                      <div className="font-semibold">
                        {d.weekday}{" "}
                        {isToday && (
                          <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(d.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      {dayLog?.workout_completed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Workout
                        </span>
                      )}
                      {dayLog?.meal_plan_completed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Meals
                        </span>
                      )}
                      <Link
                        to="/progress"
                        className="rounded-full border border-border px-2 py-0.5 hover:bg-secondary"
                      >
                        Log
                      </Link>
                      {isToday && (
                        <button
                          onClick={() => missedToday(i)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 hover:bg-secondary"
                        >
                          <AlertCircle className="h-3 w-3" /> I missed today
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Workout */}
                  <div className="border-b border-border px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Dumbbell className="h-3.5 w-3.5" /> Workout
                      </div>
                      {isToday && d.workout && (
                        <button
                          onClick={() => markWorkoutDone(i)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs hover:bg-secondary"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Mark workout completed
                        </button>
                      )}
                    </div>
                    {d.workout ? (
                      <div className="mt-2">
                        <div className="text-sm font-semibold">
                          {d.workout.focus} · ~{d.workout.durationMin} min
                        </div>
                        <ul className="mt-1 space-y-1 text-sm">
                          {d.workout.exercises.map((ex, j) => {
                            const m = matchExercise(ex);
                            return (
                              <li
                                key={j}
                                className="flex flex-wrap items-baseline justify-between gap-2"
                              >
                                <span>
                                  {ex.name}{" "}
                                  <span className="text-xs text-muted-foreground">
                                    — {ex.sets}×{ex.reps}
                                  </span>
                                </span>
                                {m && (
                                  <Link
                                    to="/exercises/$id"
                                    params={{ id: m.id }}
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" /> View
                                  </Link>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Rest / no workout planned
                      </p>
                    )}
                  </div>

                  {/* Meals */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <ChefHat className="h-3.5 w-3.5" /> Meals
                      </div>
                      {isToday && d.meals.length > 0 && (
                        <button
                          onClick={() => markMealDone(i, d.meals.length - 1)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs hover:bg-secondary"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Mark meal day complete
                        </button>
                      )}
                    </div>
                    {d.meals.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">No meals planned</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm">
                        {d.meals.map((m, j) => {
                          const r = matchRecipe(m);
                          return (
                            <li
                              key={j}
                              className="flex flex-wrap items-baseline justify-between gap-2"
                            >
                              <span>
                                <span className="capitalize text-xs text-muted-foreground">
                                  {m.type}:
                                </span>{" "}
                                {m.name}{" "}
                                <span className="text-xs text-muted-foreground">
                                  · {m.calories} kcal · {m.protein}g
                                </span>
                              </span>
                              {r && (
                                <Link
                                  to="/recipes"
                                  search={{ open: r.id }}
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" /> View
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Sunday Prep Mode */}
          <section
            className={`rounded-2xl border ${isSunday() ? "border-primary bg-primary/5" : "border-border bg-card"} p-5`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-display text-xl font-bold">
                <ShoppingBasket className="h-5 w-5" /> Sunday Prep Mode
              </div>
              <button
                onClick={() => setShowPrep((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showPrep ? "Hide" : "Open"}
              </button>
            </div>
            {showPrep && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onCopyGrocery}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary"
                  >
                    <ClipboardCopy className="h-3 w-3" /> Copy Grocery List
                  </button>
                  <button
                    onClick={onCopyPrep}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary"
                  >
                    <ClipboardCopy className="h-3 w-3" /> Copy Prep Plan
                  </button>
                </div>
                {data.grocery.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.grocery.map((g, i) => (
                      <div key={i} className="rounded-xl border border-border bg-card p-3">
                        <div className="text-sm font-semibold">{g.category}</div>
                        <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                          {g.items.map((it, k) => (
                            <li key={k}>• {it}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {data.storage && (
                  <div className="rounded-xl border border-border bg-card p-3 text-sm">
                    <span className="font-semibold">Storage: </span>
                    {data.storage}
                  </div>
                )}
                <div className="rounded-xl border border-border bg-card p-3 text-sm">
                  <div className="font-semibold">Cook first → prep for 2–3 days</div>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    <li>
                      • Cook proteins (chicken/paneer/eggs/lentils) on Sunday — they hold longest.
                    </li>
                    <li>• Wash & chop vegetables; portion grains.</li>
                    <li>• Refresh leafy salads on Wed for the second half of the week.</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          <p className="text-center text-xs text-muted-foreground">
            General nutrition & fitness guidance only. Not medical advice.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}

function CTA({
  title,
  body,
  to,
  cta,
}: {
  title: string;
  body: string;
  to: "/profile" | "/onboarding";
  cta: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Link
        to={to}
        className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        {cta}
      </Link>
    </div>
  );
}
