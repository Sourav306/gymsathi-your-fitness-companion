import { Link, useLocation } from "@tanstack/react-router";
import { Dumbbell, Home, ListChecks, Utensils, Calculator, Heart, User, Salad, Sparkles, Activity, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const desktopItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/coach", label: "Coach", icon: Sparkles },
  { to: "/weekly-planner", label: "Week", icon: Calendar },
  { to: "/progress", label: "Progress", icon: Activity },
  { to: "/exercises", label: "Exercises", icon: Dumbbell },
  { to: "/plans", label: "Plans", icon: ListChecks },
  { to: "/recipes", label: "Meals", icon: Utensils },
  { to: "/meal-plans", label: "Diet", icon: Salad },
  { to: "/calculator", label: "Calc", icon: Calculator },
  { to: "/favorites", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const mobileItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/coach", label: "Coach", icon: Sparkles },
  { to: "/progress", label: "Progress", icon: Activity },
  { to: "/exercises", label: "Exercises", icon: Dumbbell },
  { to: "/plans", label: "Plans", icon: ListChecks },
  { to: "/recipes", label: "Meals", icon: Utensils },
  { to: "/meal-plans", label: "Diet", icon: Salad },
  { to: "/calculator", label: "Calc", icon: Calculator },
  { to: "/favorites", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-40 hidden border-b border-border bg-background/80 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold">GymSathi</span>
          </Link>
          <nav className="flex items-center gap-1">
            {items.map((it) => {
              const active = location.pathname === it.to || (it.to !== "/" && location.pathname.startsWith(it.to));
              return (
                <Link key={it.to} to={it.to}
                  className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:px-6 md:pt-8 md:pb-12">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-10">
          {items.map((it) => {
            const active = location.pathname === it.to || (it.to !== "/" && location.pathname.startsWith(it.to));
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}
                className={cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium active:bg-secondary",
                  active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="h-5 w-5" />
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
