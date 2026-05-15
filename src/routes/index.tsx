import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { ArrowRight, Target, BarChart3 } from "lucide-react";
import {
  Sparkles,
  Dumbbell,
  Utensils,
  Droplet,
  Footprints,
  Beef,
  Flame,
  CheckCircle2,
  Circle,
  Loader2,
  Activity,
  Calendar,
  MessageSquare,
  ShoppingBasket,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useProgress } from "@/hooks/use-progress";
import { useDailyTasks, type DailyTask } from "@/hooks/use-daily-tasks";
import { useDailyEvaluation } from "@/hooks/use-daily-evaluation";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import { fmtISO, startOfWeek, todayWeekdayIndex } from "@/lib/weekly";
import { calcTargets } from "@/lib/ai/targets";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CoachAdjustments } from "@/components/CoachAdjustments";
import { useAdaptiveCoach } from "@/hooks/use-adaptive-coach";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — GymSathi with Mira" },
      {
        name: "description",
        content: "Your daily AI fitness coach: tasks, workouts, meals and performance feedback.",
      },
    ],
  }),
  component: Home,
});

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const CAT_ICON: Record<string, ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  nutrition: Utensils,
  hydration: Droplet,
  steps: Footprints,
  sleep: Activity,
  habit: CheckCircle2,
};

function Home() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { logs, todayLog } = useProgress(14);
  const tasksHook = useDailyTasks();
  const {
    evaluation,
    busy: evalBusy,
    analyze,
  } = useDailyEvaluation({
    tasks: tasksHook.tasks,
    todayLog,
  });

  // Defer non-critical sections (streak, weekly plan) until after first paint
  const [showSecondary, setShowSecondary] = useState(false);
  useEffect(() => {
    const w =
      typeof window !== "undefined"
        ? (window as Window & { requestIdleCallback?: (cb: () => void) => number })
        : null;
    const ric = w?.requestIdleCallback;
    if (ric) {
      const id = ric(() => setShowSecondary(true));
      return () => {
        const cancel = (window as Window & { cancelIdleCallback?: (id: number) => void })
          .cancelIdleCallback;
        if (cancel) cancel(id);
      };
    }
    const t = setTimeout(() => setShowSecondary(true), 200);
    return () => clearTimeout(t);
  }, []);

  const weekStartISO = useMemo(() => fmtISO(startOfWeek()), []);
  const weekly = useWeeklyPlan(
    showSecondary ? user?.id : undefined,
    showSecondary && user ? weekStartISO : undefined,
  );
  const todayIdx = todayWeekdayIndex();
  const todayPlan = weekly.row?.plan_data?.days?.[todayIdx];

  // Hydration-safe greeting (set after mount so server/client agree)
  const [greeting, setGreeting] = useState("Welcome");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const greetingName =
    profile?.name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";

  // Streak
  const streakDays = useMemo(() => {
    const set = new Set(logs.filter((l) => l.workout_completed).map((l) => l.log_date));
    let n = 0;
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const iso = d.toISOString().slice(0, 10);
      if (set.has(iso)) n++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [logs]);

  const weekChecks = useMemo(() => {
    const set = new Set(logs.filter((l) => l.workout_completed).map((l) => l.log_date));
    const start = new Date();
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return set.has(d.toISOString().slice(0, 10));
    });
  }, [logs]);

  const targets = profile ? calcTargets(profile) : { calories: 2000, protein: 100 };
  const waterGoal = profile?.water_goal_liters ?? 3;
  const stepGoal = profile?.step_goal ?? 8000;

  const generate = async () => {
    try {
      await tasksHook.generateTodayTasks();
      toast.success("Today's tasks ready");
    } catch (e) {
      toast.error((e as Error)?.message || "Could not create tasks");
    }
  };

  const adaptive = useAdaptiveCoach();
  const onAnalyze = async () => {
    try {
      await analyze();
      adaptive.refresh().catch(() => {});
      toast.success("Analysis ready");
    } catch (e) {
      toast.error((e as Error)?.message || "Analysis failed");
    }
  };

  // Landing page for visitors
  if (!user) {
    return <Landing />;
  }

  // Signed in but no profile yet → onboarding
  if (!profile) {
    return <RedirectToOnboarding />;
  }

  const hasTasks = tasksHook.tasks.length > 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold leading-tight">
          {greeting}, {greetingName} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasTasks
            ? `Today's score: ${tasksHook.completionPct}% · ${tasksHook.tasksCompleted} of ${tasksHook.tasksTotal} tasks`
            : "Let's build today's plan."}
        </p>
      </header>

      {/* AI message / Today score */}
      {evaluation?.ai_feedback_message ? (
        <section className="glass-card rounded-3xl p-4 anim-fade-up">
          <div className="inline-flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" /> AI Feedback
          </div>
          <p className="mt-2.5 text-sm leading-snug text-foreground/90">
            {evaluation.ai_feedback_message}
          </p>
          {Array.isArray(evaluation.improvement_suggestions) &&
            evaluation.improvement_suggestions.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {evaluation.improvement_suggestions.slice(0, 3).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          <div className="mt-2 text-[11px] text-muted-foreground">
            {evaluation.compared_to_yesterday} · {evaluation.compared_to_7_day_average}
          </div>
        </section>
      ) : (
        <Link
          to="/coach"
          className="relative block overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-soft)] transition active:scale-[0.99]"
          style={{
            background:
              "var(--gradient-hero, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.85)))",
          }}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur">
              BETA
            </span>
          </div>
          <div className="relative mt-4">
            <div className="font-display text-lg font-bold">Mira's recommendation</div>
            <p className="mt-1 max-w-[28ch] text-sm opacity-90">
              Open the coach for plans, the weekly planner and more.
            </p>
          </div>
        </Link>
      )}

      {/* Today's tasks */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-lg font-bold">Today's tasks</h2>
          {hasTasks && (
            <span className="text-xs text-muted-foreground">
              {tasksHook.tasksCompleted}/{tasksHook.tasksTotal}
            </span>
          )}
        </div>

        {tasksHook.loading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : !hasTasks ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">No tasks for today yet.</p>
            <button
              onClick={generate}
              className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Generate today's tasks
            </button>
          </div>
        ) : (
          <ul className="space-y-2 anim-stagger">
            {tasksHook.tasks.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={tasksHook.toggleComplete} />
            ))}
          </ul>
        )}

        {/* Analyze button */}
        {hasTasks && (
          <button
            onClick={onAnalyze}
            disabled={evalBusy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-glow px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] press disabled:opacity-50"
          >
            {evalBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {evalBusy ? "Analyzing your day…" : evaluation ? "Re-analyze my day" : "Analyze my day"}
          </button>
        )}
      </section>

      {/* Adaptive coach insights */}
      {showSecondary && <CoachAdjustments compact coach={adaptive} />}

      {showSecondary && todayPlan && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">From your weekly plan</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/weekly-planner" className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Dumbbell className="h-3.5 w-3.5" /> Today's workout
              </div>
              <div className="mt-1 font-display font-bold">
                {todayPlan.workout?.focus || "Rest day"}
              </div>
              {todayPlan.workout && (
                <div className="text-xs text-muted-foreground">
                  ~{todayPlan.workout.durationMin} min
                </div>
              )}
            </Link>
            <Link to="/weekly-planner" className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Utensils className="h-3.5 w-3.5" /> Today's meals
              </div>
              <div className="mt-1 font-display font-bold">
                {todayPlan.meals?.length || 0} meals
              </div>
              {todayPlan.meals?.[0] && (
                <div className="truncate text-xs text-muted-foreground">
                  {todayPlan.meals[0].name}
                </div>
              )}
            </Link>
          </div>
        </section>
      )}

      {showSecondary && (
        <section className="grid gap-2 sm:grid-cols-2">
          <Link
            to="/grocery-list"
            className="glass-card glass-press flex items-center justify-between gap-3 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5 text-primary" />
              <div>
                <div className="font-display text-sm font-bold">Grocery List</div>
                <div className="text-xs text-muted-foreground">From your weekly plan</div>
              </div>
            </div>
          </Link>
          <Link
            to="/meal-prep-calendar"
            className="glass-card glass-press flex items-center justify-between gap-3 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="font-display text-sm font-bold">Meal Prep Calendar</div>
                <div className="text-xs text-muted-foreground">Sun + Wed prep tasks</div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Daily progress metrics */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-lg font-bold">Daily Progress</h2>
          <Link to="/progress" className="text-xs font-semibold text-primary">
            Edit
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 anim-stagger">
          <Metric
            icon={Beef}
            label="Protein"
            value={todayLog?.protein_consumed ?? 0}
            target={targets.protein}
            unit="g"
          />
          <Metric
            icon={Flame}
            label="Calories"
            value={todayLog?.calories_consumed ?? 0}
            target={targets.calories}
            unit=""
          />
          <Metric
            icon={Droplet}
            label="Water"
            value={Number(todayLog?.water_liters ?? 0)}
            target={waterGoal}
            unit="L"
          />
          <Metric icon={Footprints} label="Steps" value={0} target={stepGoal} unit="" />
        </div>
      </section>

      {/* Streak */}
      {showSecondary && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                🔥
              </span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Current Streak
                </div>
                <div className="font-display text-lg font-bold">
                  {streakDays} {streakDays === 1 ? "day" : "days"}
                </div>
              </div>
            </div>
            <Link
              to="/weekly-planner"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <Calendar className="h-3.5 w-3.5" /> Weekly plan
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {weekChecks.map((done, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{WEEKDAYS[i]}</span>
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  {done ? "✓" : ""}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: DailyTask;
  onToggle: (id: string, v: boolean) => Promise<void>;
}) {
  const Icon = CAT_ICON[task.category] || CheckCircle2;
  const [pending, setPending] = useState(false);
  const handle = async () => {
    setPending(true);
    try {
      await onToggle(task.id, !task.is_completed);
    } catch (e) {
      toast.error((e as Error)?.message || "Could not update task");
    } finally {
      setPending(false);
    }
  };
  return (
    <li>
      <button
        onClick={handle}
        disabled={pending}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border p-3 text-left press hover-lift",
          task.is_completed
            ? "border-primary/40 bg-gradient-to-r from-primary/15 to-primary-glow/10"
            : "glass-card",
        )}
      >
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-300",
            task.is_completed
              ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground scale-105"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {task.is_completed ? (
            <CheckCircle2 className="h-5 w-5 anim-scale-in" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-semibold transition-all duration-300",
              task.is_completed && "line-through opacity-60",
            )}
          >
            {task.title}
          </span>
          {task.target_value != null && task.unit && (
            <span className="block text-[11px] text-muted-foreground">
              Target: {task.target_value}
              {task.unit}
            </span>
          )}
        </span>
        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
          {task.category}
        </span>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : task.is_completed ? null : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </li>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  target,
  unit,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((Number(value) / target) * 100)) || 0;
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="glass-card rounded-2xl p-3 hover-lift">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3 text-primary" /> {label}
      </div>
      <div className="mt-1 font-display text-base font-bold">
        {value || 0}
        {unit && (
          <span className="text-xs font-medium text-muted-foreground">
            /{target}
            {unit}
          </span>
        )}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-[width] duration-700 ease-out"
          style={{ width: `${animPct}%` }}
        />
      </div>
    </div>
  );
}

function RedirectToOnboarding() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/onboarding", replace: true });
  }, [navigate]);
  return (
    <div className="py-16 text-center text-muted-foreground">
      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
    </div>
  );
}

function Landing() {
  const benefits = [
    {
      icon: Sparkles,
      title: "AI Coach Mira",
      desc: "Personalized guidance, daily plans and instant answers — built around your goals.",
    },
    {
      icon: CheckCircle2,
      title: "Daily tasks that adapt",
      desc: "Workouts, hydration, sleep and habits — auto-generated for the day ahead.",
    },
    {
      icon: Utensils,
      title: "Smart meal plans",
      desc: "Meals matched to your diet, budget and cuisine — with grocery lists ready.",
    },
    {
      icon: BarChart3,
      title: "Progress that proves it",
      desc: "Track weight, protein, water and streaks. See real momentum, week over week.",
    },
  ];

  return (
    <div className="space-y-10 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]">
        <div
          className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "var(--gradient-hero, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6)))",
          }}
          aria-hidden
        />
        <div
          className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "hsl(var(--primary)/0.5)" }}
          aria-hidden
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" /> Meet Mira · Your AI fitness coach
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Train smart. Eat right.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </h1>
          <p className="mt-3 max-w-[42ch] text-sm text-muted-foreground sm:text-base">
            GymSathi builds a personalized fitness, nutrition and habit plan that adapts to you
            every single day.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/profile"
              hash="signup"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-glow px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] press"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Free to start · No credit card required
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section>
        <h2 className="mb-4 px-1 font-display text-xl font-bold">Everything you need, in one app</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="glass-card rounded-2xl p-4 hover-lift">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-display text-base font-bold">{b.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="rounded-3xl border border-border bg-card p-6 text-center">
        <Target className="mx-auto h-7 w-7 text-primary" />
        <h3 className="mt-3 font-display text-lg font-bold">Your goals, your plan</h3>
        <p className="mx-auto mt-1 max-w-[40ch] text-sm text-muted-foreground">
          Tell Mira about you in 2 minutes — get a plan that fits your life today.
        </p>
        <Link
          to="/profile"
          hash="signup"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground press"
        >
          Create your free account <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
