import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Sparkles,
  Dumbbell,
  Utensils,
  Droplet,
  Footprints,
  Beef,
  Flame,
  CheckCircle2,
  Loader2,
  Activity,
  ArrowUpRight,
  TrendingUp,
  BookOpen,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useProgress, type ProgressLog } from "@/hooks/use-progress";
import { useDailyTasks, type DailyTask } from "@/hooks/use-daily-tasks";
import { useDailyEvaluation } from "@/hooks/use-daily-evaluation";
import { calcTargets } from "@/lib/ai/targets";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAdaptiveCoach } from "@/hooks/use-adaptive-coach";
import { EXERCISES } from "@/data/exercises";
import { PLANS } from "@/data/plans";

// Computed once at module load — stable constants, no runtime cost
const PLAN_COUNTS = {
  total: PLANS.length,
  beginner: PLANS.filter((p) => p.level === "Beginner").length,
  intermediate: PLANS.filter((p) => p.level === "Intermediate").length,
};
const EXERCISE_COUNTS = {
  total: EXERCISES.length,
  beginner: EXERCISES.filter((e) => e.beginner_safe).length,
  home: EXERCISES.filter((e) => e.home_friendly).length,
};

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

const CAT_ICON: Record<string, ComponentType<{ className?: string }>> = {
  workout: Dumbbell,
  nutrition: Utensils,
  hydration: Droplet,
  steps: Footprints,
  sleep: Activity,
  habit: CheckCircle2,
};

const CAT_COLOR: Record<string, string> = {
  workout: "#f97316",
  nutrition: "#22c55e",
  hydration: "#06b6d4",
  steps: "#3b82f6",
  sleep: "#a78bfa",
  habit: "#eab308",
};

const DONUT_COLORS = ["#f97316", "#22c55e", "#06b6d4", "#3b82f6", "#a78bfa", "#eab308"];

function fmtChartDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

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

  const [greeting, setGreeting] = useState("Welcome");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  const greetingName =
    profile?.name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";

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

  // Area chart: last 14 days calorie + protein trend
  const chartData = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
    return sorted.map((l) => ({
      date: fmtChartDate(l.log_date),
      calories: l.calories_consumed ?? 0,
      protein: l.protein_consumed ?? 0,
    }));
  }, [logs]);

  // Donut: task completion by category
  const donutData = useMemo(() => {
    const cats = ["workout", "nutrition", "hydration", "steps", "sleep", "habit"] as const;
    return cats
      .map((cat) => {
        const total = tasksHook.tasks.filter((t) => t.category === cat).length;
        const done = tasksHook.tasks.filter((t) => t.category === cat && t.is_completed).length;
        return { name: cat, value: Math.max(total, 0), done, total };
      })
      .filter((d) => d.total > 0);
  }, [tasksHook.tasks]);

  const workoutsThisWeek = weekChecks.filter(Boolean).length;
  const hasTasks = tasksHook.tasks.length > 0;

  // Not signed in
  if (!user) {
    return (
      <div className="space-y-6">
        <header className="px-1">
          <h1 className="font-display text-2xl font-bold leading-tight">
            {greeting} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI fitness coach for daily plans, tasks and feedback.
          </p>
        </header>
        <div className="rounded-3xl border border-border bg-card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-3 font-display text-lg font-bold">Sign in to start</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a free account to chat with Mira, daily tasks and progress tracking.
          </p>
          <Link
            to="/profile"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // Onboarding
  if (!profile) {
    return (
      <div className="space-y-6">
        <header className="px-1">
          <h1 className="font-display text-2xl font-bold leading-tight">
            {greeting}, {greetingName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let me set up your personalized coach.
          </p>
        </header>
        <Link
          to="/onboarding-chat"
          className="block overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-soft)]"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="mt-4 font-display text-lg font-bold">Chat with Mira</div>
          <p className="mt-1 text-sm opacity-90">
            A few quick questions and I'll build your full plan.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow">
            Start onboarding
          </div>
        </Link>
        <Link to="/onboarding" className="block text-center text-xs text-muted-foreground">
          Prefer a form? Use the form view →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">Dashboard Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {greeting}, {greetingName} ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <Link
          to="/coach"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          <Sparkles className="h-3.5 w-3.5" /> AI Coach
        </Link>
      </header>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Dumbbell}
          label="Workout Plans"
          value={PLAN_COUNTS.total}
          sub1={{ label: "Beginner", value: PLAN_COUNTS.beginner }}
          sub2={{ label: "Intermediate", value: PLAN_COUNTS.intermediate }}
          to="/plans"
        />
        <StatCard
          icon={BookOpen}
          label="Total Exercises"
          value={EXERCISE_COUNTS.total}
          sub1={{ label: "Beginner", value: EXERCISE_COUNTS.beginner }}
          sub2={{ label: "Home-friendly", value: EXERCISE_COUNTS.home }}
          to="/exercises"
        />
        <StatCard
          icon={Flame}
          label="Workout Streak"
          value={streakDays}
          sub1={{ label: "This week", value: workoutsThisWeek }}
          sub2={{ label: "Total logged", value: logs.length }}
          to="/progress"
        />
        <StatCard
          icon={Target}
          label="Today's Tasks"
          value={tasksHook.tasksCompleted}
          sub1={{ label: "Completed", value: tasksHook.tasksCompleted }}
          sub2={{
            label: "Remaining",
            value: Math.max(0, tasksHook.tasksTotal - tasksHook.tasksCompleted),
          }}
          to="/progress"
        />
      </div>

      {/* ── Middle: Chart + Tasks ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Activity Trend */}
        <div className="glass-card rounded-2xl p-4 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Activity Trend</span>
            <span className="rounded-full border border-border/50 bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              Last 14 Days
            </span>
          </div>

          {chartData.length > 1 ? (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #94a3b8)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card, #1e1e2e)",
                        border: "1px solid var(--color-border, rgba(255,255,255,0.1))",
                        borderRadius: "12px",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="calories"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#gCal)"
                      dot={false}
                      name="Calories"
                    />
                    <Area
                      type="monotone"
                      dataKey="protein"
                      stroke="#cbd5e1"
                      strokeWidth={1.5}
                      strokeOpacity={0.5}
                      fill="url(#gPro)"
                      dot={false}
                      name="Protein (g)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-4 rounded-full bg-primary" /> Calories
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-4 rounded-full bg-foreground/25" /> Protein (g)
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center gap-2">
              <Activity className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                Log your progress to see the activity trend
              </p>
              <Link to="/progress" className="text-xs font-semibold text-primary">
                Log today →
              </Link>
            </div>
          )}
        </div>

        {/* Today's Tasks */}
        <div className="glass-card rounded-2xl p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Today's Tasks</span>
            <span className="text-xs text-muted-foreground">
              {tasksHook.tasksCompleted}/{tasksHook.tasksTotal}
            </span>
          </div>

          {tasksHook.loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !hasTasks ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3">
              <p className="text-xs text-muted-foreground">No tasks for today yet.</p>
              <button
                onClick={generate}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Generate tasks
              </button>
            </div>
          ) : (
            <ul className="space-y-2.5 overflow-y-auto" style={{ maxHeight: "230px" }}>
              {tasksHook.tasks.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={tasksHook.toggleComplete} />
              ))}
            </ul>
          )}

          {hasTasks && (
            <button
              onClick={onAnalyze}
              disabled={evalBusy}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-glow px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {evalBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {evalBusy ? "Analyzing…" : evaluation ? "Re-analyze my day" : "Analyze my day"}
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom: Top Content + Fitness Overview ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopContentPanel />
        <FitnessOverviewPanel
          todayLog={todayLog}
          targets={targets}
          waterGoal={waterGoal}
          stepGoal={stepGoal}
          donutData={donutData}
          completionPct={tasksHook.completionPct}
          tasksTotal={tasksHook.tasksTotal}
          tasksCompleted={tasksHook.tasksCompleted}
        />
      </div>

      {/* ── AI Feedback ── */}
      {evaluation?.ai_feedback_message && (
        <section className="glass-card rounded-2xl p-4 anim-fade-up">
          <div className="inline-flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" /> AI Feedback
          </div>
          <p className="mt-2.5 text-sm leading-snug text-foreground/90">
            {evaluation.ai_feedback_message}
          </p>
          {evaluation.compared_to_yesterday && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {evaluation.compared_to_yesterday} · {evaluation.compared_to_7_day_average}
            </div>
          )}
        </section>
      )}

      {/* ── Adaptive Coach Suggestions ── */}
      {showSecondary && adaptive.insights.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-bold">Coach Suggestions</h2>
          <div className="space-y-2">
            {adaptive.insights.slice(0, 2).map((ins) => (
              <div key={ins.id} className="glass-card rounded-2xl p-3">
                <div className="text-xs font-semibold text-primary">{ins.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{ins.reason}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Sedela-style stat card ──────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub1,
  sub2,
  to,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub1: { label: string; value: number };
  sub2: { label: string; value: number };
  to: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 hover-lift">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <Link to={to}>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors hover:text-primary" />
        </Link>
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-display text-2xl font-bold">{value}</div>
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-border/40 pt-3">
        <div>
          <div className="text-[10px] text-muted-foreground">{sub1.label}</div>
          <div className="text-xs font-semibold">{sub1.value}</div>
        </div>
        <div className="h-5 w-px bg-border/50" />
        <div>
          <div className="text-[10px] text-muted-foreground">{sub2.label}</div>
          <div className="text-xs font-semibold">{sub2.value}</div>
        </div>
      </div>
    </div>
  );
}

// ── Task row — Sedela withdrawal-list style ─────────────────────────────────
function TaskRow({
  task,
  onToggle,
}: {
  task: DailyTask;
  onToggle: (id: string, v: boolean) => Promise<void>;
}) {
  const Icon = CAT_ICON[task.category] || CheckCircle2;
  const color = CAT_COLOR[task.category] || "#f97316";
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
    <li className="flex items-center gap-2.5">
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
        style={{ background: `${color}20`, color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-xs font-semibold",
            task.is_completed && "line-through opacity-50",
          )}
        >
          {task.title}
        </div>
        <div className="text-[10px] capitalize text-muted-foreground">{task.category}</div>
      </div>
      <button
        onClick={handle}
        disabled={pending}
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all",
          task.is_completed
            ? "bg-primary text-primary-foreground"
            : "border border-border/60 bg-secondary text-muted-foreground hover:border-primary hover:text-primary",
        )}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : task.is_completed ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <ArrowRight className="h-3.5 w-3.5" />
        )}
      </button>
    </li>
  );
}

// ── Top Plans / Exercises tab panel ────────────────────────────────────────
function TopContentPanel() {
  const [tab, setTab] = useState<"plans" | "exercises">("plans");

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-0.5 rounded-xl border border-border/50 bg-secondary/30 p-0.5">
          {(["plans", "exercises"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {t === "plans" ? "Top Plans" : "Exercises"}
            </button>
          ))}
        </div>
        <Link to={tab === "plans" ? "/plans" : "/exercises"}>
          <div className="grid h-7 w-7 place-items-center rounded-lg border border-border/50 bg-secondary/40">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Link>
      </div>

      <ul className="space-y-2">
        {tab === "plans"
          ? PLANS.slice(0, 4).map((plan) => (
              <li key={plan.id}>
                <Link
                  to="/plans"
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/20 px-3 py-2.5 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">{plan.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {plan.daysPerWeek} days/week · {plan.weeks} wks
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-border/40 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {plan.level}
                  </span>
                </Link>
              </li>
            ))
          : EXERCISES.slice(0, 4).map((ex) => (
              <li key={ex.id}>
                <Link
                  to="/exercises/$id"
                  params={{ id: ex.id }}
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/20 px-3 py-2.5 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">{ex.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {ex.muscle} · {ex.difficulty}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-border/40 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {ex.equipment_category}
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );
}

// ── Fitness Overview donut + metrics ───────────────────────────────────────
function FitnessOverviewPanel({
  todayLog,
  targets,
  waterGoal,
  stepGoal,
  donutData,
  completionPct,
  tasksTotal,
  tasksCompleted,
}: {
  todayLog: ProgressLog | null;
  targets: { calories: number; protein: number };
  waterGoal: number;
  stepGoal: number;
  donutData: Array<{ name: string; value: number; done: number; total: number }>;
  completionPct: number;
  tasksTotal: number;
  tasksCompleted: number;
}) {
  const isEmpty = donutData.length === 0;
  const chartData = isEmpty ? [{ name: "none", value: 1 }] : donutData;

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Fitness Overview</span>
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg border border-border/50 bg-secondary/40">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <Link
            to="/progress"
            className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            7 Days <ChevronDown className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* Metrics */}
        <div className="flex-1 space-y-3">
          <MetricRow
            icon={Beef}
            label="Protein"
            value={todayLog?.protein_consumed ?? 0}
            target={targets.protein}
            unit="g"
          />
          <MetricRow
            icon={Flame}
            label="Calories"
            value={todayLog?.calories_consumed ?? 0}
            target={targets.calories}
            unit="kcal"
          />
          <MetricRow
            icon={Droplet}
            label="Water"
            value={Number(todayLog?.water_liters ?? 0)}
            target={waterGoal}
            unit="L"
          />
          <MetricRow icon={Footprints} label="Steps" value={0} target={stepGoal} unit="" />
        </div>

        {/* Donut + legend */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-28 w-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={34}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        isEmpty ? "var(--color-secondary)" : DONUT_COLORS[i % DONUT_COLORS.length]
                      }
                      opacity={isEmpty ? 0.3 : 0.9}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-lg font-bold text-primary">{completionPct}%</span>
            </div>
          </div>

          <div className="space-y-1">
            {donutData.slice(0, 4).map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: DONUT_COLORS[i] }}
                />
                <span className="text-[10px] capitalize text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending tasks pill — mirrors Sedela's "Total Pending" */}
      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-border/40 bg-secondary/30 px-3 py-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/20 text-primary">
          <Target className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Pending Tasks</div>
          <div className="font-display text-sm font-bold">
            {Math.max(0, tasksTotal - tasksCompleted)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({
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
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <span className="text-[10px] font-semibold">
            {value}
            {unit && ` ${unit}`}
          </span>
        </div>
        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-secondary/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
