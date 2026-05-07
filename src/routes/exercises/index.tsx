import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { EXERCISES, MUSCLES, type Difficulty, type MuscleGroup } from "@/data/exercises";
import { FavButton } from "@/components/FavButton";
import { FilterChips } from "@/components/FilterChips";
import { SearchInput } from "@/components/SearchInput";
import { EmptyState } from "@/components/States";

export const Route = createFileRoute("/exercises/")({
  head: () => ({
    meta: [
      { title: "Exercise Library — GymSathi" },
      { name: "description", content: "Browse beginner-friendly exercises by muscle group, equipment, and difficulty." },
    ],
  }),
  component: Library,
});

const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const EQUIPMENT_OPTIONS = Array.from(new Set(EXERCISES.map((e) => e.equipment))).sort();

function Library() {
  const [q, setQ] = useState("");
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount = muscles.length + difficulties.length + equipment.length;

  const filtered = useMemo(() => EXERCISES.filter((e) =>
    (muscles.length === 0 || muscles.includes(e.muscle)) &&
    (difficulties.length === 0 || difficulties.includes(e.difficulty)) &&
    (equipment.length === 0 || equipment.includes(e.equipment)) &&
    (q.trim() === "" || e.name.toLowerCase().includes(q.toLowerCase()))
  ), [q, muscles, difficulties, equipment]);

  const reset = () => { setMuscles([]); setDifficulties([]); setEquipment([]); setQ(""); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Exercise Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">{EXERCISES.length} beginner-friendly moves with form videos.</p>
      </div>

      <div className="sticky top-0 z-30 -mx-4 space-y-3 bg-background/90 px-4 pb-3 pt-1 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:pt-0 md:backdrop-blur-none">
        <SearchInput value={q} onChange={setQ} placeholder="Search exercises…" />

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{activeCount}</span>
            )}
          </button>
          <div className="text-xs text-muted-foreground">{filtered.length} of {EXERCISES.length}</div>
        </div>

        {filtersOpen && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <FilterChips label="Muscle group" multi
              options={MUSCLES.map((m) => ({ key: m, label: m }))}
              value={muscles} onChange={setMuscles} />
            <FilterChips label="Difficulty" multi
              options={DIFFICULTIES.map((d) => ({ key: d, label: d }))}
              value={difficulties} onChange={setDifficulties} />
            <FilterChips label="Equipment" multi
              options={EQUIPMENT_OPTIONS.map((e) => ({ key: e, label: e }))}
              value={equipment} onChange={setEquipment} />
            {activeCount > 0 && (
              <button onClick={reset} className="text-xs font-semibold text-primary">Reset all</button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No exercises found"
          message="Try clearing some filters or searching for something else."
          action={<button onClick={reset} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Reset filters</button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Link key={e.id} to="/exercises/$id" params={{ id: e.id }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-video">
                <img src={`https://i.ytimg.com/vi/${e.youtubeId}/hqdefault.jpg`} alt={e.name}
                  className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute right-2 top-2"><FavButton kind="exercise" itemId={e.id} /></div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{e.name}</div>
                  <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">{e.difficulty}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{e.muscle} · {e.equipment}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
