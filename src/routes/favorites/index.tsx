import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, LogIn } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { EXERCISES } from "@/data/exercises";
import { RECIPES } from "@/data/recipes";
import { PLANS } from "@/data/plans";
import { FavButton } from "@/components/FavButton";
import { EmptyState, LoadingState } from "@/components/States";

export const Route = createFileRoute("/favorites/")({
  head: () => ({ meta: [{ title: "Favorites — GymSathi" }] }),
  component: Favs,
});

function Favs() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading } = useFavorites();

  if (authLoading) return <LoadingState rows={3} />;

  if (!user) {
    return (
      <EmptyState
        icon={Heart}
        title="Save your favorites"
        message="Sign in to save exercises, recipes, and workout plans for later."
        action={
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
        }
      />
    );
  }

  const exFavs = favorites
    .filter((f) => f.kind === "exercise")
    .map((f) => EXERCISES.find((e) => e.id === f.item_id))
    .filter(Boolean) as typeof EXERCISES;
  const reFavs = favorites
    .filter((f) => f.kind === "recipe")
    .map((f) => RECIPES.find((r) => r.id === f.item_id))
    .filter(Boolean) as typeof RECIPES;
  const plFavs = favorites
    .filter((f) => f.kind === "plan")
    .map((f) => PLANS.find((p) => p.id === f.item_id))
    .filter(Boolean) as typeof PLANS;

  const hasAny = exFavs.length + reFavs.length + plFavs.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Your Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick access to everything you bookmarked.
        </p>
      </div>

      {loading && !hasAny ? (
        <LoadingState rows={3} />
      ) : !hasAny ? (
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          message="Tap the heart on any exercise, recipe, or plan to save it here."
          action={
            <Link
              to="/exercises"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Browse exercises
            </Link>
          }
        />
      ) : (
        <>
          <Section title="Exercises" count={exFavs.length}>
            <div className="grid gap-3 sm:grid-cols-2">
              {exFavs.map((e) => (
                <Link
                  key={e.id}
                  to="/exercises/$id"
                  params={{ id: e.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.99] hover:shadow-md"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${e.youtubeId}/mqdefault.jpg`}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.muscle} · {e.difficulty}
                    </div>
                  </div>
                  <FavButton kind="exercise" itemId={e.id} />
                </Link>
              ))}
            </div>
          </Section>

          <Section title="Recipes" count={reFavs.length}>
            <div className="grid gap-3 sm:grid-cols-2">
              {reFavs.map((r) => (
                <Link
                  key={r.id}
                  to="/recipes"
                  hash={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.99] hover:shadow-md"
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-accent text-2xl">
                    {r.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.protein}g protein · {r.calories} kcal
                    </div>
                  </div>
                  <FavButton kind="recipe" itemId={r.id} />
                </Link>
              ))}
            </div>
          </Section>

          <Section title="Plans" count={plFavs.length}>
            <div className="grid gap-3 sm:grid-cols-2">
              {plFavs.map((p) => (
                <Link
                  key={p.id}
                  to="/plans"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition active:scale-[0.99] hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.weeks}w · {p.daysPerWeek}d/week · {p.level}
                    </div>
                  </div>
                  <FavButton kind="plan" itemId={p.id} />
                </Link>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      {children}
    </section>
  );
}
