import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar, Check, Sparkles, Trash2, Clock, Snowflake, Flame } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMealPrepTasks } from "@/hooks/use-meal-prep-tasks";
import { fmtISO, startOfWeek } from "@/lib/weekly";
import { buildPrepTasks } from "@/lib/grocery-generate";

export const Route = createFileRoute("/meal-prep-calendar/")({
  head: () => ({ meta: [{ title: "Meal Prep Calendar — GymSathi" }] }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const weekStartDate = useMemo(() => startOfWeek(), []);
  const weekStart = fmtISO(weekStartDate);
  const weekEndDate = useMemo(() => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStartDate]);
  const weekEnd = fmtISO(weekEndDate);

  const { tasks, loading, toggle, remove, generate } = useMealPrepTasks(user?.id, {
    from: weekStart,
    to: weekEnd,
  });
  const [busy, setBusy] = useState(false);

  const generateAuto = async () => {
    if (!user) return toast.error("Sign in first");
    setBusy(true);
    try {
      await generate(buildPrepTasks(weekStart), { source: "auto" });
      toast.success("Sunday + Wednesday prep tasks generated");
    } catch (e) {
      toast.error((e as Error)?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const m = new Map<string, typeof tasks>();
    for (const t of tasks) {
      if (!m.has(t.task_date)) m.set(t.task_date, []);
      m.get(t.task_date)!.push(t);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold">Meal Prep Calendar</h1>
        <div className="glass-card rounded-2xl p-6 text-sm text-muted-foreground">
          Sign in to plan and track your meal prep.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold leading-tight">Meal Prep Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sunday + Wednesday prep with safe storage and reheating guidance.
        </p>
      </header>

      <section className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              This week
            </div>
            <div className="font-display text-base font-bold">
              {weekStart} → {weekEnd}
            </div>
          </div>
          <button
            onClick={generateAuto}
            disabled={busy}
            className="glass-button-primary glass-press inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {tasks.length ? "Regenerate" : "Generate prep tasks"}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : grouped.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
          No prep tasks yet. Tap "Generate prep tasks" to plan Sunday + Wednesday.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, list]) => {
            const d = new Date(date + "T00:00:00");
            return (
              <section key={date} className="glass-card-strong rounded-3xl p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div className="font-display text-base font-bold">
                    {d.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {list.map((t) => (
                    <li
                      key={t.id}
                      className={`rounded-2xl border border-border/50 p-3 ${t.is_completed ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggle(t.id, !t.is_completed)}
                          className={`mt-0.5 grid h-6 w-6 place-items-center rounded-md border ${t.is_completed ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                          aria-label="Toggle complete"
                        >
                          {t.is_completed && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="flex-1">
                          <div
                            className={`text-sm font-semibold ${t.is_completed ? "line-through" : ""}`}
                          >
                            {t.title}
                          </div>
                          {t.duration_min != null && (
                            <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> ~{t.duration_min} min
                            </div>
                          )}
                          {t.instructions && (
                            <p className="mt-2 text-xs text-muted-foreground">{t.instructions}</p>
                          )}
                          {t.storage && (
                            <p className="mt-1.5 inline-flex items-start gap-1.5 text-[11px] text-muted-foreground">
                              <Snowflake className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                              <span>
                                <span className="font-semibold text-foreground/80">Storage: </span>
                                {t.storage}
                              </span>
                            </p>
                          )}
                          {t.reheating && (
                            <p className="mt-1 inline-flex items-start gap-1.5 text-[11px] text-muted-foreground">
                              <Flame className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
                              <span>
                                <span className="font-semibold text-foreground/80">Reheat: </span>
                                {t.reheating}
                              </span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => remove(t.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Food safety: cool cooked food within 1–2 hours, refrigerate ≤4°C, reheat once to ≥75°C
        internal. Discard anything refrigerated longer than 3 days.
      </p>

      <Link
        to="/grocery-list"
        className="glass-button glass-press inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
      >
        Open Grocery List
      </Link>
    </div>
  );
}
