import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { UserProfileSchema, type UserProfile } from "@/lib/ai/schemas";

export const Route = createFileRoute("/onboarding-chat/")({
  head: () => ({ meta: [{ title: "AI Coach Onboarding — GymSathi" }] }),
  component: ChatOnboarding,
});

type FieldKey = keyof UserProfile;
type StepKind = "text" | "number" | "select";

interface Step {
  key: FieldKey;
  prompt: (p: Partial<UserProfile>) => string;
  kind: StepKind;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number; max?: number; step?: number;
  optional?: boolean;
}

const STEPS: Step[] = [
  { key: "name", prompt: () => "Hi! I'm your AI Coach. What should I call you?", kind: "text", placeholder: "Your name" },
  { key: "age", prompt: (p) => `Nice to meet you, ${p.name || "friend"}. How old are you?`, kind: "number", min: 10, max: 100, placeholder: "e.g. 28" },
  { key: "gender", prompt: () => "What's your gender?", kind: "select", options: [
    { value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" },
  ]},
  { key: "height_cm", prompt: () => "What's your height in cm?", kind: "number", min: 100, max: 250, placeholder: "e.g. 172" },
  { key: "weight_kg", prompt: () => "And your current weight in kg?", kind: "number", min: 30, max: 250, step: 0.5, placeholder: "e.g. 72" },
  { key: "goal", prompt: () => "What's your main goal?", kind: "select", options: [
    { value: "lose_fat", label: "Lose fat" }, { value: "gain_muscle", label: "Gain muscle" },
    { value: "maintain", label: "Maintain" }, { value: "improve_fitness", label: "Improve fitness" },
  ]},
  { key: "experience", prompt: () => "How would you describe your fitness level?", kind: "select", options: [
    { value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" },
  ]},
  { key: "activity_level", prompt: () => "How active are you outside the gym?", kind: "select", options: [
    { value: "sedentary", label: "Sedentary (desk job)" }, { value: "light", label: "Lightly active" },
    { value: "moderate", label: "Moderately active" }, { value: "active", label: "Very active" }, { value: "very_active", label: "Extra active" },
  ]},
  { key: "gym_access", prompt: () => "Where will you be training?", kind: "select", options: [
    { value: "full_gym", label: "Full gym" }, { value: "home", label: "Home with some equipment" }, { value: "no_equipment", label: "No equipment" },
  ]},
  { key: "workout_days_per_week", prompt: () => "How many days per week can you train?", kind: "number", min: 1, max: 7, placeholder: "e.g. 4" },
  { key: "workout_time_min", prompt: () => "How long can each session be (minutes)?", kind: "number", min: 15, max: 120, placeholder: "e.g. 45" },
  { key: "injuries", prompt: () => "Any injuries or limitations I should know about?", kind: "text", placeholder: "e.g. lower back, knee pain — or 'none'", optional: true },
  { key: "diet_preference", prompt: () => "What's your diet preference?", kind: "select", options: [
    { value: "vegetarian", label: "Vegetarian" }, { value: "non_vegetarian", label: "Non-vegetarian" },
    { value: "vegan", label: "Vegan" }, { value: "eggetarian", label: "Eggetarian" },
  ]},
  { key: "liked_foods", prompt: () => "Which foods do you enjoy most?", kind: "text", placeholder: "e.g. paneer, chicken, dal, eggs", optional: true },
  { key: "disliked_foods", prompt: () => "Any foods you really dislike?", kind: "text", placeholder: "e.g. mushrooms, fish — or 'none'", optional: true },
  { key: "allergies", prompt: () => "Any food allergies?", kind: "text", placeholder: "e.g. peanuts, lactose — or 'none'", optional: true },
  { key: "cuisine_preference", prompt: () => "Preferred cuisine?", kind: "select", options: [
    { value: "indian", label: "Indian" }, { value: "punjabi", label: "Punjabi" },
    { value: "canadian_simple", label: "Simple Canadian grocery" }, { value: "mixed", label: "Mixed" },
  ]},
  { key: "cooking_time_min", prompt: () => "How many minutes per day can you cook?", kind: "number", min: 5, max: 180, placeholder: "e.g. 30" },
  { key: "meal_prep_style", prompt: () => "How do you like to prep meals?", kind: "select", options: [
    { value: "fresh_daily", label: "Fresh daily" }, { value: "batch_2x_week", label: "Batch cook 2× a week" },
    { value: "batch_weekly", label: "Batch cook once a week" }, { value: "mixed", label: "Mixed" },
  ]},
  { key: "budget_level", prompt: () => "What's your food budget like?", kind: "select", options: [
    { value: "low", label: "Low — keep it cheap" }, { value: "medium", label: "Medium" }, { value: "high", label: "High — quality first" },
  ]},
  { key: "water_goal_liters", prompt: () => "Daily water goal (liters)?", kind: "number", min: 1, max: 8, step: 0.5, placeholder: "e.g. 3" },
  { key: "step_goal", prompt: () => "Daily step goal?", kind: "number", min: 2000, max: 25000, step: 500, placeholder: "e.g. 8000" },
  { key: "sleep_goal_hours", prompt: () => "How many hours of sleep do you aim for?", kind: "number", min: 5, max: 12, step: 0.5, placeholder: "e.g. 7.5" },
];

interface Msg { role: "ai" | "user"; text: string }

function ChatOnboarding() {
  const navigate = useNavigate();
  const { profile, loading, save, user } = useProfile();
  const [answers, setAnswers] = useState<Partial<UserProfile>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIdx];
  const done = stepIdx >= STEPS.length;

  // Seed with first AI prompt once
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "ai", text: STEPS[0].prompt({}) }]);
    }
  }, [messages.length]);

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile && Object.keys(answers).length === 0) {
      setAnswers(profile);
    }
  }, [profile, answers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (rawValue: string) => {
    if (!step) return;
    let v: any = rawValue.trim();
    if (!v && step.optional) v = "";
    if (!v && !step.optional) {
      toast.error("Please enter a value");
      return;
    }
    if (step.kind === "number") {
      const n = Number(v);
      if (Number.isNaN(n)) { toast.error("Please enter a number"); return; }
      v = n;
    }
    setAnswers((a) => ({ ...a, [step.key]: v }));
    setMessages((m) => [...m, { role: "user", text: String(rawValue || "—") }]);
    setInput("");

    const next = stepIdx + 1;
    if (next < STEPS.length) {
      const merged = { ...answers, [step.key]: v };
      setMessages((m) => [...m, { role: "ai", text: STEPS[next].prompt(merged) }]);
      setStepIdx(next);
    } else {
      setMessages((m) => [...m, { role: "ai", text: "Perfect! I've got everything I need. Saving your profile…" }]);
      setStepIdx(next);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      const merged: any = { ...profile, ...answers, onboarding_completed: true };
      // fill required defaults if user pre-existed without them
      const defaults: Partial<UserProfile> = {
        injuries: "", allergies: "", disliked_foods: "", liked_foods: "",
        weekly_budget: null, cooking_time_min: 30, meal_prep_days: 2, meals_per_day: 4, target_protein: null,
      };
      const final: any = { ...defaults, ...merged };
      const parsed = UserProfileSchema.parse(final);
      await save(parsed);
      toast.success("Profile saved!");
      navigate({ to: "/" });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (done && !busy) finish(); /* eslint-disable-next-line */ }, [done]);

  const progress = useMemo(() => Math.round((stepIdx / STEPS.length) * 100), [stepIdx]);

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading…</div>;
  if (!user) return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
      <h1 className="font-display text-xl font-bold">Sign in first</h1>
      <p className="mt-2 text-sm text-muted-foreground">Create an account to chat with your AI Coach.</p>
      <Link to="/profile" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Go to sign in</Link>
    </div>
  );

  return (
    <div className="mx-auto flex h-[calc(100dvh-160px)] max-w-2xl flex-col">
      <header className="mb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-bold">AI Coach</div>
            <div className="text-xs text-muted-foreground">{progress}% complete · prefer the form? <Link to="/onboarding" className="text-primary underline">use form view</Link></div>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "ai" ? "flex justify-start" : "flex justify-end"}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "ai" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {!done && step && (
        <form
          onSubmit={(e) => { e.preventDefault(); submit(input); }}
          className="mt-3 rounded-2xl border border-border bg-background p-2"
        >
          {step.kind === "select" ? (
            <div className="flex flex-wrap gap-2 p-1">
              {step.options!.map((o) => (
                <button key={o.value} type="button" onClick={() => submit(o.value)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-secondary">
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                inputMode={step.kind === "number" ? "decimal" : "text"}
                type={step.kind === "number" ? "number" : "text"}
                step={step.step}
                min={step.min}
                max={step.max}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={step.placeholder}
                className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="submit" className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
          {step.optional && (
            <button type="button" onClick={() => submit("")} className="mt-1 text-[11px] text-muted-foreground hover:text-foreground">
              Skip
            </button>
          )}
        </form>
      )}

      {done && (
        <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          {busy ? "Saving your profile…" : "Done!"}
        </div>
      )}
    </div>
  );
}
