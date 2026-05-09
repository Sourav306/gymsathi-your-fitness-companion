import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Utensils, ChevronRight, Flame, Beef } from "lucide-react";
import { MEAL_PLANS, MEAL_PLAN_FILTERS, type MealPlanTag } from "@/data/mealPlans";
import { FavButton } from "@/components/FavButton";
import { FilterChips } from "@/components/FilterChips";
import { EmptyState } from "@/components/States";
import { SectionTabs, NUTRITION_TABS } from "@/components/SectionTabs";

export const Route = createFileRoute("/meal-plans/")({
  head: () => ({
    meta: [
      { title: "Meal Plans — GymSathi" },
      { name: "description", content: "7-day Indian meal plans for muscle gain, fat loss, vegetarian, non-veg, and budget." },
    ],
  }),
  component: MealPlansPage,
});

function MealPlansPage() {
  const [tags, setTags] = useState<MealPlanTag[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () => MEAL_PLANS.filter((p) => tags.length === 0 || tags.every((t) => p.tags.includes(t))),
    [tags],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Nutrition</h1>
        <p className="mt-1 text-sm text-muted-foreground">7-day Indian meal plans for every goal.</p>
      </div>
      <SectionTabs tabs={NUTRITION_TABS} ariaLabel="Nutrition sections" />

      <FilterChips multi options={MEAL_PLAN_FILTERS} value={tags} onChange={setTags} />

      {filtered.length === 0 ? (
        <EmptyState icon={Utensils} title="No meal plans match"
          message="Try clearing the filters."
          action={<button onClick={() => setTags([])} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Show all</button>} />
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const open = openId === p.id;
            return (
              <article key={p.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="flex items-start gap-3 p-5 md:p-6">
                  <button type="button" onClick={() => setOpenId(open ? null : p.id)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left active:scale-[0.99]">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">{p.dietType}</span>
                      <h2 className="mt-2 font-display text-xl font-bold md:text-2xl">{p.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 font-medium">
                          <Flame className="h-3.5 w-3.5 text-primary" /> {p.calories} kcal/day
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 font-medium">
                          <Beef className="h-3.5 w-3.5 text-primary" /> {p.protein}g protein
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
                  </button>
                  <FavButton kind="recipe" itemId={p.id} />
                </div>

                {open && (
                  <div className="grid gap-3 border-t border-border p-4 md:grid-cols-2 md:p-6">
                    {p.days.map((d) => (
                      <div key={d.day} className="rounded-2xl border border-border bg-background p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-sm font-semibold">{d.day}</div>
                          <div className="text-xs text-muted-foreground">{d.totalCalories} kcal · {d.totalProtein}g</div>
                        </div>
                        <dl className="space-y-1.5 text-sm">
                          <Row label="Breakfast" value={d.breakfast} />
                          <Row label="Lunch" value={d.lunch} />
                          <Row label="Snack" value={d.snack} />
                          <Row label="Dinner" value={d.dinner} />
                        </dl>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Looking for single recipes? <Link to="/recipes" className="text-primary hover:underline">Browse recipes</Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  );
}
