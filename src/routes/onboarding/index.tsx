import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { UserProfileSchema, type UserProfile } from "@/lib/ai/schemas";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({ meta: [{ title: "Set up your profile — GymSathi" }] }),
  component: Onboarding,
});

const empty: UserProfile = {
  age: 25,
  gender: "male",
  height_cm: 170,
  weight_kg: 70,
  goal: "gain_muscle",
  activity_level: "moderate",
  gym_access: "full_gym",
  experience: "beginner",
  injuries: "",
  diet_preference: "non_vegetarian",
  allergies: "",
  disliked_foods: "",
  cuisine_preference: "indian",
  weekly_budget: null,
  cooking_time_min: 30,
  meal_prep_days: 2,
  meals_per_day: 4,
  target_protein: null,
  name: null,
  workout_days_per_week: 4,
  water_goal_liters: 3,
  step_goal: 8000,
  reminders_enabled: false,
  workout_time_pref: "morning",
};

function Onboarding() {
  const navigate = useNavigate();
  const { profile, loading, save, user } = useProfile();
  const [form, setForm] = useState<UserProfile>(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading…</div>;
  if (!user)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="font-display text-xl font-bold">Sign in first</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an account to set up your AI Coach profile.
        </p>
        <Link
          to="/profile"
          className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Go to sign in
        </Link>
      </div>
    );

  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const parsed = UserProfileSchema.parse(form);
      await save(parsed);
      toast.success("Profile saved!");
      navigate({ to: "/coach" });
    } catch (err) {
      toast.error((err as Error)?.message || "Please check your inputs");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Set up your AI Coach</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about you so we can build personalized meal and workout plans.
        </p>
        <Link
          to="/onboarding-chat"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          💬 Prefer chat? Try the chat onboarding →
        </Link>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-3xl border border-border bg-card p-5 md:p-6"
      >
        <Section title="About you">
          <div className="grid grid-cols-2 gap-3">
            <Num label="Age" value={form.age} onChange={(v) => set("age", v)} />
            <Select
              label="Gender"
              value={form.gender}
              onChange={(v) => set("gender", v as UserProfile["gender"])}
              options={[
                ["male", "Male"],
                ["female", "Female"],
                ["other", "Other"],
              ]}
            />
            <Num
              label="Height (cm)"
              value={form.height_cm}
              onChange={(v) => set("height_cm", v)}
              step={1}
            />
            <Num
              label="Weight (kg)"
              value={form.weight_kg}
              onChange={(v) => set("weight_kg", v)}
              step={0.5}
            />
          </div>
        </Section>

        <Section title="Your goal">
          <Select
            label="Primary goal"
            value={form.goal}
            onChange={(v) => set("goal", v as UserProfile["goal"])}
            options={[
              ["lose_fat", "Lose fat"],
              ["gain_muscle", "Gain muscle"],
              ["maintain", "Maintain"],
              ["improve_fitness", "Improve fitness"],
            ]}
          />
          <Select
            label="Activity level"
            value={form.activity_level}
            onChange={(v) => set("activity_level", v as UserProfile["activity_level"])}
            options={[
              ["sedentary", "Sedentary"],
              ["light", "Lightly active"],
              ["moderate", "Moderately active"],
              ["active", "Very active"],
              ["very_active", "Extra active"],
            ]}
          />
        </Section>

        <Section title="Workout setup">
          <Select
            label="Gym access"
            value={form.gym_access}
            onChange={(v) => set("gym_access", v as UserProfile["gym_access"])}
            options={[
              ["full_gym", "Full gym"],
              ["home", "Home equipment"],
              ["no_equipment", "No equipment"],
            ]}
          />
          <Select
            label="Experience"
            value={form.experience}
            onChange={(v) => set("experience", v as UserProfile["experience"])}
            options={[
              ["beginner", "Beginner"],
              ["intermediate", "Intermediate"],
              ["advanced", "Advanced"],
            ]}
          />
          <Text
            label="Injuries / limitations (optional)"
            value={form.injuries || ""}
            onChange={(v) => set("injuries", v)}
            placeholder="e.g. lower back pain"
          />
        </Section>

        <Section title="Food preferences">
          <Select
            label="Diet"
            value={form.diet_preference}
            onChange={(v) => set("diet_preference", v as UserProfile["diet_preference"])}
            options={[
              ["vegetarian", "Vegetarian"],
              ["non_vegetarian", "Non-vegetarian"],
              ["vegan", "Vegan"],
              ["eggetarian", "Eggetarian"],
            ]}
          />
          <Select
            label="Cuisine"
            value={form.cuisine_preference}
            onChange={(v) => set("cuisine_preference", v as UserProfile["cuisine_preference"])}
            options={[
              ["indian", "Indian"],
              ["punjabi", "Punjabi"],
              ["canadian_simple", "Simple Canadian grocery"],
              ["mixed", "Mixed"],
            ]}
          />
          <Text
            label="Allergies (optional)"
            value={form.allergies || ""}
            onChange={(v) => set("allergies", v)}
            placeholder="e.g. peanuts, lactose"
          />
          <Text
            label="Foods you dislike (optional)"
            value={form.disliked_foods || ""}
            onChange={(v) => set("disliked_foods", v)}
            placeholder="e.g. mushrooms, fish"
          />
        </Section>

        <Section title="Logistics (optional)">
          <div className="grid grid-cols-2 gap-3">
            <Num
              label="Weekly food budget"
              value={form.weekly_budget ?? 0}
              onChange={(v) => set("weekly_budget", v || null)}
            />
            <Num
              label="Cooking time/day (min)"
              value={form.cooking_time_min ?? 30}
              onChange={(v) => set("cooking_time_min", v || null)}
            />
            <Num
              label="Meal prep days/week"
              value={form.meal_prep_days ?? 2}
              onChange={(v) => set("meal_prep_days", v || null)}
            />
            <Num
              label="Meals per day"
              value={form.meals_per_day ?? 4}
              onChange={(v) => set("meals_per_day", v || null)}
            />
            <Num
              label="Target protein (g)"
              value={form.target_protein ?? 0}
              onChange={(v) => set("target_protein", v || null)}
            />
          </div>
        </Section>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save & continue"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          GymSathi provides general fitness and nutrition guidance only. Not medical advice.
        </p>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}
function Num({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}
function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
