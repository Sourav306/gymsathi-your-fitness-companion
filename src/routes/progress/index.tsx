import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Activity, Target, Dumbbell, Droplet, Scale, Flame } from "lucide-react";
import { useProgress, type ProgressLog } from "@/hooks/use-progress";
import { useProfile } from "@/hooks/use-profile";
import { calcTargets } from "@/lib/ai/targets";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";

export const Route = createFileRoute("/progress/")({
  head: () => ({ meta: [{ title: "Progress — GymSathi" }] }),
  component: ProgressPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function ProgressPage() {
  const { user, logs, todayLog, loading, error, upsert } = useProgress();
  const { profile } = useProfile();
  const [form, setForm] = useState<Partial<ProgressLog>>({ log_date: today() });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (todayLog) setForm(todayLog);
    else setForm({ log_date: today() });
  }, [todayLog]);

  if (loading) return <LoadingState rows={3} />;
  if (!user)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Sign in to track your progress.</p>
        <Link
          to="/profile"
          className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );

  const targets = profile ? calcTargets(profile) : null;
  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
  const last7 = sorted.slice(-7);
  const latest = sorted[sorted.length - 1] || null;
  const workoutStreak = (() => {
    let s = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].workout_completed) s++;
      else break;
    }
    return s;
  })();
  const mealCount = sorted.filter((l) => l.meal_plan_completed).length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsert({
        ...form,
        weight_kg:
          form.weight_kg != null && form.weight_kg !== ("" as any) ? Number(form.weight_kg) : null,
        calories_consumed:
          form.calories_consumed != null && form.calories_consumed !== ("" as any)
            ? Number(form.calories_consumed)
            : null,
        protein_consumed:
          form.protein_consumed != null && form.protein_consumed !== ("" as any)
            ? Number(form.protein_consumed)
            : null,
        water_liters:
          form.water_liters != null && form.water_liters !== ("" as any)
            ? Number(form.water_liters)
            : null,
      });
      toast.success("Progress saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">Log daily and watch the trend.</p>
      </header>

      {error && <ErrorState message={error} />}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          icon={Scale}
          label="Latest weight"
          value={latest?.weight_kg ? `${latest.weight_kg} kg` : "—"}
        />
        <Stat
          icon={Flame}
          label="Calories today"
          value={
            todayLog?.calories_consumed
              ? `${todayLog.calories_consumed}${targets ? ` / ${targets.calories}` : ""}`
              : "—"
          }
        />
        <Stat
          icon={Target}
          label="Protein today"
          value={
            todayLog?.protein_consumed
              ? `${todayLog.protein_consumed}${targets ? ` / ${targets.protein}g` : "g"}`
              : "—"
          }
        />
        <Stat
          icon={Dumbbell}
          label="Workout streak"
          value={`${workoutStreak} day${workoutStreak === 1 ? "" : "s"}`}
        />
        <Stat icon={Activity} label="Meals followed" value={`${mealCount}`} />
        <Stat
          icon={Droplet}
          label="Water today"
          value={todayLog?.water_liters ? `${todayLog.water_liters} L` : "—"}
        />
      </div>

      {/* Form */}
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="font-display text-lg font-bold">
          {todayLog ? "Update today's log" : "Log today"}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Weight (kg)">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={form.weight_kg ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value as any }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label="Water (litres)">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={form.water_liters ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, water_liters: e.target.value as any }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label="Calories consumed">
            <input
              type="number"
              inputMode="numeric"
              value={form.calories_consumed ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, calories_consumed: e.target.value as any }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
          <Field label="Protein (g)">
            <input
              type="number"
              inputMode="numeric"
              value={form.protein_consumed ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, protein_consumed: e.target.value as any }))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          <Toggle
            checked={!!form.workout_completed}
            onChange={(v) => setForm((f) => ({ ...f, workout_completed: v }))}
            label="Workout completed"
          />
          <Toggle
            checked={!!form.meal_plan_completed}
            onChange={(v) => setForm((f) => ({ ...f, meal_plan_completed: v }))}
            label="Meal plan followed"
          />
        </div>
        <Field label="Notes">
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Field>
        <button
          disabled={saving}
          className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving…" : todayLog ? "Update log" : "Save log"}
        </button>
      </form>

      {/* Charts */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No logs yet"
          message="Log today to start tracking your progress."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Chart title="Weight trend">
            <LineChart data={sorted}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
              <XAxis dataKey="log_date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight_kg"
                stroke="currentColor"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </Chart>
          <Chart title="Protein intake (g)">
            <LineChart data={sorted}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
              <XAxis dataKey="log_date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="protein_consumed"
                stroke="currentColor"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </Chart>
          <Chart title="Calories intake">
            <LineChart data={sorted}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
              <XAxis dataKey="log_date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="calories_consumed"
                stroke="currentColor"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </Chart>
          <Chart title="Workouts last 7 days">
            <BarChart data={last7.map((l) => ({ ...l, w: l.workout_completed ? 1 : 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
              <XAxis dataKey="log_date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} domain={[0, 1]} ticks={[0, 1]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="w" fill="currentColor" />
            </BarChart>
          </Chart>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        GymSathi provides general fitness and nutrition guidance only. It is not medical advice.
        Consult a professional for medical conditions, injuries, or special diets.
      </p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
    >
      {checked ? "✓ " : ""}
      {label}
    </button>
  );
}

function Chart({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-primary">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
