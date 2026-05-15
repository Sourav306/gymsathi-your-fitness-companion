import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
  LogOut,
  User as UserIcon,
  Mail,
  Heart,
  Dumbbell,
  Utensils,
  Activity,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/profile/")({
  head: () => ({ meta: [{ title: "Profile — GymSathi" }] }),
  component: Profile,
});

function Profile() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const initialMode: "signin" | "signup" =
    typeof window !== "undefined" && window.location.hash === "#signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);

  // Redirect newly signed-up users into onboarding
  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) return;
    if (justSignedUp || !profile) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [user, profile, loading, profileLoading, justSignedUp, navigate]);

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading…</div>;

  if (user) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
            <UserIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-3 font-display text-xl font-bold">
            {user.user_metadata?.display_name || user.email?.split("@")[0]}
          </h1>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" /> {user.email}
          </p>
        </div>

        <nav className="overflow-hidden rounded-2xl border border-border bg-card">
          <Row to="/onboarding" icon={Sparkles} label="Personal info & goals" />
          <Row to="/progress" icon={Activity} label="Progress & measurements" />
          <Row to="/favorites" icon={Heart} label="Saved items" />
          <Row to="/plans" icon={Dumbbell} label="Saved workouts" />
          <Row to="/meal-plans" icon={Utensils} label="Saved meals" />
          <Row to="/onboarding" icon={Settings} label="Settings" last />
        </nav>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
          }}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium text-destructive hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/onboarding",
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setJustSignedUp(true);
        toast.success("Account created! Let's set up your profile.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      toast.error((err as Error)?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/",
      });
      if (result.error) toast.error("Google sign-in failed");
    } catch {
      toast.error("Google sign-in failed");
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-2xl font-bold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to save your favorites."
            : "Save favorites, track plans, and more."}
        </p>

        <button
          onClick={handleGoogle}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
        >
          <svg className="h-4 w-4" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7 29.5 5 24 5 16.3 5 9.7 9 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 43c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.4 33.9 26.8 35 24 35c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 38.9 16.2 43 24 43z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.3 5.3C40.9 35.9 43.5 30.5 43.5 24c0-1.2-.1-2.3.1-3.5z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <Input label="Name" value={name} onChange={setName} placeholder="Your name" />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@email.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? "New to GymSathi? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function Row({
  to,
  icon: Icon,
  label,
  last,
}: {
  to: "/onboarding" | "/progress" | "/favorites" | "/plans" | "/meal-plans";
  icon: ComponentType<{ className?: string }>;
  label: string;
  last?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3.5 active:bg-secondary ${last ? "" : "border-b border-border"}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
