import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  RefreshCw,
  Utensils,
  Dumbbell,
  Target,
  ShoppingBasket,
  Lightbulb,
  Activity,
  History,
  Calendar,
} from "lucide-react";
import { useMemo, type ComponentType, type ReactNode } from "react";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { fmtISO, startOfWeek, todayWeekdayIndex } from "@/lib/weekly";
import { useDailyRec } from "@/hooks/use-daily-rec";
import { useProgress } from "@/hooks/use-progress";
import { calcTargets } from "@/lib/ai/targets";
import { LoadingState, ErrorState } from "@/components/States";
import { CoachAdjustments } from "@/components/CoachAdjustments";
import { CoachChat } from "@/components/CoachChat";
import { useAdaptiveCoach } from "@/hooks/use-adaptive-coach";

export const Route = createFileRoute("/coach/")({
  head: () => ({ meta: [{ title: "AI Coach — GymSathi" }] }),
  component: Coach,
});

function Coach() {
  const { rec, history, loading, busy, error, refresh, profile, user } = useDailyRec();
  const { todayLog, logs } = useProgress();
  const weekStartISO = useMemo(() => fmtISO(startOfWeek()), []);
  const adaptive = useAdaptiveCoach();
  const weekly = useWeeklyPlan(user?.id, user ? weekStartISO : undefined);
  const todayIdx = todayWeekdayIndex();
  const weekStats = useMemo(() => {
    const startISO = weekStartISO;
    const endDate = new Date(weekStartISO);
    endDate.setDate(endDate.getDate() + 6);
    const endISO = fmtISO(endDate);
    const inWeek = logs.filter((l) => l.log_date >= startISO && l.log_date <= endISO);
    return {
      workouts: inWeek.filter((l) => l.workout_completed).length,
      meals: inWeek.filter((l) => l.meal_plan_completed).length,
    };
  }, [logs, weekStartISO]);
  const todayPlan = weekly.row?.plan_data?.days?.[todayIdx];

  if (loading) return <LoadingState rows={3} />;
  if (!user)
    return (
      <CTA
        title="Sign in to use AI Coach"
        body="Create your free account to get personalized meal and workout plans."
        to="/profile"
        cta="Sign in"
      />
    );
  if (!profile)
    return (
      <CTA
        title="Let's set up your AI Coach"
        body="Answer a few quick questions and we'll build your personalized plan."
        to="/onboarding"
        cta="Start onboarding"
      />
    );

  const targets = calcTargets(profile);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI Coach
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold">Today's plan</h1>
          <p className="text-sm text-muted-foreground">
            Personalized for your goal: {profile.goal.replace("_", " ")}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />{" "}
          {busy ? "Refreshing…" : "Refresh today"}
        </button>
      </header>

      {error && <ErrorState message={error} onRetry={refresh} />}

      <CoachAdjustments coach={adaptive} />

      <CoachChat />

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          icon={Target}
          label="Calories target"
          value={`${rec?.caloriesTarget ?? targets.calories} kcal`}
        />
        <Stat
          icon={Target}
          label="Protein target"
          value={`${rec?.proteinTarget ?? targets.protein} g`}
        />
      </div>

      {/* Today's Progress */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Today's progress
          </div>
          <Link to="/progress" className="text-sm font-semibold text-primary hover:underline">
            Open →
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Mini
            label="Protein"
            value={todayLog?.protein_consumed ? `${todayLog.protein_consumed}g` : "—"}
          />
          <Mini
            label="Calories"
            value={todayLog?.calories_consumed ? `${todayLog.calories_consumed}` : "—"}
          />
          <Mini label="Workout" value={todayLog?.workout_completed ? "✓ Done" : "—"} />
        </div>
      </div>

      {/* This Week */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> This week
          </div>
          <Link to="/weekly-planner" className="text-sm font-semibold text-primary hover:underline">
            Open Weekly Planner →
          </Link>
        </div>
        {weekly.row ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <Mini label="Workouts done" value={String(weekStats.workouts)} />
              <Mini label="Meal days done" value={String(weekStats.meals)} />
              <Mini label="Today workout" value={todayPlan?.workout?.focus || "—"} />
              <Mini label="Today meals" value={String(todayPlan?.meals.length ?? 0)} />
            </div>
            {todayPlan && (
              <div className="mt-3 text-xs text-muted-foreground">
                {todayPlan.workout
                  ? `Today: ${todayPlan.workout.focus} · ~${todayPlan.workout.durationMin} min`
                  : "Today: rest day"}
                {todayPlan.meals[0] ? ` · First meal: ${todayPlan.meals[0].name}` : ""}
              </div>
            )}
          </>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">No weekly plan yet.</p>
            <Link
              to="/weekly-planner"
              className="mt-2 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Build your weekly plan
            </Link>
          </div>
        )}
      </div>

      {rec && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            icon={Utensils}
            title="Today's meal"
            body={rec.recipeName}
            cta={
              rec.recipeId ? (
                <Link to="/recipes" className="text-sm font-semibold text-primary hover:underline">
                  View recipe →
                </Link>
              ) : null
            }
          />
          <Card
            icon={Dumbbell}
            title="Today's workout"
            body={rec.workoutSummary}
            sub={rec.workoutFocus}
            cta={
              <Link to="/ai-workout" className="text-sm font-semibold text-primary hover:underline">
                Open workout planner →
              </Link>
            }
          />
          <Card icon={ShoppingBasket} title="Grocery suggestion" body={rec.groceryNote} />
          <Card icon={Lightbulb} title="Quick tip" body={rec.tip} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/ai-meal"
          className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
        >
          <Utensils className="h-6 w-6" />
          <div className="mt-3 font-display text-lg font-bold">Generate my meal plan</div>
          <div className="text-sm opacity-90">7-day plan with grocery list</div>
        </Link>
        <Link
          to="/ai-workout"
          className="rounded-2xl bg-foreground p-5 text-background shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
        >
          <Dumbbell className="h-6 w-6" />
          <div className="mt-3 font-display text-lg font-bold">Generate my workout plan</div>
          <div className="text-sm opacity-90">Built around your gym access</div>
        </Link>
      </div>

      {history.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Recent recommendations
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.for_date} className="rounded-xl border border-border bg-card p-3 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-semibold">
                    {new Date(h.for_date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {h.recommendation.caloriesTarget} kcal · {h.recommendation.proteinTarget}g
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground truncate">
                  🍽 {h.recommendation.recipeName} · 💪 {h.recommendation.workoutFocus}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link
        to="/onboarding"
        className="block text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Edit my profile →
      </Link>

      <p className="text-center text-xs text-muted-foreground">
        GymSathi provides general fitness and nutrition guidance only. It is not medical advice.
        Consult a professional for medical conditions, injuries, or special diets.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-display text-base font-bold">{value}</div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  body,
  sub,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  sub?: string;
  cta?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {sub && <div className="text-sm font-semibold">{sub}</div>}
      <p className="mt-1 text-sm">{body}</p>
      {cta && <div className="mt-3">{cta}</div>}
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
    <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Link
        to={to}
        className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        {cta}
      </Link>
    </div>
  );
}
