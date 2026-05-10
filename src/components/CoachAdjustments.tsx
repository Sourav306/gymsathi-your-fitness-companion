import { useState } from "react";
import { Sparkles, Check, X, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAdaptiveCoach } from "@/hooks/use-adaptive-coach";
import type { AdaptiveInsight } from "@/lib/coach/adaptive";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Coach = ReturnType<typeof useAdaptiveCoach>;

export function CoachAdjustments({ compact = false, coach }: { compact?: boolean; coach: Coach }) {
  const { active, busy, refresh, apply, dismiss } = coach;

  if (active.length === 0) return null;
  const items = compact ? active.slice(0, 2) : active;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-lg font-bold">Coach Adjustments</h2>
        <button
          onClick={() => {
            refresh().catch((e) => toast.error((e as Error)?.message || "Refresh failed"));
          }}
          disabled={busy}
          className="glass-press text-xs font-semibold text-primary disabled:opacity-50"
        >
          {busy ? "Updating…" : "Refresh"}
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((i) => (
          <InsightCard key={i.id} insight={i} onApply={apply} onDismiss={dismiss} />
        ))}
      </ul>
    </section>
  );
}

function InsightCard({
  insight,
  onApply,
  onDismiss,
}: {
  insight: AdaptiveInsight;
  onApply: (i: AdaptiveInsight) => Promise<void>;
  onDismiss: (i: AdaptiveInsight) => Promise<void>;
}) {
  const [pending, setPending] = useState<"apply" | "dismiss" | null>(null);
  const link = insight.metadata?.link;

  const handle = async (kind: "apply" | "dismiss") => {
    setPending(kind);
    try {
      if (kind === "apply") {
        await onApply(insight);
        toast.success("Added to your plan");
      } else {
        await onDismiss(insight);
      }
    } catch (e) {
      toast.error((e as Error)?.message || "Could not update insight");
    } finally {
      setPending(null);
    }
  };

  return (
    <li className="glass-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="glass-pill grid h-9 w-9 shrink-0 place-items-center text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-bold">{insight.title}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{insight.reason}</p>
          <p className="mt-1 text-xs">
            <span className="font-semibold">Suggestion:</span> {insight.suggested_action}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => handle("apply")}
              disabled={pending !== null}
              className={cn(
                "glass-button-primary glass-press inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50",
              )}
            >
              {pending === "apply" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Apply
            </button>
            <button
              onClick={() => handle("dismiss")}
              disabled={pending !== null}
              className="glass-button glass-press inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {pending === "dismiss" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Dismiss
            </button>
            {link && (
              <Link
                to={link}
                className="glass-press ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                Open <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
