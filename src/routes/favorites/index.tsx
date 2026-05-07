import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, LogIn } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { EXERCISES } from "@/data/exercises";
import { RECIPES } from "@/data/recipes";
import { PLANS } from "@/data/plans";
import { FavButton } from "@/components/FavButton";

export const Route = createFileRoute("/favorites/")({
  head: () => ({ meta: [{ title: "Favorites — GymSathi" }] }),
  component: Favs,
});

function Favs() {
  const { user, loading } = useAuth();
  const { favorites } = useFavorites();

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 font-display text-2xl font-bold">Save your favorites</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to save exercises, recipes, and plans for later.</p>
        <Link to="/profile" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          <LogIn className="h-4 w-4" /> Sign in
        </Link>
      </div>
    );
  }

  const exFavs = favorites.filter((f) => f.kind === "exercise").map((f) => EXERCISES.find((e) => e.id === f.item_id)).filter(Boolean);
  const reFavs = favorites.filter((f) => f.kind === "recipe").map((f) => RECIPES.find((r) => r.id === f.item_id)).filter(Boolean);
  const plFavs = favorites.filter((f) => f.kind === "plan").map((f) => PLANS.find((p) => p.id === f.item_id)).filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Your Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quick access to everything you bookmarked.</p>
      </div>

      <Section title="Exercises" empty="No saved exercises yet.">
        {exFavs.map((e) => e && (
          <Link key={e.id} to="/exercises/$id" params={{ id: e.id }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:shadow-md">
            <img src={`https://i.ytimg.com/vi/${e.youtubeId}/mqdefault.jpg`} alt="" className="h-14 w-20 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.muscle} · {e.difficulty}</div>
            </div>
            <FavButton kind="exercise" itemId={e.id} />
          </Link>
        ))}
      </Section>

      <Section title="Recipes" empty="No saved recipes yet.">
        {reFavs.map((r) => r && (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-accent text-2xl">{r.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.protein}g protein · {r.calories} kcal</div>
            </div>
            <FavButton kind="recipe" itemId={r.id} />
          </div>
        ))}
      </Section>

      <Section title="Plans" empty="No saved plans yet.">
        {plFavs.map((p) => p && (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.weeks}w · {p.daysPerWeek}d/week · {p.level}</div>
            </div>
            <FavButton kind="plan" itemId={p.id} />
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-bold">{title}</h2>
      {arr.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{empty}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      )}
    </section>
  );
}
