import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Dumbbell, Utensils, Calculator, ListChecks, Sparkles, Flame, Activity, Droplet, Footprints, Beef } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProgress } from "@/hooks/use-progress";
import { PLANS } from "@/data/plans";
import { EXERCISES } from "@/data/exercises";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GymSathi — Beginner gym workouts & high-protein Indian meals" },
      { name: "description", content: "Simple gym workouts, exercise videos and high-protein Indian meal ideas built for beginners." },
    ],
  }),
  component: Home,
});

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function Home() {
  const { user } = useAuth();
  const { logs, todayLog } = useProgress();

  const greetingName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Today's focus = first day of first plan
  const featuredPlan = PLANS[0];
  const todayFocus = featuredPlan?.schedule[0];
  const focusExerciseCount = todayFocus?.exercises.length ?? 0;
  const focusMinutes = focusExerciseCount * 7 + 5;

  // Streak: count consecutive recent days with workout_completed
  const streakDays = useMemo(() => {
    const set = new Set(logs.filter((l) => l.workout_completed).map((l) => l.log_date));
    let n = 0;
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const iso = d.toISOString().slice(0, 10);
      if (set.has(iso)) n++; else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [logs]);

  const weekChecks = useMemo(() => {
    const set = new Set(logs.filter((l) => l.workout_completed).map((l) => l.log_date));
    const start = new Date();
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return set.has(d.toISOString().slice(0, 10));
    });
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold leading-tight">
          {greeting}, {greetingName} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Ready to become stronger today?</p>
      </header>

      {/* AI Coach card */}
      <Link
        to="/coach"
        className="relative block overflow-hidden rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-soft)] transition active:scale-[0.99]"
        style={{ background: "var(--gradient-hero, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.85)))" }}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur">BETA</span>
        </div>
        <div className="relative mt-4">
          <div className="font-display text-lg font-bold">Your AI Coach</div>
          <p className="mt-1 max-w-[28ch] text-sm opacity-90">
            I’ll build the perfect plan for you and keep you on track every day.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow">
            <Sparkles className="h-4 w-4 text-primary" /> Chat with AI Coach
          </div>
        </div>
      </Link>

      {/* Today's Focus */}
      {todayFocus && featuredPlan && (
        <section>
          <SectionHead title="Today’s Focus" />
          <Link
            to="/plans"
            className="flex items-stretch gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg font-bold">{todayFocus.day}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{todayFocus.focus}</div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Dumbbell className="h-3.5 w-3.5 text-primary" /> {focusExerciseCount} exercises</span>
                <span>·</span>
                <span>{focusMinutes} min</span>
              </div>
            </div>
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Dumbbell className="h-9 w-9" />
            </div>
          </Link>
        </section>
      )}

      {/* Daily progress */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-lg font-bold">Daily Progress</h2>
          <Link to="/progress" className="text-xs font-semibold text-primary">Edit</Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric icon={Beef} label="Protein" value={todayLog?.protein_consumed ?? 0} target={120} unit="g" />
          <Metric icon={Flame} label="Calories" value={todayLog?.calories_consumed ?? 0} target={2200} unit="" />
          <Metric icon={Droplet} label="Water" value={todayLog?.water_liters ?? 0} target={3} unit="L" />
          <Metric icon={Footprints} label="Steps" value={0} target={10000} unit="" />
        </div>
      </section>

      {/* Streak */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>🔥</span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Streak</div>
              <div className="font-display text-lg font-bold">{streakDays} {streakDays === 1 ? "day" : "days"}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Keep it going!</div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {weekChecks.map((done, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{WEEKDAYS[i]}</span>
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {done ? "✓" : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Quick to="/exercises" icon={Dumbbell} label="Exercises" sub={`${EXERCISES.length} moves`} />
          <Quick to="/plans" icon={ListChecks} label="Workout Plans" sub={`${PLANS.length} routines`} />
          <Quick to="/recipes" icon={Utensils} label="Meals" sub="High-protein" />
          <Quick to="/calculator" icon={Calculator} label="Calorie Calc" sub="BMR + Protein" />
        </div>
      </section>

      <Link to="/coach" className="flex items-center justify-center gap-1 pt-2 text-sm font-semibold text-primary">
        Open AI Coach <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>;
}

function Metric({ icon: Icon, label, value, target, unit }: { icon: any; label: string; value: number; target: number; unit: string }) {
  const pct = Math.min(100, Math.round((Number(value) / target) * 100)) || 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3 text-primary" /> {label}
      </div>
      <div className="mt-1 font-display text-base font-bold">
        {value || 0}{unit && <span className="text-xs font-medium text-muted-foreground">/{target}{unit}</span>}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Quick({ to, icon: Icon, label, sub }: { to: "/exercises" | "/plans" | "/recipes" | "/calculator"; icon: any; label: string; sub: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-4 transition active:scale-[0.99] hover:shadow-md">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-display font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </Link>
  );
}
