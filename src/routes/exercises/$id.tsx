import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, Dumbbell, Home, Building2 } from "lucide-react";
import { EXERCISES } from "@/data/exercises";
import { FavButton } from "@/components/FavButton";
import { EXERCISE_ALTERNATIVES } from "@/lib/workouts/exercise-alternatives";
import { enrichExercise, EQUIPMENT_LABEL } from "@/lib/workouts/classify";

export const Route = createFileRoute("/exercises/$id")({
  loader: ({ params }) => {
    const ex = EXERCISES.find((e) => e.id === params.id);
    if (!ex) throw notFound();
    return ex;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — GymSathi` },
          { name: "description", content: loaderData.summary },
        ]
      : [],
  }),
  component: Detail,
  notFoundComponent: () => (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">Exercise not found.</p>
      <Link to="/exercises" className="mt-4 inline-block text-primary">
        Back to library
      </Link>
    </div>
  ),
});

function Detail() {
  const e = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <Link
        to="/exercises"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All exercises
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-primary">{e.muscle}</div>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">{e.name}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{e.summary}</p>
        </div>
        <FavButton kind="exercise" itemId={e.id} className="h-11 w-11" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill icon={Dumbbell} label={e.equipment} />
        <Pill label={`Difficulty: ${e.difficulty}`} />
        <Pill label={EQUIPMENT_LABEL[enrichExercise(e).equipment_category]} />
      </div>

      <AlternativesCard id={e.id} />

      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        <div className="aspect-video">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${e.youtubeId}`}
            title={e.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card icon={CheckCircle2} title="How to do it" iconClass="text-primary">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {e.steps.map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Card>
        <Card icon={AlertTriangle} title="Common mistakes" iconClass="text-destructive">
          <ul className="space-y-2 text-sm">
            {e.mistakes.map((m: string, i: number) => (
              <li key={i} className="flex gap-2">
                <span className="text-destructive">•</span>
                {m}
              </li>
            ))}
          </ul>
        </Card>
        <Card icon={Lightbulb} title="Beginner tips" iconClass="text-primary">
          <ul className="space-y-2 text-sm">
            {e.tips.map((t: string, i: number) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Pill({ icon: Icon, label }: { icon?: typeof Dumbbell; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />} {label}
    </span>
  );
}

function Card({
  icon: Icon,
  title,
  children,
  iconClass,
}: {
  icon: typeof Dumbbell;
  title: string;
  children: React.ReactNode;
  iconClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconClass ?? ""}`} />
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function AlternativesCard({ id }: { id: string }) {
  const alt = EXERCISE_ALTERNATIVES[id];
  if (!alt || (!alt.homeAlternativeId && !alt.gymAlternativeId)) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {alt.homeAlternativeId && (
        <Link
          to="/exercises/$id"
          params={{ id: alt.homeAlternativeId }}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Home className="h-3.5 w-3.5" /> Home alternative
            </div>
            <div className="mt-0.5 text-sm font-semibold">{alt.homeAlternativeName}</div>
          </div>
          <span className="text-xs text-muted-foreground">View →</span>
        </Link>
      )}
      {alt.gymAlternativeId && (
        <Link
          to="/exercises/$id"
          params={{ id: alt.gymAlternativeId }}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Building2 className="h-3.5 w-3.5" /> Gym alternative
            </div>
            <div className="mt-0.5 text-sm font-semibold">{alt.gymAlternativeName}</div>
          </div>
          <span className="text-xs text-muted-foreground">View →</span>
        </Link>
      )}
    </div>
  );
}
