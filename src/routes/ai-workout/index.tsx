import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Dumbbell, Trash2, BookOpen, ExternalLink, RefreshCw, Save, CheckCircle2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { generateWorkoutPlan } from "@/lib/ai/coach.functions";
import type { WorkoutPlan } from "@/lib/ai/schemas";
import { ErrorState, LoadingState } from "@/components/States";
import { supabase } from "@/integrations/supabase/client";
import { fetchRecentProgress } from "@/lib/ai/progress-summary";
import { useSavedWorkoutPlans } from "@/hooks/use-saved-plans";
import { matchExercise, suggestExerciseAlternatives } from "@/lib/match/exercises";
import { SwapDrawer, type SwapOption } from "@/components/SwapDrawer";
import { EXERCISES } from "@/data/exercises";

export const Route = createFileRoute("/ai-workout/")({
  head: () => ({ meta: [{ title: "AI Workout Planner — GymSathi" }] }),
  component: Page,
});

function todayISO() { return new Date().toISOString().slice(0, 10); }

function Page() {
  const { profile, loading, user } = useProfile();
  const gen = useServerFn(generateWorkoutPlan);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [source, setSource] = useState<"ai" | "mock" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [doneDays, setDoneDays] = useState<Set<number>>(new Set());
  const [swap, setSwap] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const saved = useSavedWorkoutPlans(user?.id);

  if (loading) return <LoadingState rows={3} />;
  if (!user) return <Redirect msg="Sign in to use the AI workout planner." to="/profile" cta="Sign in" />;
  if (!profile) return <Redirect msg="Set up your profile first." to="/onboarding" cta="Start onboarding" />;

  const run = async () => {
    setBusy(true); setErr(null);
    try {
      const recentProgress = await fetchRecentProgress(user.id);
      const res = await gen({ data: { profile, recentProgress } });
      setPlan(res.plan); setSource(res.source); setDirty(false); setDoneDays(new Set());
      toast.success(res.source === "ai" ? "AI workout plan ready!" : "Generated using demo data");
      setSaving(true);
      const { error: saveErr } = await supabase.from("ai_workout_plans").insert({
        user_id: user.id, name: res.plan.name, plan: res.plan as any,
      });
      setSaving(false);
      if (saveErr) toast.error("Couldn't save plan — it's still visible below.");
      else { toast.success("Plan saved"); saved.refresh(); }
    } catch (e: any) { setErr(e?.message || "Failed to generate plan"); }
    finally { setBusy(false); }
  };

  const openSaved = (p: WorkoutPlan) => {
    setPlan(p); setSource("ai"); setErr(null); setDirty(false); setDoneDays(new Set());
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id: string) => {
    const ok = await saved.remove(id);
    if (ok) toast.success("Deleted"); else toast.error("Could not delete");
  };

  const swapExercise = (exId: string) => {
    if (!plan || !swap) return;
    const lib = EXERCISES.find(e => e.id === exId);
    if (!lib) return;
    const { dayIdx, exIdx } = swap;
    const old = plan.days[dayIdx].exercises[exIdx];
    const newEx = {
      ...old,
      name: lib.name,
      muscle: lib.muscle,
      difficulty: lib.difficulty,
      formTip: lib.tips[0] || old.formTip,
      commonMistake: lib.mistakes[0] || old.commonMistake,
    };
    const newExs = [...plan.days[dayIdx].exercises];
    newExs[exIdx] = newEx;
    const newDays = [...plan.days];
    newDays[dayIdx] = { ...newDays[dayIdx], exercises: newExs };
    setPlan({ ...plan, days: newDays });
    setSwap(null); setDirty(true);
    toast.success("Exercise swapped");
  };

  const saveChanges = async () => {
    if (!plan) return;
    setSaving(true);
    const { error } = await supabase.from("ai_workout_plans").insert({
      user_id: user.id, name: `${plan.name} (edited)`, plan: plan as any,
    });
    setSaving(false);
    if (error) toast.error("Could not save"); else { toast.success("Saved"); setDirty(false); saved.refresh(); }
  };

  const markDayDone = async (dayIdx: number) => {
    const next = new Set(doneDays);
    next.has(dayIdx) ? next.delete(dayIdx) : next.add(dayIdx);
    setDoneDays(next);
    if (dayIdx === 0 && next.has(0)) {
      const { error } = await supabase.from("progress_logs").upsert(
        { user_id: user.id, log_date: todayISO(), workout_completed: true },
        { onConflict: "user_id,log_date" }
      );
      if (error) toast.error("Couldn't update progress"); else toast.success("Marked today complete");
    }
  };

  const swapMeta = useMemo(() => {
    if (!plan || !swap) return { title: "", options: [] as SwapOption[] };
    const ex = plan.days[swap.dayIdx].exercises[swap.exIdx];
    const matched = matchExercise(ex);
    const alts = suggestExerciseAlternatives(ex, profile, matched?.id);
    return {
      title: `Swap "${ex.name}"`,
      options: alts.map(e => ({
        id: e.id,
        title: e.name,
        subtitle: `${e.muscle} · ${e.difficulty} · ${e.equipment}`,
        meta: e.summary,
      })),
    };
  }, [plan, swap, profile]);

  return (
    <div className="space-y-6">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" /> AI Workout
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold">Your personalized workout</h1>
        <p className="text-sm text-muted-foreground">Built around your gym access, experience and limitations.</p>
      </header>

      {!plan && (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Build a multi-day plan with sets, reps, form tips and rest times.</p>
          <button onClick={run} disabled={busy} className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Generating…" : "Generate my workout plan"}
          </button>
        </div>
      )}

      {err && <ErrorState message={err} onRetry={run} />}

      {plan && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="font-display text-xl font-bold">{plan.name}</div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">{source === "ai" ? "Generated by AI" : "Demo plan"}</span>
              {saving && <span className="rounded-full bg-secondary px-2 py-1">Saving…</span>}
              {dirty && <span className="rounded-full bg-secondary px-2 py-1">Unsaved swaps</span>}
              <button onClick={run} disabled={busy} className="rounded-full border border-border px-2 py-1 hover:bg-secondary">{busy ? "…" : "Regenerate"}</button>
              {dirty && (
                <button onClick={saveChanges} disabled={saving} className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-primary-foreground disabled:opacity-50">
                  <Save className="h-3 w-3" /> Save as new plan
                </button>
              )}
            </div>
          </div>

          <section className="space-y-3">
            {plan.days.map((d, i) => {
              const dayDone = doneDays.has(i);
              return (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                      <div className="font-semibold">{d.day} · {d.focus}</div>
                      <div className="text-xs text-muted-foreground">~{d.durationMin} min</div>
                    </div>
                    <button onClick={() => markDayDone(i)} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${dayDone ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent/40"}`}>
                      <CheckCircle2 className="h-3 w-3" /> {dayDone ? "Completed" : "Mark workout completed"}
                    </button>
                  </div>
                  <div className="divide-y divide-border">
                    {d.exercises.map((ex, j) => {
                      const matched = matchExercise(ex);
                      return (
                        <div key={j} className="px-4 py-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="font-semibold">{ex.name}</div>
                            <div className="text-xs text-muted-foreground">{ex.sets} × {ex.reps} · {ex.rest}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{ex.muscle} · {ex.difficulty}</div>
                          <div className="mt-1 text-xs"><span className="font-semibold">Form:</span> {ex.formTip}</div>
                          <div className="text-xs text-destructive/80"><span className="font-semibold">Avoid:</span> {ex.commonMistake}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {matched && (
                              <Link to="/exercises/$id" params={{ id: matched.id }} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 hover:bg-accent/40">
                                <ExternalLink className="h-3 w-3" /> View Exercise
                              </Link>
                            )}
                            <button onClick={() => setSwap({ dayIdx: i, exIdx: j })} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 hover:bg-accent/40">
                              <RefreshCw className="h-3 w-3" /> Swap
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><BookOpen className="h-5 w-5" /> Saved workout plans</h2>
        {saved.loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : saved.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No saved plans yet. Generate one above to save it here.
          </div>
        ) : (
          <ul className="space-y-2">
            {saved.items.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3">
                <button onClick={() => openSaved(s.plan)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-semibold">{s.name || "Workout plan"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                </button>
                <button onClick={() => onDelete(s.id)} aria-label="Delete" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">General fitness guidance only. Stop and consult a professional if you feel pain.</p>

      <SwapDrawer
        open={!!swap}
        onOpenChange={(v) => !v && setSwap(null)}
        title={swapMeta.title}
        description="Pick an alternative from your exercise library."
        options={swapMeta.options}
        onPick={swapExercise}
      />
    </div>
  );
}

function Redirect({ msg, to, cta }: { msg: string; to: "/profile" | "/onboarding"; cta: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
      <Link to={to} className="mt-3 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">{cta}</Link>
    </div>
  );
}
