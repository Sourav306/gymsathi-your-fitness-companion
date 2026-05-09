import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Dumbbell, Home, Utensils, User, Sparkles, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bottom nav: Home | Workout | (AI Coach floating) | Nutrition | Profile
 * Workout groups: /exercises, /plans, /weekly-planner
 * Nutrition groups: /recipes, /meal-plans, /calculator
 * Profile groups: /profile, /favorites, /onboarding, /progress
 */

const NAV = {
  home: { to: "/", label: "Home", icon: Home, match: ["/"] as string[] },
  workout: {
    to: "/exercises",
    label: "Workout",
    icon: Dumbbell,
    match: ["/exercises", "/plans", "/workout", "/weekly-planner", "/ai-workout"],
  },
  nutrition: {
    to: "/recipes",
    label: "Nutrition",
    icon: Utensils,
    match: ["/recipes", "/meal-plans", "/calculator", "/nutrition", "/ai-meal"],
  },
  profile: {
    to: "/profile",
    label: "Profile",
    icon: User,
    match: ["/profile", "/favorites", "/onboarding", "/progress"],
  },
} as const;

function isActive(pathname: string, key: keyof typeof NAV) {
  const item = NAV[key];
  if (key === "home") return pathname === "/";
  return item.match.some((m) => m !== "/" && pathname.startsWith(m));
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const coachActive = location.pathname.startsWith("/coach");

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-40 hidden glass-strong border-b md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">GymSathi</span>
          </Link>
          <nav className="flex items-center gap-1">
            {(["home", "workout", "nutrition", "profile"] as const).map((k) => {
              const it = NAV[k];
              const active = isActive(location.pathname, k);
              return (
                <Link
                  key={k}
                  to={it.to}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
            <Link
              to="/coach"
              className={cn(
                "ml-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition",
                coachActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/90 text-primary-foreground hover:bg-primary",
              )}
            >
              <Sparkles className="h-4 w-4" /> AI Coach
            </Link>
            <Link
              to="/progress"
              className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Activity className="inline h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-4 md:px-6 md:pt-8 md:pb-12">
        <div key={location.pathname} className="anim-fade-up">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav with floating AI Coach */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="relative mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1">
          <NavTab item={NAV.home} active={isActive(location.pathname, "home")} />
          <NavTab item={NAV.workout} active={isActive(location.pathname, "workout")} />

          {/* spacer for floating button */}
          <div aria-hidden className="h-14" />

          <NavTab item={NAV.nutrition} active={isActive(location.pathname, "nutrition")} />
          <NavTab item={NAV.profile} active={isActive(location.pathname, "profile")} />

          {/* Floating AI Coach */}
          <Link
            to="/coach"
            aria-label="AI Coach"
            className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-6 grid h-16 w-16 place-items-center rounded-full ring-4 ring-background press glow-pulse text-primary-foreground",
              "bg-gradient-to-br from-[oklch(0.62_0.18_255)] to-[oklch(0.6_0.2_295)]",
              coachActive && "scale-105",
            )}
          >
            <Sparkles className="h-7 w-7" />
            <span className="sr-only">AI Coach</span>
          </Link>
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-0.5 text-[10px] font-semibold text-primary">
            AI Coach
          </span>
        </div>
      </nav>
    </div>
  );
}

function NavTab({
  item,
  active,
}: {
  item: { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium press transition-all duration-200",
        active ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5 transition-transform", active && "stroke-[2.5]")} />
      <span>{item.label}</span>
    </Link>
  );
}
