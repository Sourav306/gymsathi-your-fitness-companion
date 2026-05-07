import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Clock, Flame } from "lucide-react";
import { RECIPES } from "@/data/recipes";
import { FavButton } from "@/components/FavButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recipes/")({
  head: () => ({
    meta: [
      { title: "High-Protein Indian Recipes — GymSathi" },
      { name: "description", content: "Easy, high-protein Indian meal prep recipes for beginners." },
    ],
  }),
  component: Recipes,
});

const TYPES = ["All", "Veg", "Egg", "Non-Veg"] as const;

function Recipes() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");

  const filtered = useMemo(() => RECIPES.filter((r) =>
    (type === "All" || r.type === type) &&
    (q.trim() === "" || r.name.toLowerCase().includes(q.toLowerCase()))
  ), [q, type]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">High-Protein Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Desi meals built around protein. Easy to prep.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes…"
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition",
              type === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((r) => (
          <details key={r.id} className="group rounded-2xl border border-border bg-card p-5 transition hover:shadow-md">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
              <div className="flex gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-accent text-3xl">{r.emoji}</div>
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{r.protein}g protein</span>
                    <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {r.calories} kcal</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time} min</span>
                  </div>
                </div>
              </div>
              <FavButton kind="recipe" itemId={r.id} />
            </summary>
            <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</div>
                <ul className="space-y-1 text-sm">
                  {r.ingredients.map((i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{i}</li>)}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Steps</div>
                <ol className="list-decimal space-y-1 pl-4 text-sm">
                  {r.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
