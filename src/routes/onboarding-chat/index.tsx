import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Heart } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { UserProfileSchema, type UserProfile } from "@/lib/ai/schemas";
import { calcTargets } from "@/lib/ai/targets";

export const Route = createFileRoute("/onboarding-chat/")({
  head: () => ({ meta: [{ title: "Chat with Mira — GymSathi" }] }),
  component: MiraOnboarding,
});

type StepKind = "text" | "number" | "select" | "multi" | "date" | "time" | "boolean";
type FieldKey = keyof UserProfile;

interface Step {
  key: FieldKey;
  section: string;
  prompt: (p: Partial<UserProfile>) => string;
  kind: StepKind;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
  skipLabel?: string;
}

const yesNo = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const STEPS: Step[] = [
  // 1. Basic
  {
    key: "name",
    section: "Basics",
    prompt: () =>
      "Hey, I'm Mira 👋 I'll be your AI fitness coach. I'll ask a few quick questions so I can build your meals, workouts, water goals, and reminders around your real life. First — what should I call you?",
    kind: "text",
    placeholder: "Your name",
  },
  {
    key: "dob",
    section: "Basics",
    prompt: (p) =>
      `Nice to meet you, ${p.name || "friend"}! What's your date of birth? I'll use it to set your calorie and protein targets.`,
    kind: "date",
  },
  {
    key: "phone",
    section: "Basics",
    prompt: () =>
      "Optional — drop your phone number if you'd like SMS reminders later. Totally fine to skip.",
    kind: "text",
    placeholder: "+1 555 123 4567",
    optional: true,
    skipLabel: "Skip phone",
  },
  {
    key: "gender",
    section: "Basics",
    prompt: () => "What's your gender? (helps with calorie math)",
    kind: "select",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ],
  },

  // 2. Body & goal
  {
    key: "height_cm",
    section: "Body & goal",
    prompt: () => "How tall are you? (in cm)",
    kind: "number",
    min: 100,
    max: 250,
    placeholder: "e.g. 172",
  },
  {
    key: "weight_kg",
    section: "Body & goal",
    prompt: () => "And your current weight? (in kg)",
    kind: "number",
    min: 30,
    max: 250,
    step: 0.5,
    placeholder: "e.g. 72",
  },
  {
    key: "goal",
    section: "Body & goal",
    prompt: () => "What's your main goal right now?",
    kind: "select",
    options: [
      { value: "lose_fat", label: "Lose fat" },
      { value: "gain_muscle", label: "Gain muscle" },
      { value: "maintain", label: "Maintain" },
      { value: "improve_fitness", label: "Improve fitness" },
    ],
  },
  {
    key: "activity_level",
    section: "Body & goal",
    prompt: () => "How active are you outside of workouts?",
    kind: "select",
    options: [
      { value: "sedentary", label: "Sedentary" },
      { value: "light", label: "Light" },
      { value: "moderate", label: "Moderate" },
      { value: "active", label: "Active" },
      { value: "very_active", label: "Very active" },
    ],
  },

  // 3. Food
  {
    key: "diet_preference",
    section: "Food",
    prompt: () => "Got it. What diet do you follow?",
    kind: "select",
    options: [
      { value: "vegetarian", label: "Vegetarian" },
      { value: "non_vegetarian", label: "Non-veg" },
      { value: "vegan", label: "Vegan" },
      { value: "eggetarian", label: "Eggetarian" },
    ],
  },
  {
    key: "allergies",
    section: "Food",
    prompt: () => "Any allergies I should avoid?",
    kind: "text",
    placeholder: "e.g. peanuts, lactose — or 'none'",
    optional: true,
  },
  {
    key: "liked_foods",
    section: "Food",
    prompt: () => "What foods do you love? I'll prioritize these.",
    kind: "text",
    placeholder: "e.g. paneer, chicken, oats, eggs",
    optional: true,
  },
  {
    key: "disliked_foods",
    section: "Food",
    prompt: () => "Anything you dislike or want me to avoid?",
    kind: "text",
    placeholder: "e.g. mushrooms, fish",
    optional: true,
  },
  {
    key: "dairy_ok",
    section: "Food",
    prompt: () => "Are dairy foods okay? (milk, yogurt, paneer)",
    kind: "boolean",
    options: yesNo,
  },
  {
    key: "eggs_ok",
    section: "Food",
    prompt: () => "Are eggs okay?",
    kind: "boolean",
    options: yesNo,
  },
  {
    key: "preferred_cuisines",
    section: "Food",
    prompt: () => "Which cuisines do you enjoy? Pick as many as you like.",
    kind: "multi",
    options: [
      { value: "indian", label: "Indian" },
      { value: "punjabi", label: "Punjabi" },
      { value: "mediterranean", label: "Mediterranean" },
      { value: "mexican", label: "Mexican" },
      { value: "middle_eastern", label: "Middle Eastern" },
      { value: "asian", label: "Asian" },
      { value: "canadian_simple", label: "Canadian / simple" },
      { value: "global", label: "Mixed / global" },
    ],
  },
  {
    key: "sweet_cravings_pref",
    section: "Food",
    prompt: () => "Do you want high-protein sweet options for cravings?",
    kind: "select",
    options: [
      { value: "yes", label: "Yes, please" },
      { value: "sometimes", label: "Sometimes" },
      { value: "no", label: "No thanks" },
    ],
  },
  {
    key: "spice_level",
    section: "Food",
    prompt: () => "How spicy do you like your food?",
    kind: "select",
    options: [
      { value: "mild", label: "Mild" },
      { value: "medium", label: "Medium" },
      { value: "spicy", label: "Spicy 🔥" },
    ],
  },

  // 4. Meal prep
  {
    key: "meals_per_day",
    section: "Meal prep",
    prompt: () => "How many meals per day do you want?",
    kind: "number",
    min: 2,
    max: 6,
    placeholder: "e.g. 4",
  },
  {
    key: "cooking_time_min",
    section: "Meal prep",
    prompt: () => "How many minutes can you usually spend cooking per day?",
    kind: "number",
    min: 5,
    max: 180,
    placeholder: "e.g. 30",
  },
  {
    key: "meal_prep_style",
    section: "Meal prep",
    prompt: () => "What meal-prep style fits your life?",
    kind: "select",
    options: [
      { value: "fresh_daily", label: "Fresh daily" },
      { value: "batch_2x_week", label: "Batch 2× / week" },
      { value: "batch_weekly", label: "Weekly batch" },
      { value: "mixed", label: "Mixed" },
    ],
  },
  {
    key: "meal_prep_windows",
    section: "Meal prep",
    prompt: () =>
      "Which days/times can you actually meal prep? (e.g. Sunday 4pm, Wednesday evening)",
    kind: "text",
    placeholder: "e.g. Sun 4pm, Wed 7pm",
    optional: true,
  },
  {
    key: "budget_level",
    section: "Meal prep",
    prompt: () => "What's your food budget level?",
    kind: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
  },

  // 5. Schedule
  {
    key: "work_days",
    section: "Schedule",
    prompt: () => "Which days do you usually work?",
    kind: "multi",
    options: [
      { value: "mon", label: "Mon" },
      { value: "tue", label: "Tue" },
      { value: "wed", label: "Wed" },
      { value: "thu", label: "Thu" },
      { value: "fri", label: "Fri" },
      { value: "sat", label: "Sat" },
      { value: "sun", label: "Sun" },
    ],
    optional: true,
  },
  {
    key: "work_time_start",
    section: "Schedule",
    prompt: () => "What time do you usually start work?",
    kind: "time",
    optional: true,
  },
  {
    key: "work_time_end",
    section: "Schedule",
    prompt: () => "And what time do you finish?",
    kind: "time",
    optional: true,
  },
  {
    key: "commute_min",
    section: "Schedule",
    prompt: () => "How long is your commute, one way? (minutes)",
    kind: "number",
    min: 0,
    max: 300,
    placeholder: "e.g. 30",
    optional: true,
  },
  {
    key: "free_time",
    section: "Schedule",
    prompt: () => "When are you usually free? (a quick note is fine)",
    kind: "text",
    placeholder: "e.g. weekday evenings, Sat morning",
    optional: true,
  },
  {
    key: "workout_time_pref",
    section: "Schedule",
    prompt: () => "When do you prefer to workout?",
    kind: "select",
    options: [
      { value: "morning", label: "Morning" },
      { value: "afternoon", label: "Afternoon" },
      { value: "evening", label: "Evening" },
      { value: "night", label: "Night" },
      { value: "flexible", label: "Flexible" },
    ],
  },

  // 6. Workout
  {
    key: "gym_access",
    section: "Workout",
    prompt: () => "Do you have gym access?",
    kind: "select",
    options: [
      { value: "full_gym", label: "Full gym" },
      { value: "home", label: "Home setup" },
      { value: "no_equipment", label: "No equipment" },
    ],
  },
  {
    key: "experience",
    section: "Workout",
    prompt: () => "What's your experience level?",
    kind: "select",
    options: [
      { value: "beginner", label: "Beginner" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
    ],
  },
  {
    key: "injuries",
    section: "Workout",
    prompt: () => "Any injuries or limitations I should plan around?",
    kind: "text",
    placeholder: "e.g. lower back — or 'none'",
    optional: true,
  },
  {
    key: "workout_days_per_week",
    section: "Workout",
    prompt: () => "How many days per week can you train?",
    kind: "number",
    min: 1,
    max: 7,
    placeholder: "e.g. 4",
  },
  {
    key: "workout_time_min",
    section: "Workout",
    prompt: () => "How many minutes per session?",
    kind: "number",
    min: 15,
    max: 120,
    placeholder: "e.g. 45",
  },

  // 7. Water / reminders
  {
    key: "reminders_enabled",
    section: "Reminders",
    prompt: () => "Want me to send water reminders inside the app?",
    kind: "boolean",
    options: yesNo,
  },
  {
    key: "reminder_start",
    section: "Reminders",
    prompt: () => "What time should reminders start?",
    kind: "time",
    optional: true,
  },
  {
    key: "reminder_end",
    section: "Reminders",
    prompt: () => "And what time should they stop?",
    kind: "time",
    optional: true,
  },
  {
    key: "reminder_interval_min",
    section: "Reminders",
    prompt: () => "How often should I nudge you? (minutes)",
    kind: "number",
    min: 30,
    max: 240,
    step: 15,
    placeholder: "e.g. 90",
    optional: true,
  },

  // 8. Home exercise
  {
    key: "morning_exercise",
    section: "Home exercise",
    prompt: () => "Want quick morning home exercises?",
    kind: "boolean",
    options: yesNo,
  },
  {
    key: "afternoon_exercise",
    section: "Home exercise",
    prompt: () => "How about an afternoon stretch / mobility break?",
    kind: "boolean",
    options: yesNo,
  },
  {
    key: "home_exercise_min",
    section: "Home exercise",
    prompt: () => "How many minutes can you give to those?",
    kind: "number",
    min: 5,
    max: 60,
    placeholder: "e.g. 10",
    optional: true,
  },
  {
    key: "equipment",
    section: "Home exercise",
    prompt: () => "What equipment do you have at home?",
    kind: "multi",
    options: [
      { value: "none", label: "None" },
      { value: "dumbbells", label: "Dumbbells" },
      { value: "bands", label: "Resistance bands" },
      { value: "yoga_mat", label: "Yoga mat" },
    ],
    optional: true,
  },
];

interface Msg {
  role: "ai" | "user";
  text: string;
}

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function calcWaterGoal(weightKg?: number, activity?: string): number {
  if (!weightKg) return 2.5;
  let base = weightKg * 0.035;
  if (activity === "active" || activity === "very_active") base += 0.5;
  return Math.round(base * 10) / 10;
}

function MiraOnboarding() {
  const navigate = useNavigate();
  const { profile, loading, save, user } = useProfile();
  const [answers, setAnswers] = useState<Partial<UserProfile>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIdx];
  const done = stepIdx >= STEPS.length;

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "ai", text: STEPS[0].prompt({}) }]);
    }
  }, [messages.length]);

  useEffect(() => {
    if (profile && Object.keys(answers).length === 0) {
      setAnswers(profile);
    }
  }, [profile, answers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMultiSel([]);
    setInput("");
  }, [stepIdx]);

  useEffect(() => {
    if (done) setShowSummary(true);
  }, [done]);

  const advance = (display: string, value: unknown) => {
    setAnswers((a) => ({ ...a, [step.key]: value }));
    setMessages((m) => [...m, { role: "user", text: display }]);
    const next = stepIdx + 1;
    if (next < STEPS.length) {
      const merged = { ...answers, [step.key]: value };
      setMessages((m) => [...m, { role: "ai", text: STEPS[next].prompt(merged) }]);
    }
    setStepIdx(next);
  };

  const submitText = (raw: string) => {
    if (!step) return;
    const v = raw.trim();
    if (!v && !step.optional) {
      toast.error("Please enter a value");
      return;
    }
    if (step.kind === "number") {
      const n = Number(v);
      if (Number.isNaN(n)) {
        toast.error("Please enter a number");
        return;
      }
      advance(String(n), n);
      return;
    }
    advance(v || "—", v || null);
  };

  const submitSelect = (val: string, label: string) => {
    if (step.kind === "boolean") advance(label, val === "true");
    else advance(label, val);
  };

  const submitMulti = () => {
    if (multiSel.length === 0 && !step.optional) {
      toast.error("Pick at least one");
      return;
    }
    const labels = step
      .options!.filter((o) => multiSel.includes(o.value))
      .map((o) => o.label)
      .join(", ");
    advance(labels || "—", multiSel.length ? multiSel : null);
  };

  const skip = () => advance("Skip", null);

  const finish = async () => {
    setBusy(true);
    try {
      const ageVal = ageFromDob(answers.dob) ?? profile?.age ?? 25;
      const merged: Partial<UserProfile> = {
        ...profile,
        ...answers,
        age: ageVal,
        water_goal_liters:
          profile?.water_goal_liters ??
          calcWaterGoal(answers.weight_kg ?? undefined, answers.activity_level ?? undefined),
        onboarding_completed: true,
      };
      const defaults: Partial<UserProfile> = {
        injuries: "",
        allergies: "",
        disliked_foods: "",
        liked_foods: "",
        weekly_budget: null,
        cooking_time_min: 30,
        meal_prep_days: 2,
        meals_per_day: 4,
        target_protein: null,
        cuisine_preference: "mixed",
      };
      const final: Partial<UserProfile> = { ...defaults, ...merged };
      const parsed = UserProfileSchema.parse(final);
      await save(parsed);
      toast.success("All set! Welcome to Mira.");
      navigate({ to: "/" });
    } catch (e) {
      console.error(e);
      toast.error((e as Error)?.message || "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  const progress = useMemo(
    () => Math.round((Math.min(stepIdx, STEPS.length) / STEPS.length) * 100),
    [stepIdx],
  );

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading…</div>;
  if (!user)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="font-display text-xl font-bold">Sign in first</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create an account to chat with Mira.</p>
        <Link
          to="/profile"
          className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Go to sign in
        </Link>
      </div>
    );

  if (showSummary) {
    const ageVal = ageFromDob(answers.dob) ?? profile?.age ?? 25;
    const targets = calcTargets({
      age: ageVal,
      gender: (answers.gender as UserProfile["gender"]) ?? "male",
      height_cm: answers.height_cm ?? 170,
      weight_kg: answers.weight_kg ?? 70,
      activity_level: (answers.activity_level as UserProfile["activity_level"]) ?? "moderate",
      goal: (answers.goal as UserProfile["goal"]) ?? "improve_fitness",
      target_protein: null,
    });
    const water = calcWaterGoal(answers.weight_kg ?? undefined, answers.activity_level ?? undefined);
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg font-bold">Mira's quick summary</div>
            <div className="text-xs text-muted-foreground">Looks good? I'll build your plan.</div>
          </div>
        </header>
        <div className="glass-card space-y-3 rounded-2xl p-4 text-sm">
          <SumRow label="Goal" value={String(answers.goal ?? "—").replace("_", " ")} />
          <SumRow label="Daily protein" value={`${targets.protein} g`} />
          <SumRow label="Daily calories" value={`${targets.calories} kcal`} />
          <SumRow label="Water target" value={`${water} L`} />
          <SumRow label="Diet" value={String(answers.diet_preference ?? "—").replace("_", " ")} />
          <SumRow label="Avoid" value={answers.disliked_foods || answers.allergies || "—"} />
          <SumRow
            label="Cuisines"
            value={(answers.preferred_cuisines || []).join(", ") || "—"}
          />
          <SumRow
            label="Workouts"
            value={`${answers.workout_days_per_week ?? "?"}× / week · ${answers.workout_time_min ?? "?"} min · ${answers.workout_time_pref ?? "flexible"}`}
          />
          <SumRow label="Meal prep" value={answers.meal_prep_windows || answers.meal_prep_style || "—"} />
          <SumRow
            label="Reminders"
            value={
              answers.reminders_enabled
                ? `Every ${answers.reminder_interval_min ?? 90}m · ${answers.reminder_start ?? "—"}–${answers.reminder_end ?? "—"}`
                : "Off"
            }
          />
          <SumRow
            label="Home exercise"
            value={`${answers.morning_exercise ? "AM " : ""}${answers.afternoon_exercise ? "PM " : ""}${answers.home_exercise_min ?? ""}${answers.home_exercise_min ? "min" : ""}`.trim() || "—"}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowSummary(false);
              setStepIdx(STEPS.length - 1);
            }}
            className="glass-button glass-press flex-1 rounded-xl px-4 py-3 text-sm font-semibold"
          >
            Edit answers
          </button>
          <button
            onClick={finish}
            disabled={busy}
            className="glass-button-primary glass-press flex-[2] rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Saving…" : "Looks good — build my plan"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-160px)] max-w-2xl flex-col">
      <header className="mb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-bold">Mira</div>
            <div className="text-xs text-muted-foreground">
              {step?.section} · {progress}%
            </div>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === "ai" ? "flex justify-start" : "flex justify-end"}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "ai" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {!done && step && (
        <div className="mt-3 rounded-2xl border border-border bg-background p-2">
          {step.kind === "select" || step.kind === "boolean" ? (
            <div className="flex flex-wrap gap-2 p-1">
              {step.options!.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => submitSelect(o.value, o.label)}
                  className="glass-pill glass-press rounded-full px-3 py-1.5 text-sm font-medium"
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : step.kind === "multi" ? (
            <div className="space-y-2 p-1">
              <div className="flex flex-wrap gap-2">
                {step.options!.map((o) => {
                  const active = multiSel.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() =>
                        setMultiSel((s) =>
                          s.includes(o.value) ? s.filter((x) => x !== o.value) : [...s, o.value],
                        )
                      }
                      className={`glass-pill glass-press rounded-full px-3 py-1.5 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={submitMulti}
                className="glass-button-primary glass-press w-full rounded-xl px-3 py-2 text-sm font-semibold"
              >
                Continue
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitText(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                inputMode={step.kind === "number" ? "decimal" : "text"}
                type={
                  step.kind === "number"
                    ? "number"
                    : step.kind === "date"
                      ? "date"
                      : step.kind === "time"
                        ? "time"
                        : "text"
                }
                step={step.step}
                min={step.min}
                max={step.max}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={step.placeholder}
                className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
          {step.optional && (
            <button
              type="button"
              onClick={skip}
              className="mt-1 px-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {step.skipLabel || "Skip"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-2 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
