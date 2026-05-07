import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EXERCISES, MUSCLES, type MuscleGroup } from "@/data/exercises";
import { FavButton } from "@/components/FavButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exercises/")({
  head: () => ({
    meta: [
      { title: "Exercise Library — GymSathi" },
      { name: "description", content: "Browse beginner-friendly exercises by muscle group with form videos and tips." },
    ],
  }),
  component: Library,
});

function Library() {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "All">("All");

  const filtered = useMemo(() => EXERCISES.filter((e) =>
    (muscle === "All" || e.muscle === muscle) &&
    (q.trim() === "" || e.name.toLowerCase().includes(q.toLowerCase()))
  ), [q, muscle]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Exercise Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">{EXERCISES.length} beginner-friendly moves with video form guides.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises…"
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {(["All", ...MUSCLES] as const).map((m) => (
          <button key={m} onClick={() => setMuscle(m)}
            className={cn("whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition",
              muscle === m ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            {m}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <Link key={e.id} to="/exercises/$id" params={{ id: e.id }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="relative aspect-video">
              <img src={`https://i.ytimg.com/vi/${e.youtubeId}/hqdefault.jpg`} alt={e.name}
                className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute right-2 top-2"><FavButton kind="exercise" itemId={e.id} /></div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{e.name}</div>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{e.difficulty}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{e.muscle} · {e.equipment}</div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No exercises match your search.
          </div>
        )}
      </div>
    </div>
  );
}
