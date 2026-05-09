import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calendar, Target, TrendingUp, ListChecks, ChevronRight, Info } from "lucide-react";
import { PLANS } from "@/data/plans";
import { EXERCISES } from "@/data/exercises";
import { FavButton } from "@/components/FavButton";
import { FilterChips } from "@/components/FilterChips";
import { EmptyState } from "@/components/States";
import { SectionTabs, WORKOUT_TABS } from "@/components/SectionTabs";

type GoalKey = "beginner" | "muscle" | "fatloss";

export const Route = createFileRoute("/plans/")({
  head: () => ({
    meta: [
      { title: "Workout Plans — GymSathi" },
      { name: "description", content: "Beginner and intermediate workout plans for strength, muscle, and fat loss." },
    ],
  }),
  component: Plans,
});

function planMatches(planId: string, planGoal: string, planLevel: string, key: GoalKey) {
  const g = planGoal.toLowerCase();
  if (key === "beginner") return planLevel === "Beginner";
  if (key === "muscle") return g.includes("muscle") || g.includes("strength");
  if (key === "fatloss") return g.includes("fat") || g.includes("lose") || planId.includes("fatloss");
  return true;
}

function Plans() {
  const [goals, setGoals] = useState<GoalKey[]>([]);

  const filtered = useMemo(
    () => PLANS.filter((p) => goals.length === 0 || goals.some((g) => planMatches(p.id, p.goal, p.level, g))),
    [goals],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Workout</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a plan that matches your goal.</p>
      </div>
      <SectionTabs tabs={WORKOUT_TABS} ariaLabel="Workout sections" />

      <FilterChips multi
        options={[
          { key: "beginner", label: "Beginner" },
          { key: "muscle", label: "Muscle gain" },
          { key: "fatloss", label: "Fat loss" },
        ]}
        value={goals} onChange={setGoals}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No plans match"
          message="Try clearing the filters to see all plans."
          action={<button onClick={() => setGoals([])} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Show all plans</button>} />
      ) : (
        <div className="space-y-6">
          {filtered.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <div className="relative p-6 md:p-8" style={{ background: "var(--gradient-card)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{p.level}</span>
                    <h2 className="mt-3 font-display text-2xl font-bold md:text-3xl">{p.name}</h2>
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">{p.description}</p>
                  </div>
                  <FavButton kind="plan" itemId={p.id} className="h-11 w-11" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Stat icon={Target} label={p.goal} />
                  <Stat icon={Calendar} label={`${p.weeks} weeks`} />
                  <Stat icon={TrendingUp} label={`${p.daysPerWeek} days / week`} />
                </div>
              </div>

              <div className="border-t border-border p-4 md:p-6">
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-accent/50 p-3 text-xs text-accent-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Tap any exercise to watch the video and learn proper form.</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {p.schedule.map((d) => (
                    <div key={d.day} className="rounded-2xl border border-border bg-background p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-semibold">{d.day}</div>
                        <div className="text-xs text-muted-foreground">{d.focus}</div>
                      </div>
                      <ul className="divide-y divide-border">
                        {d.exercises.map((item, idx) => {
                          const ex = EXERCISES.find((x) => x.id === item.exerciseId);
                          if (!ex) return null;
                          return (
                            <li key={`${item.exerciseId}-${idx}`}>
                              <Link to="/exercises/$id" params={{ id: ex.id }}
                                className="flex min-h-12 items-center justify-between gap-3 py-2.5 -mx-1 px-1 rounded-lg active:bg-secondary">
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">{ex.name}</div>
                                  <div className="truncate text-xs text-muted-foreground">
                                    {item.sets} sets × {item.reps} reps · {item.rest} rest
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label }: { icon: typeof Target; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </span>
  );
}
