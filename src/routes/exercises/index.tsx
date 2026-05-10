import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, PlayCircle, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  EXERCISES,
  MUSCLES,
  type Difficulty,
  type EquipmentCategory,
  type Exercise,
  type MuscleGroup,
} from "@/data/exercises";
import { FavButton } from "@/components/FavButton";
import { FilterChips } from "@/components/FilterChips";
import { SearchInput } from "@/components/SearchInput";
import { EmptyState } from "@/components/States";
import { SectionTabs, WORKOUT_TABS } from "@/components/SectionTabs";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exercises/")({
  head: () => ({
    meta: [
      { title: "Exercise Library - GymSathi" },
      {
        name: "description",
        content: "Personalized home and gym exercises with form videos, organized for your setup.",
      },
    ],
  }),
  component: Library,
});

type WorkoutMode = "for-you" | "home" | "gym" | "equipment" | "all";

const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const EQUIPMENT_OPTIONS = Array.from(new Set(EXERCISES.map((e) => e.equipment))).sort();
const VISIBLE_PER_SECTION = 6;

const MODES: { key: WorkoutMode; label: string }[] = [
  { key: "for-you", label: "For You" },
  { key: "home", label: "Home" },
  { key: "gym", label: "Gym" },
  { key: "equipment", label: "Equipment" },
  { key: "all", label: "All" },
];

const EQUIPMENT_LABELS: Record<EquipmentCategory, string> = {
  bodyweight: "Bodyweight",
  dumbbell: "Dumbbell",
  barbell: "Barbell",
  machine: "Machine",
  cable: "Cable",
  band: "Band",
  kettlebell: "Kettlebell",
  bench: "Bench",
  mixed: "Mixed",
};

function Library() {
  const { profile, user } = useProfile();
  const [mode, setMode] = useState<WorkoutMode>("for-you");
  const [modeTouched, setModeTouched] = useState(false);
  const [q, setQ] = useState("");
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (modeTouched) return;
    if (!user || !profile) {
      setMode("for-you");
      return;
    }
    setMode(profile.gym_access === "full_gym" ? "gym" : "home");
  }, [modeTouched, profile, user]);

  const activeCount = muscles.length + difficulties.length + equipment.length;
  const hasSearchOrFilters = activeCount > 0 || q.trim().length > 0;

  const visibleExercises = useMemo(() => {
    const text = q.trim().toLowerCase();
    return getModeExercises(mode, profile ?? null).filter(
      (e) =>
        (muscles.length === 0 || muscles.includes(e.muscle)) &&
        (difficulties.length === 0 || difficulties.includes(e.difficulty)) &&
        (equipment.length === 0 || equipment.includes(e.equipment)) &&
        (text === "" ||
          e.name.toLowerCase().includes(text) ||
          e.muscle.toLowerCase().includes(text) ||
          e.equipment.toLowerCase().includes(text)),
    );
  }, [mode, profile, q, muscles, difficulties, equipment]);

  const sections = useMemo(
    () => buildSections(mode, visibleExercises, profile ?? null, hasSearchOrFilters),
    [mode, visibleExercises, profile, hasSearchOrFilters],
  );

  const reset = () => {
    setMuscles([]);
    setDifficulties([]);
    setEquipment([]);
    setQ("");
    setExpanded(new Set());
  };

  const chooseMode = (next: WorkoutMode) => {
    setMode(next);
    setModeTouched(true);
    setExpanded(new Set());
  };

  const toggleExpanded = (sectionId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Workout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {EXERCISES.length} exercises, organized for your setup.
        </p>
      </div>
      <SectionTabs tabs={WORKOUT_TABS} ariaLabel="Workout sections" />

      <div className="sticky top-0 z-30 -mx-4 space-y-3 bg-background/90 px-4 pb-3 pt-1 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:pt-0 md:backdrop-blur-none">
        <div
          role="group"
          aria-label="Workout mode"
          className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {MODES.map((item) => {
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => chooseMode(item.key)}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "glass-button text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <SearchInput value={q} onChange={setQ} placeholder="Search exercises..." />

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="exercise-filters"
            className="glass-button glass-press inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>
          <div className="text-xs text-muted-foreground">
            {visibleExercises.length} of {EXERCISES.length}
          </div>
        </div>

        {filtersOpen && (
          <div id="exercise-filters" className="glass-card space-y-4 rounded-2xl p-4">
            <FilterChips
              label="Muscle group"
              multi
              options={MUSCLES.map((m) => ({ key: m, label: m }))}
              value={muscles}
              onChange={setMuscles}
            />
            <FilterChips
              label="Difficulty"
              multi
              options={DIFFICULTIES.map((d) => ({ key: d, label: d }))}
              value={difficulties}
              onChange={setDifficulties}
            />
            <FilterChips
              label="Equipment"
              multi
              options={EQUIPMENT_OPTIONS.map((e) => ({ key: e, label: e }))}
              value={equipment}
              onChange={setEquipment}
            />
            {activeCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="min-h-11 rounded-full px-1 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Reset all filters
              </button>
            )}
          </div>
        )}
      </div>

      {visibleExercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises found"
          message="Try clearing some filters or searching for something else."
          action={
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            const isExpanded = expanded.has(section.id);
            const visible = isExpanded
              ? section.exercises
              : section.exercises.slice(0, VISIBLE_PER_SECTION);
            return (
              <section key={section.id} className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold">{section.title}</h2>
                    {section.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{section.description}</p>
                    )}
                  </div>
                  {section.exercises.length > VISIBLE_PER_SECTION && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(section.id)}
                      className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      {isExpanded ? "Show less" : "View all"}
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getModeExercises(mode: WorkoutMode, profile: ReturnType<typeof useProfile>["profile"]) {
  if (mode === "home") return EXERCISES.filter((e) => e.home_friendly);
  if (mode === "gym") return EXERCISES.filter((e) => e.gym_friendly);
  if (mode === "for-you") return rankForProfile(EXERCISES, profile).slice(0, 24);
  return EXERCISES;
}

function buildSections(
  mode: WorkoutMode,
  exercises: Exercise[],
  profile: ReturnType<typeof useProfile>["profile"],
  hasSearchOrFilters: boolean,
) {
  if (hasSearchOrFilters) {
    return [
      {
        id: "matches",
        title: "Matching exercises",
        description: "Filtered from the current workout mode.",
        exercises,
      },
    ];
  }

  if (mode === "for-you") {
    return compactSections([
      {
        id: "recommended",
        title: profile ? "Recommended for you" : "Beginner-safe starters",
        description: profile
          ? "Based on your gym access, experience and limitations."
          : "Good first moves while you set up your profile.",
        exercises: rankForProfile(exercises, profile).slice(0, 8),
      },
      {
        id: "quick-home",
        title: "Quick home moves",
        description: "Low setup exercises for busy days.",
        exercises: exercises.filter((e) => e.home_friendly && e.morning_friendly),
      },
      {
        id: "form-first",
        title: "Form-first gym basics",
        description: "Beginner-safe machines, cables and controlled lifts.",
        exercises: exercises.filter((e) => e.gym_friendly && e.beginner_safe),
      },
    ]);
  }

  if (mode === "home") {
    return compactSections([
      {
        id: "no-equipment",
        title: "No equipment",
        description: "Bodyweight moves for small spaces.",
        exercises: exercises.filter((e) => e.equipment_category === "bodyweight"),
      },
      {
        id: "home-gear",
        title: "Dumbbells, bands and kettlebells",
        description: "Simple equipment that works well at home.",
        exercises: exercises.filter((e) =>
          ["dumbbell", "band", "kettlebell"].includes(e.equipment_category),
        ),
      },
      {
        id: "home-core",
        title: "Core and conditioning",
        description: "Short sessions for consistency.",
        exercises: exercises.filter((e) => e.muscle === "Core" || e.muscle === "Full Body"),
      },
    ]);
  }

  if (mode === "gym") {
    return compactSections([
      {
        id: "machines-cables",
        title: "Machines and cables",
        description: "Guided paths that are easier to learn.",
        exercises: exercises.filter((e) => ["machine", "cable"].includes(e.equipment_category)),
      },
      {
        id: "barbell-strength",
        title: "Barbell strength",
        description: "Compound lifts for gym days.",
        exercises: exercises.filter((e) => e.equipment_category === "barbell"),
      },
      {
        id: "gym-dumbbells",
        title: "Dumbbells and benches",
        description: "Flexible movements for busy gyms.",
        exercises: exercises.filter((e) => ["dumbbell", "bench"].includes(e.equipment_category)),
      },
    ]);
  }

  if (mode === "equipment") {
    const order: EquipmentCategory[] = [
      "bodyweight",
      "dumbbell",
      "machine",
      "cable",
      "barbell",
      "kettlebell",
      "band",
      "bench",
      "mixed",
    ];
    return compactSections(
      order.map((category) => ({
        id: `equipment-${category}`,
        title: EQUIPMENT_LABELS[category],
        description: `${EQUIPMENT_LABELS[category]} exercise options.`,
        exercises: exercises.filter((e) => e.equipment_category === category),
      })),
    );
  }

  return compactSections(
    MUSCLES.map((muscle) => ({
      id: `muscle-${muscle}`,
      title: muscle,
      description: `All ${muscle.toLowerCase()} exercises.`,
      exercises: exercises.filter((e) => e.muscle === muscle),
    })),
  );
}

function compactSections(
  sections: { id: string; title: string; description?: string; exercises: Exercise[] }[],
) {
  return sections.filter((section) => section.exercises.length > 0);
}

function rankForProfile(exercises: Exercise[], profile: ReturnType<typeof useProfile>["profile"]) {
  return [...exercises].sort((a, b) => scoreForProfile(b, profile) - scoreForProfile(a, profile));
}

function scoreForProfile(exercise: Exercise, profile: ReturnType<typeof useProfile>["profile"]) {
  let score = 0;
  if (exercise.beginner_safe) score += 4;
  if (exercise.morning_friendly) score += 1;

  if (!profile) return score + (exercise.home_friendly ? 2 : 0);

  if (profile.gym_access === "full_gym" && exercise.gym_friendly) score += 4;
  if (profile.gym_access === "home" && exercise.home_friendly) score += 5;
  if (profile.gym_access === "no_equipment" && exercise.equipment_category === "bodyweight") {
    score += 7;
  }
  if (profile.experience === "beginner" && exercise.beginner_safe) score += 5;
  if (profile.experience === "beginner" && exercise.difficulty === "Advanced") score -= 8;
  if (!safeForInjuries(exercise, profile.injuries || "")) score -= 20;
  return score;
}

function safeForInjuries(exercise: Exercise, injuries: string) {
  const text = `${exercise.name} ${exercise.muscle} ${exercise.equipment}`.toLowerCase();
  const injuryText = injuries.toLowerCase();
  if (!injuryText.trim()) return true;
  if (injuryText.includes("knee") && /squat|lunge|leg/.test(text)) return false;
  if (injuryText.includes("back") && /deadlift|row|bent/.test(text)) return false;
  if (injuryText.includes("shoulder") && /overhead|press|shoulder/.test(text)) return false;
  if (injuryText.includes("wrist") && /push-up|bench/.test(text)) return false;
  return true;
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      to="/exercises/$id"
      params={{ id: exercise.id }}
      aria-label={`Open ${exercise.name} exercise details`}
      className="glass-card glass-press group relative overflow-hidden rounded-2xl transition hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="relative aspect-video">
        <img
          src={`https://i.ytimg.com/vi/${exercise.youtubeId}/hqdefault.jpg`}
          alt={exercise.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute right-2 top-2">
          <FavButton kind="exercise" itemId={exercise.id} />
        </div>
        <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
          <PlayCircle className="h-3 w-3" /> Video
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold leading-snug">{exercise.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {exercise.muscle} - {exercise.equipment}
            </div>
          </div>
          <span className="glass-pill shrink-0 px-2 py-1 text-[10px] font-semibold">
            {exercise.difficulty}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge label={locationLabel(exercise)} />
          <Badge label={EQUIPMENT_LABELS[exercise.equipment_category]} />
          {exercise.beginner_safe && <Badge label="Beginner-safe" />}
        </div>
      </div>
    </Link>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-secondary/70 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
      {label}
    </span>
  );
}

function locationLabel(exercise: Exercise) {
  if (exercise.workout_location === "both") return "Home or Gym";
  return exercise.workout_location === "home" ? "Home" : "Gym";
}
