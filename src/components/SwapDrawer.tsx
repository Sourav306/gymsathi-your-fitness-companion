import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface SwapOption {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
}

export function SwapDrawer({
  open,
  onOpenChange,
  title,
  description,
  options,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  options: SwapOption[];
  onPick: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No good alternatives in your library yet.
            </p>
          ) : (
            options.map((o) => (
              <button
                key={o.id}
                onClick={() => onPick(o.id)}
                className="w-full rounded-xl border border-border bg-card p-3 text-left transition hover:bg-accent/40 active:scale-[0.99]"
              >
                <div className="text-sm font-semibold">{o.title}</div>
                {o.subtitle && <div className="text-xs text-muted-foreground">{o.subtitle}</div>}
                {o.meta && <div className="mt-1 text-xs text-primary">{o.meta}</div>}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
