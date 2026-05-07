import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, Flame, Utensils, ChevronRight } from "lucide-react";
import { RECIPES, RECIPE_FILTERS, type RecipeTag } from "@/data/recipes";
import { FavButton } from "@/components/FavButton";
import { FilterChips } from "@/components/FilterChips";
import { SearchInput } from "@/components/SearchInput";
import { EmptyState } from "@/components/States";

export const Route = createFileRoute("/recipes/")({
  head: () => ({
    meta: [
      { title: "High-Protein Indian Recipes — GymSathi" },
      { name: "description", content: "Easy, high-protein Indian meal prep recipes for beginners." },
    ],
  }),
  component: Recipes,
});

function Recipes() {
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<RecipeTag[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => RECIPES.filter((r) =>
    (tags.length === 0 || tags.every((t) => r.tags.includes(t))) &&
    (q.trim() === "" || r.name.toLowerCase().includes(q.toLowerCase()))
  ), [q, tags]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">High-Protein Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Desi meals built around protein. Easy to prep.</p>
      </div>

      <div className="sticky top-0 z-30 -mx-4 space-y-3 bg-background/90 px-4 pb-3 pt-1 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:pt-0 md:backdrop-blur-none">
        <SearchInput value={q} onChange={setQ} placeholder="Search recipes…" />
        <FilterChips multi options={RECIPE_FILTERS} value={tags} onChange={setTags} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Utensils} title="No recipes match"
          message="Try removing a filter or searching a different keyword."
          action={
            <button onClick={() => { setTags([]); setQ(""); }} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Reset filters
            </button>
          } />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((r) => {
            const open = openId === r.id;
            return (
              <article key={r.id}
                className="overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="flex w-full items-center gap-4 p-4 text-left active:scale-[0.99]"
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent text-3xl">{r.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{r.name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">{r.protein}g protein</span>
                      <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {r.calories} kcal</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <FavButton kind="recipe" itemId={r.id} />
                    <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
                  </div>
                </button>
                {open && (
                  <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                    <div>
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</div>
                      <ul className="space-y-1 text-sm">
                        {r.ingredients.map((i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{i}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Steps</div>
                      <ol className="list-decimal space-y-1 pl-4 text-sm">
                        {r.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Tip: <Link to="/calculator" className="text-primary hover:underline">calculate your protein target</Link> first.
      </p>
    </div>
  );
}
