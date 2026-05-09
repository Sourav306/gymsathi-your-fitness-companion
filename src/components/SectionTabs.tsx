import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type TabItem = { to: string; label: string; matches?: string[] };

export function SectionTabs({ tabs, ariaLabel }: { tabs: TabItem[]; ariaLabel: string }) {
  const { pathname } = useLocation();
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1 rounded-2xl bg-secondary/60 p-1">
      {tabs.map((t) => {
        const active =
          pathname === t.to ||
          (t.matches?.some((m) => pathname.startsWith(m)) ?? false);
        return (
          <Link
            key={t.to}
            to={t.to}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition-colors",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export const WORKOUT_TABS: TabItem[] = [
  { to: "/exercises", label: "Exercises", matches: ["/exercises"] },
  { to: "/plans", label: "Plans", matches: ["/plans", "/ai-workout", "/weekly-planner"] },
];

export const NUTRITION_TABS: TabItem[] = [
  { to: "/recipes", label: "Meals", matches: ["/recipes", "/ai-meal"] },
  { to: "/meal-plans", label: "Diet", matches: ["/meal-plans"] },
  { to: "/calculator", label: "Calculator", matches: ["/calculator"] },
];
