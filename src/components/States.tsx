import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, message, action, className }: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center", className)}>
      {Icon && (
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {message && <p className="mt-1 text-sm text-muted-foreground">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
          <div className="aspect-video w-full rounded-lg bg-secondary" />
          <div className="mt-3 h-4 w-3/4 rounded bg-secondary" />
          <div className="mt-2 h-3 w-1/2 rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <h3 className="font-display text-lg font-semibold text-destructive">Something went wrong</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message ?? "Please try again."}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Try again
        </button>
      )}
    </div>
  );
}
