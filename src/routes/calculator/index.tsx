import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Beef, Activity as ActivityIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calculator/")({
  head: () => ({
    meta: [
      { title: "Calorie & Protein Calculator — GymSathi" },
      { name: "description", content: "Estimate your daily calorie and protein needs based on your goal." },
    ],
  }),
  component: Calc,
});

type Sex = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active" | "very";
type Goal = "lose" | "maintain" | "gain";

const ACTIVITY_LABEL: Record<Activity, { label: string; mult: number; desc: string }> = {
  sedentary: { label: "Sedentary", mult: 1.2, desc: "Desk job, little exercise" },
  light: { label: "Light", mult: 1.375, desc: "1–3 workouts / week" },
  moderate: { label: "Moderate", mult: 1.55, desc: "3–5 workouts / week" },
  active: { label: "Active", mult: 1.725, desc: "6–7 workouts / week" },
  very: { label: "Very Active", mult: 1.9, desc: "Athlete / physical job" },
};

function Calc() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState<Activity>("light");
  const [goal, setGoal] = useState<Goal>("maintain");

  // Mifflin-St Jeor
  const bmr = sex === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const tdee = Math.round(bmr * ACTIVITY_LABEL[activity].mult);
  const calories = goal === "lose" ? tdee - 400 : goal === "gain" ? tdee + 300 : tdee;
  const proteinPerKg = goal === "lose" ? 2.0 : goal === "gain" ? 1.8 : 1.6;
  const protein = Math.round(weight * proteinPerKg);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Calorie & Protein Calculator</h1>
        <p className="mt-1 text-sm text-muted-foreground">A simple estimate to set your daily targets.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 rounded-3xl border border-border bg-card p-6">
          <div className="grid grid-cols-2 gap-2">
            {(["male","female"] as Sex[]).map((s) => (
              <button key={s} onClick={() => setSex(s)}
                className={cn("rounded-xl border px-4 py-2.5 text-sm font-medium capitalize",
                  sex === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Age" suffix="yrs" value={age} setValue={setAge} min={15} max={80} />
            <Field label="Height" suffix="cm" value={height} setValue={setHeight} min={120} max={220} />
            <Field label="Weight" suffix="kg" value={weight} setValue={setWeight} min={35} max={200} />
          </div>

          <div>
            <Label>Activity Level</Label>
            <div className="mt-2 grid gap-2">
              {(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => (
                <button key={a} onClick={() => setActivity(a)}
                  className={cn("flex items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                    activity === a ? "border-primary bg-accent" : "border-border bg-background hover:border-primary/30")}>
                  <div>
                    <div className="text-sm font-semibold">{ACTIVITY_LABEL[a].label}</div>
                    <div className="text-xs text-muted-foreground">{ACTIVITY_LABEL[a].desc}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">×{ACTIVITY_LABEL[a].mult}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Goal</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["lose","maintain","gain"] as Goal[]).map((g) => (
                <button key={g} onClick={() => setGoal(g)}
                  className={cn("rounded-xl border px-3 py-2.5 text-sm font-medium capitalize",
                    goal === g ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>
                  {g === "lose" ? "Lose fat" : g === "gain" ? "Gain muscle" : "Maintain"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] lg:sticky lg:top-24">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your daily targets</div>
          <Result icon={Flame} label="Calories" value={`${calories.toLocaleString()} kcal`} />
          <Result icon={Beef} label="Protein" value={`${protein} g`} highlight />
          <Result icon={Activity} label="Maintenance (TDEE)" value={`${tdee.toLocaleString()} kcal`} />
          <p className="pt-2 text-xs text-muted-foreground">
            Estimates use the Mifflin-St Jeor formula. Adjust based on real-world results after 2–3 weeks.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}
function Field({ label, suffix, value, setValue, min, max }: { label: string; suffix: string; value: number; setValue: (n: number) => void; min: number; max: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex items-center gap-1 rounded-xl border border-border bg-background px-3">
        <input type="number" value={value} min={min} max={max}
          onChange={(e) => setValue(Number(e.target.value))}
          className="h-11 w-full bg-transparent text-sm outline-none" />
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}
function Result({ icon: Icon, label, value, highlight }: { icon: typeof Flame; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between rounded-2xl border border-border p-4",
      highlight ? "bg-primary text-primary-foreground" : "bg-background")}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <div className="text-sm font-medium">{label}</div>
      </div>
      <div className="font-display text-xl font-bold">{value}</div>
    </div>
  );
}
