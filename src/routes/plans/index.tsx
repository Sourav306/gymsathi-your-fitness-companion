import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Target, TrendingUp } from "lucide-react";
import { PLANS } from "@/data/plans";
import { EXERCISES } from "@/data/exercises";
import { FavButton } from "@/components/FavButton";

export const Route = createFileRoute("/plans/")({
  head: () => ({
    meta: [
      { title: "Workout Plans — GymSathi" },
      { name: "description", content: "Beginner and intermediate workout plans for strength, muscle, and fat loss." },
    ],
  }),
  component: Plans,
});

function Plans() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Workout Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a plan that matches your goal and schedule.</p>
      </div>

      <div className="space-y-6">
        {PLANS.map((p) => (
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

            <div className="grid gap-3 border-t border-border p-6 md:grid-cols-2 md:p-8">
              {p.schedule.map((d) => (
                <div key={d.day} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{d.day}</div>
                    <div className="text-xs text-muted-foreground">{d.focus}</div>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {d.exerciseIds.map((id) => {
                      const e = EXERCISES.find((x) => x.id === id);
                      if (!e) return null;
                      return <li key={id} className="flex justify-between gap-2"><span>{e.name}</span><span className="text-xs text-muted-foreground">3 × 8–12</span></li>;
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
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
