import { cn } from "@/lib/utils";

export interface ChipOption<T extends string> { key: T; label: string }

export function FilterChips<T extends string>({
  options, value, onChange, label, multi = false,
}: {
  options: ChipOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  label?: string;
  multi?: boolean;
}) {
  const toggle = (k: T) => {
    if (!multi) { onChange(value[0] === k ? [] : [k]); return; }
    onChange(value.includes(k) ? value.filter((v) => v !== k) : [...value, k]);
  };
  return (
    <div>
      {label && <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {options.map((o) => {
          const active = value.includes(o.key);
          return (
            <button key={o.key} type="button" onClick={() => toggle(o.key)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition active:scale-95",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
