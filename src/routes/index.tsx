import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Dumbbell, Utensils, Calculator, ListChecks, Sparkles } from "lucide-react";
import { EXERCISES } from "@/data/exercises";
import { RECIPES } from "@/data/recipes";
import { PLANS } from "@/data/plans";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GymSathi — Beginner gym workouts & Indian high-protein meals" },
      { name: "description", content: "Simple gym workouts, exercise videos and high-protein Indian meal ideas built for beginners." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl px-6 py-12 text-primary-foreground md:px-12 md:py-20"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Built for South Asian beginners
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Your gym sathi for <br className="hidden sm:block" /> a stronger you.
          </h1>
          <p className="mt-3 text-base text-primary-foreground/90 md:text-lg">
            Simple workouts, clear video guides, and high-protein desi meal ideas. No gimmicks.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/exercises" className="inline-flex items-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-semibold text-foreground shadow-lg transition hover:scale-[1.02]">
              Browse exercises <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/plans" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20">
              Workout plans
            </Link>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { to: "/exercises", icon: Dumbbell, label: "Exercises", count: `${EXERCISES.length} moves` },
          { to: "/plans", icon: ListChecks, label: "Plans", count: `${PLANS.length} routines` },
          { to: "/recipes", icon: Utensils, label: "Meals", count: `${RECIPES.length} recipes` },
          { to: "/calculator", icon: Calculator, label: "Calorie Calc", count: "BMR + Protein" },
        ].map(({ to, icon: Icon, label, count }) => (
          <Link key={to} to={to} className="group rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-3 font-display font-semibold">{label}</div>
            <div className="text-xs text-muted-foreground">{count}</div>
          </Link>
        ))}
      </section>

      {/* Featured exercises */}
      <section>
        <SectionHead title="Popular exercises" to="/exercises" cta="View all" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXERCISES.slice(0, 6).map((e) => (
            <Link key={e.id} to="/exercises/$id" params={{ id: e.id }}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <img src={`https://i.ytimg.com/vi/${e.youtubeId}/mqdefault.jpg`} alt="" className="h-16 w-24 rounded-lg object-cover" />
              <div className="min-w-0">
                <div className="truncate font-semibold">{e.name}</div>
                <div className="text-xs text-muted-foreground">{e.muscle} · {e.difficulty}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured recipes */}
      <section>
        <SectionHead title="High-protein meals" to="/recipes" cta="See all recipes" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RECIPES.slice(0, 3).map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-3xl">{r.emoji}</div>
              <div className="mt-2 font-semibold">{r.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{r.protein}g protein · {r.calories} kcal · {r.time} min</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHead({ title, to, cta }: { title: string; to: "/exercises" | "/plans" | "/recipes"; cta: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <Link to={to} className="text-sm font-medium text-primary hover:underline">{cta}</Link>
    </div>
  );
}
