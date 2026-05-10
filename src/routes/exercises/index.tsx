import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EXERCISES } from "@/data/exercises";
import { FavButton } from "@/components/FavButton";
import { EmptyState } from "@/components/States";
import { SectionTabs, WORKOUT_TABS } from "@/components/SectionTabs";
import { SearchInput } from "@/components/SearchInput";
import { useProfile } from "@/hooks/use-profile";
import {
  enrichExercise,
  EQUIPMENT_LABEL,
  type EnrichedExercise,
  type EquipmentCategory,
} from "@/lib/workouts/classify";

export const Route = createFileRoute("/exercises/")({
  head: () => ({
    meta: [
      { title: "Exercise Library — GymSathi" },
      {
        name: "description",
        content: "Personalized home and gym exercises with form videos, organized for your setup.",
      },
    ],
  }),
  component: Library,
});

type TabKey = "for-you" | "home" | "gym" | "equipment" | "all";

const TABS: { key: TabKey; label: string }[] = [
  { key: "for-you", label: "For You" },
  { key: "home", label: "Home" },
  { key: "gym", label: "Gym" },
  { key: "equipment", label: "Equipment" },
  { key: "all", label: "All" },
];

function defaultTab(gymAccess: string | null | undefined): TabKey {
  if (gymAccess === "home" || gymAccess === "no_equipment") return "home";
  if (gymAccess === "full_gym") return "gym";
  return "for-you";
}

function Library() {
  const { profile } = useProfile();
  const [tab, setTab] = useState<TabKey>(() => defaultTab(profile?.gym_access));
  const [q, setQ] = useState("");

  const enriched = useMemo<EnrichedExercise[]>(() => EXERCISES.map(enrichExercise), []);
  const filtered = useMemo(
    () =>
      q.trim() ? enriched.filter((e) => e.name.toLowerCase().includes(q.toLowerCase())) : enriched,
    [enriched, q],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Workout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {EXERCISES.length} exercises, organized for your setup.
        </p>
      </div>
      <SectionTabs tabs={WORKOUT_TABS} ariaLabel="Workout sections" />

      {/* Mode segmented control */}
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="inline-flex gap-1 rounded-full border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <SearchInput value={q} onChange={setQ} placeholder="Search exercises…" />

      <TabContent tab={tab} list={filtered} profile={profile} />
    </div>
  );
}

function TabContent({
  tab,
  list,
  profile,
}: {
  tab: TabKey;
  list: EnrichedExercise[];
  profile: ReturnType<typeof useProfile>["profile"];
}) {
  if (list.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No exercises found"
        message="Try a different search term."
      />
    );
  }

  if (tab === "for-you") {
    const equipment = (profile?.equipment ?? []).map((s) => String(s).toLowerCase());
    const hasDB = equipment.some((e) => e.includes("dumbbell"));
    const hasBands = equipment.some((e) => e.includes("band"));
    const isHome = profile?.gym_access === "home" || profile?.gym_access === "no_equipment";
    const isGym = profile?.gym_access === "full_gym";

    const recommended = list.filter((e) => {
      if (isHome) {
        if (e.equipment_category === "dumbbells" && !hasDB) return false;
        if (e.equipment_category === "resistance_bands" && !hasBands) return false;
        return e.home_friendly;
      }
      if (isGym) return e.gym_friendly;
      return true;
    });

    return (
      <div className="space-y-6">
        <Group title="Recommended for your setup" items={recommended} />
        <Group
          title="Quick morning home exercises"
          items={list.filter((e) => e.morning_friendly && e.home_friendly)}
        />
        <Group
          title="Afternoon stretch & mobility"
          items={list.filter((e) => e.afternoon_friendly)}
        />
        <Group
          title="Gym alternatives"
          items={list.filter((e) => !e.home_friendly)}
          defaultCollapsed
        />
      </div>
    );
  }

  if (tab === "home") {
    const home = list.filter((e) => e.home_friendly);
    const gymOnly = list.filter((e) => !e.home_friendly);
    return (
      <div className="space-y-6">
        <CategoryGroup title="Bodyweight" cat="bodyweight" items={home} />
        <CategoryGroup title="Dumbbells" cat="dumbbells" items={home} />
        <CategoryGroup title="Resistance Bands" cat="resistance_bands" items={home} />
        <CategoryGroup title="Kettlebell" cat="kettlebell" items={home} />
        <CategoryGroup title="Pull-Up Bar" cat="pull_up_bar" items={home} />
        <Group title="Core (home)" items={home.filter((e) => e.muscle === "Core")} />
        <Group title="Quick morning" items={home.filter((e) => e.morning_friendly)} />
        <Group title="Gym exercises" items={gymOnly} defaultCollapsed />
      </div>
    );
  }

  if (tab === "gym") {
    const gym = list.filter((e) => e.gym_friendly);
    const homeOnly = list.filter((e) => !e.gym_friendly);
    return (
      <div className="space-y-6">
        <CategoryGroup title="Machines" cat="machine" items={gym} />
        <CategoryGroup title="Cables" cat="cable" items={gym} />
        <CategoryGroup title="Barbells" cat="barbell" items={gym} />
        <CategoryGroup title="Dumbbells" cat="dumbbells" items={gym} />
        <Group title="Legs" items={gym.filter((e) => e.muscle === "Legs")} />
        <Group
          title="Push (chest/shoulders/arms)"
          items={gym.filter((e) => ["Chest", "Shoulders"].includes(e.muscle))}
        />
        <Group title="Pull (back)" items={gym.filter((e) => e.muscle === "Back")} />
        <Group title="Home exercises" items={homeOnly} defaultCollapsed />
      </div>
    );
  }

  if (tab === "equipment") {
    return (
      <div className="space-y-6">
        <CategoryGroup title="No equipment" cat="bodyweight" items={list} />
        <CategoryGroup title="Dumbbells" cat="dumbbells" items={list} />
        <CategoryGroup title="Resistance bands" cat="resistance_bands" items={list} />
        <CategoryGroup title="Machines" cat="machine" items={list} />
        <CategoryGroup title="Cables" cat="cable" items={list} />
        <CategoryGroup title="Barbell" cat="barbell" items={list} />
        <CategoryGroup title="Kettlebell" cat="kettlebell" items={list} />
        <CategoryGroup title="Bench" cat="bench" items={list} />
      </div>
    );
  }

  // all
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((e) => (
        <ExerciseCard key={e.id} ex={e} />
      ))}
    </div>
  );
}

function CategoryGroup({
  title,
  cat,
  items,
}: {
  title: string;
  cat: EquipmentCategory;
  items: EnrichedExercise[];
}) {
  return <Group title={title} items={items.filter((e) => e.equipment_category === cat)} />;
}

function Group({
  title,
  items,
  defaultCollapsed,
}: {
  title: string;
  items: EnrichedExercise[];
  defaultCollapsed?: boolean;
}) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const [showAll, setShowAll] = useState(false);
  if (items.length === 0) return null;
  const PREVIEW = 6;
  const visible = showAll ? items : items.slice(0, PREVIEW);
  const more = items.length - PREVIEW;
  return (
    <section>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-2 text-left"
      >
        <h2 className="font-display text-lg font-semibold">
          {title}{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">{items.length}</span>
        </h2>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((e) => (
              <ExerciseCard key={e.id} ex={e} />
            ))}
          </div>
          {more > 0 && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              {showAll ? "Show less" : `View all (${items.length})`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function ExerciseCard({ ex }: { ex: EnrichedExercise }) {
  return (
    <Link
      to="/exercises/$id"
      params={{ id: ex.id }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-video">
        <img
          src={`https://i.ytimg.com/vi/${ex.youtubeId}/hqdefault.jpg`}
          alt={ex.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute right-2 top-2">
          <FavButton kind="exercise" itemId={ex.id} />
        </div>
        <div className="absolute left-2 top-2 flex gap-1">
          <span className="rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
            {ex.workout_location === "both"
              ? "Home / Gym"
              : ex.workout_location === "home"
                ? "Home"
                : "Gym"}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold">{ex.name}</div>
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
            {ex.difficulty}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {ex.muscle} · {EQUIPMENT_LABEL[ex.equipment_category]}
        </div>
      </div>
    </Link>
  );
}

// silence unused import lint
void Search;
